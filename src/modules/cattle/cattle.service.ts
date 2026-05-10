import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cattle, Gender, SourceType } from '../../entities/cattle.entity';
import { CreateCattleDto } from './dto/create-cattle.dto';
import { User } from '../../entities/user.entity';
import { HerdBook } from '../../entities/herd-book.entity';
import { HerdBookCattle } from '../../entities/herd-book-cattle.entity';
import { Character } from '../../entities/character.entity';
import { Event as EventEntity } from '../../entities/event.entity';
import { Treatment } from '../../entities/treatment.entity';
import { EventType } from '../../entities/event-type.entity';
import { CattleRepository, CattleFilters, CattlePaginationOptions } from './cattle.repository';
import { CattleMapper } from './cattle.mapper';
import { CattleQueryDto } from './dto/cattle-query.dto';

@Injectable()
export class CattleService {
    private readonly logger = new Logger(CattleService.name);

    constructor(
        private readonly cattleRepository: CattleRepository,
        @InjectRepository(HerdBook)
        private herdBookRepository: Repository<HerdBook>,
        @InjectRepository(HerdBookCattle)
        private herdBookCattleRepository: Repository<HerdBookCattle>,
        @InjectRepository(Character)
        private characterRepository: Repository<Character>,
        @InjectRepository(EventEntity)
        private eventRepository: Repository<EventEntity>,
        @InjectRepository(Treatment)
        private treatmentRepository: Repository<Treatment>,
        @InjectRepository(EventType)
        private eventTypeRepository: Repository<EventType>,
    ) { }

    async findAll(query: CattleQueryDto, user: User) {
        const filters: CattleFilters = {
            ...query,
            userRole: user.role,
            userOwnerId: user.ownerId
        };

        const pagination: CattlePaginationOptions = {
            page: query.page,
            per_page: query.per_page,
            sort: query.sort,
            order: query.order
        };

        const [rawData, total] = await this.cattleRepository.findAllWithRelations(filters, pagination);

        const data = rawData.map(cattle => CattleMapper.toResponse(cattle, query.herd_book_id));

        return {
            data,
            total,
            page: Number(query.page),
            per_page: Number(query.per_page)
        };
    }

    async findOne(id: string, user: User) {
        const cattle = await this.cattleRepository.findOneWithRelations(id);

        if (!cattle) {
            throw new NotFoundException(`Cattle with ID ${id} not found`);
        }

        // Note: RBAC check could be added here if findOneWithRelations doesn't handle it
        return CattleMapper.toResponse(cattle);
    }

    async create(createCattleDto: CreateCattleDto, user: User) {
        this.logger.debug(`Creating cattle with DTO: ${JSON.stringify(createCattleDto)}`);
        const { character, events, treatments, source, ...cattleData } = createCattleDto;

        // Mapping robuste pour les types de source venant du frontend
        let sourceType: SourceType = SourceType.ACHETE;
        const rawType = source?.type?.toUpperCase();
        
        if (rawType === 'NE_DANS_TROUPEAU' || rawType === 'BORN_ON_FARM') {
            sourceType = SourceType.NE_DANS_TROUPEAU;
        } else {
            sourceType = SourceType.ACHETE;
        }

        const cattle = this.cattleRepository.create({
            ...cattleData,
            id: crypto.randomUUID(),
            characterId: character,
            sourceType: sourceType,
            sourceSupplier: source.supplier,
            sourcePurchaseDate: source.purchaseDate,
            sourcePurchasePrice: source.purchasePrice,
            sourcePurchaseWeight: source.purchaseWeight,
            sourcePurchaseHealthStatus: source.purchaseHealthStatus,
            sourcePurchaseNotes: source.purchaseNotes,
            sourceMotherId: source.motherId,
        });

        await this.cattleRepository.save(cattle);

        // Register in herd book if requested
        if (createCattleDto.herd_book_id) {
            const entry = this.herdBookCattleRepository.create({
                id: crypto.randomUUID(),
                cattleId: cattle.id,
                herdBookId: createCattleDto.herd_book_id,
                categoryId: createCattleDto.category || null,
                statusId: 'STA004', 
            });
            try {
                await this.herdBookCattleRepository.save(entry);
            } catch (error) {
                this.logger.error(`Error registering cattle in herd book: ${error.message}`);
            }
        }

        // Reload with relations
        const savedCattle = await this.cattleRepository.findOneWithBasicRelations(cattle.id);

        return CattleMapper.toResponse(savedCattle, createCattleDto.herd_book_id);
    }

    async update(id: string, updateCattleDto: any, user: User) {
        const cattle = await this.cattleRepository.findOneForUpdate(id);

        if (!cattle) {
            throw new NotFoundException(`Cattle with ID ${id} not found`);
        }

        const { events, treatments, source, category, status, n_carnet, ...cattleData } = updateCattleDto;

        // Update basic fields
        Object.assign(cattle, cattleData);

        // Update Source
        if (source) {
            if (source.type) cattle.sourceType = source.type;
            if (source.supplier) cattle.sourceSupplier = source.supplier;
            if (source.purchaseDate) cattle.sourcePurchaseDate = source.purchaseDate;
            if (source.purchasePrice) cattle.sourcePurchasePrice = source.purchasePrice;
            if (source.purchaseWeight) cattle.sourcePurchaseWeight = source.purchaseWeight;
            if (source.purchaseHealthStatus) cattle.sourcePurchaseHealthStatus = source.purchaseHealthStatus;
            if (source.purchaseNotes) cattle.sourcePurchaseNotes = source.purchaseNotes;
            if (source.motherId) cattle.sourceMotherId = source.motherId;
        }

        // Update Events
        if (events) {
            const incomingIds = events.filter(e => e.id).map(e => e.id);
            const toDelete = cattle.events.filter(e => !incomingIds.includes(e.id));
            if (toDelete.length > 0) {
                await this.eventRepository.remove(toDelete);
            }

            for (const eventData of events) {
                if (eventData.id) {
                    await this.eventRepository.update(eventData.id, {
                        eventTypeId: eventData.type,
                        date: eventData.date,
                        description: eventData.description,
                        details: eventData.details
                    });
                } else {
                    const newEvent = this.eventRepository.create({
                        ...eventData,
                        cattleId: id,
                        eventTypeId: eventData.type,
                        id: crypto.randomUUID()
                    });
                    await this.eventRepository.save(newEvent);
                }
            }
        }

        // Update Treatments
        if (treatments) {
            const incomingIds = treatments.filter(t => t.id).map(t => t.id);
            const toDelete = cattle.treatments.filter(t => !incomingIds.includes(t.id));
            if (toDelete.length > 0) {
                await this.treatmentRepository.remove(toDelete);
            }

            for (const treatmentData of treatments) {
                const dosage = treatmentData.dosage || {};
                const treatmentPayload = {
                    type: treatmentData.type,
                    date: treatmentData.date,
                    medicamentId: treatmentData.product,
                    veterinarianId: treatmentData.veterinarian,
                    notes: treatmentData.notes,
                    dosageQuantite: dosage.quantite,
                    dosageUnite: dosage.unite,
                    animalPoids: dosage.animal_poids,
                    dosageNotes: dosage.notes,
                    dosageOld: typeof treatmentData.dosage === 'string' ? treatmentData.dosage : null
                };

                if (treatmentData.id) {
                    await this.treatmentRepository.update(treatmentData.id, treatmentPayload);
                } else {
                    const newTreatment = this.treatmentRepository.create({
                        ...treatmentPayload,
                        cattleId: id,
                        id: crypto.randomUUID()
                    });
                    await this.treatmentRepository.save(newTreatment);
                }
            }
        }

        // Update HerdBookCattle fields
        if (category || status || n_carnet) {
            const entries = cattle.herdBookEntries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            if (entries.length > 0) {
                const entry = entries[0];
                if (category) entry.categoryId = category;
                if (status) entry.statusId = status;
                if (n_carnet) entry.nCarnet = n_carnet;
                await this.herdBookCattleRepository.save(entry);
            }
        }

        await this.cattleRepository.save(cattle);
        return this.findOne(id, user);
    }

    async remove(id: string, user: User) {
        const cattle = await this.cattleRepository.findOneWithBasicRelations(id);

        if (!cattle) {
            throw new NotFoundException(`Cattle with ID ${id} not found`);
        }

        const response = CattleMapper.toResponse(cattle);
        await this.cattleRepository.remove(cattle);
        return response;
    }

    async getStatistics(ownerId: string, user: User) {
        const totalCattle = await this.cattleRepository.count();
        const males = await this.cattleRepository.count({ where: { gender: Gender.M } });
        const females = await this.cattleRepository.count({ where: { gender: Gender.F } });

        return {
            total: totalCattle,
            males,
            females,
            calves: 0, 
            heifers: 0, 
            cows: 0, 
            bulls: 0 
        };
    }

    async registerBirth(motherId: string, birthData: any, user: User) {
        const mother = await this.cattleRepository.findOne({ where: { id: motherId } });
        if (!mother) {
            throw new NotFoundException(`Mother cattle with ID ${motherId} not found`);
        }

        if (mother.gender !== Gender.F) {
            throw new BadRequestException("Only female cattle can give birth");
        }

        const calf = this.cattleRepository.create({
            id: crypto.randomUUID(),
            name: birthData.name,
            nickname: birthData.nickname,
            gender: birthData.gender,
            birthDate: birthData.birthDate,
            characterId: birthData.character,
            distinctiveSign: birthData.distinctiveSign,
            sourceType: SourceType.NE_DANS_TROUPEAU,
            sourceMotherId: motherId,
        });

        await this.cattleRepository.save(calf);

        const motherEntry = await this.herdBookCattleRepository.findOne({
            where: { cattleId: motherId },
            order: { createdAt: 'DESC' }
        });

        if (motherEntry) {
            const entry = this.herdBookCattleRepository.create({
                id: crypto.randomUUID(),
                cattleId: calf.id,
                herdBookId: motherEntry.herdBookId,
                categoryId: birthData.category,
                statusId: 'STA004', 
            });
            await this.herdBookCattleRepository.save(entry);
        }

        const birthEventType = await this.eventTypeRepository.findOne({ where: { nom: 'Naissance' } });
        if (birthEventType) {
            const calfEvent = this.eventRepository.create({
                id: crypto.randomUUID(),
                cattleId: calf.id,
                eventTypeId: birthEventType.id,
                date: birthData.birthDate,
                description: `Né de ${mother.name} (${motherId})`,
                details: `Naissance enregistrée le ${new Date().toLocaleDateString()}`
            });
            await this.eventRepository.save(calfEvent);

            const motherEvent = this.eventRepository.create({
                id: crypto.randomUUID(),
                cattleId: motherId,
                eventTypeId: birthEventType.id,
                date: birthData.birthDate,
                description: `A donné naissance à ${calf.name}`,
                details: `Veau ${birthData.gender}, naissance enregistrée le ${new Date().toLocaleDateString()}`
            });
            await this.eventRepository.save(motherEvent);
        }

        return this.findOne(calf.id, user);
    }
}

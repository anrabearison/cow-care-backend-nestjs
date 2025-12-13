import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Cattle, Gender, SourceType } from '../../entities/cattle.entity';
import { CreateCattleDto } from './dto/create-cattle.dto';
import { User, UserRole } from '../../entities/user.entity';
import { HerdBook } from '../../entities/herd-book.entity';
import { HerdBookCattle } from '../../entities/herd-book-cattle.entity';
import { Character } from '../../entities/character.entity';
import { Event as EventEntity } from '../../entities/event.entity';
import { Treatment } from '../../entities/treatment.entity';
import { EventType } from '../../entities/event-type.entity';

@Injectable()
export class CattleService {
    constructor(
        @InjectRepository(Cattle)
        private cattleRepository: Repository<Cattle>,
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

    async findAll(query: any, user: User) {
        const {
            page = 1,
            per_page = 10,
            sort = 'id',
            order = 'ASC',
            q,
            gender,
            category,
            character,
            source_type,
            owner_id,
            herd_book_id
        } = query;

        const skip = (page - 1) * per_page;

        const qb = this.cattleRepository.createQueryBuilder('cattle')
            .leftJoinAndSelect('cattle.character', 'character')
            .leftJoinAndSelect('cattle.herdBookEntries', 'herdBookEntries')
            .leftJoinAndSelect('herdBookEntries.herdBook', 'herdBook')
            .leftJoinAndSelect('herdBookEntries.category', 'category')
            .leftJoinAndSelect('herdBookEntries.status', 'status')
            .leftJoinAndSelect('cattle.events', 'events')
            .leftJoinAndSelect('cattle.treatments', 'treatments');

        // Filter by owner if not super admin
        if (user.role !== UserRole.SUPER_ADMIN) {
            if (user.ownerId) {
                qb.andWhere('herdBook.ownerId = :ownerId', { ownerId: user.ownerId });
            } else {
                // Return empty if no owner assigned
                return { data: [], total: 0, page: Number(page), per_page: Number(per_page) };
            }
        } else {
            // Super admin can filter by owner_id
            if (owner_id) {
                qb.andWhere('herdBook.ownerId = :ownerId', { ownerId: owner_id });
            }
        }

        if (herd_book_id) {
            qb.andWhere('herdBook.id = :herdBookId', { herdBookId: herd_book_id });
        }

        if (q) {
            qb.andWhere('(cattle.name ILIKE :q OR cattle.nickname ILIKE :q OR cattle.id ILIKE :q)', { q: `%${q}%` });
        }

        if (gender) {
            qb.andWhere('cattle.gender = :gender', { gender });
        }

        if (character) {
            qb.andWhere('cattle.characterId = :character', { character });
        }

        if (source_type) {
            qb.andWhere('cattle.sourceType = :sourceType', { sourceType: source_type });
        }

        if (category) {
            qb.andWhere('herdBookEntries.categoryId = :category', { category });
        }

        // Apply distinct to avoid duplicates from joins
        qb.distinct(true);

        qb.orderBy(`cattle.${sort}`, order as 'ASC' | 'DESC');
        qb.skip(skip).take(per_page);

        const [rawData, total] = await qb.getManyAndCount();

        const data = rawData.map(cattle => this.toResponse(cattle, herd_book_id));

        return {
            data,
            total,
            page: Number(page),
            per_page: Number(per_page)
        };
    }

    async findOne(id: string, user: User) {
        const qb = this.cattleRepository.createQueryBuilder('cattle')
            .leftJoinAndSelect('cattle.character', 'character')
            .leftJoinAndSelect('cattle.mother', 'mother')
            .leftJoinAndSelect('cattle.herdBookEntries', 'herdBookEntries')
            .leftJoinAndSelect('herdBookEntries.herdBook', 'herdBook')
            .leftJoinAndSelect('herdBookEntries.category', 'category')
            .leftJoinAndSelect('herdBookEntries.status', 'status')
            .leftJoinAndSelect('cattle.events', 'events')
            .leftJoinAndSelect('cattle.treatments', 'treatments')
            .where('cattle.id = :id', { id });

        const cattle = await qb.getOne();

        if (!cattle) {
            throw new NotFoundException(`Cattle with ID ${id} not found`);
        }

        return this.toResponse(cattle);
    }

    private toResponse(cattle: Cattle, herdBookId?: string) {
        // Find relevant herd book entry
        let entry = null;
        if (cattle.herdBookEntries && cattle.herdBookEntries.length > 0) {
            if (herdBookId) {
                entry = cattle.herdBookEntries.find(e => e.herdBookId === herdBookId);
            }
            if (!entry) {
                entry = cattle.herdBookEntries[0];
            }
        }

        return {
            id: cattle.id,
            name: cattle.name,
            nickname: cattle.nickname,
            gender: cattle.gender,
            birthDate: cattle.birthDate,
            character: cattle.character ? {
                id: cattle.character.id,
                name: cattle.character.name
            } : null,
            brand: cattle.brand,
            distinctiveSign: cattle.distinctiveSign,
            photo: cattle.photo,
            created_at: cattle.createdAt,
            updated_at: cattle.updatedAt,

            // Flattened HerdBookCattle fields
            category: entry?.category ? {
                id: entry.category.id,
                name: entry.category.name
            } : null,
            status: entry?.status ? {
                id: entry.status.id,
                name: entry.status.name
            } : null,
            n_carnet: entry?.nCarnet || null,
            owner_id: entry?.herdBook?.ownerId || null,

            // Structured source object
            source: {
                type: cattle.sourceType,
                supplier: cattle.sourceSupplier,
                purchaseDate: cattle.sourcePurchaseDate,
                purchasePrice: cattle.sourcePurchasePrice ? Number(cattle.sourcePurchasePrice) : null,
                purchaseWeight: cattle.sourcePurchaseWeight ? Number(cattle.sourcePurchaseWeight) : null,
                purchaseHealthStatus: cattle.sourcePurchaseHealthStatus,
                purchaseNotes: cattle.sourcePurchaseNotes,
                motherId: cattle.sourceMotherId,
            },

            // Relations
            events: cattle.events || [],
            treatments: cattle.treatments || [],
            herdBookEntries: cattle.herdBookEntries || []
        };
    }

    async create(createCattleDto: CreateCattleDto, user: User) {
        const { character, events, treatments, source, ...cattleData } = createCattleDto;

        // Use source.type directly, validation is handled by DTO and Transformer handles DB mapping
        const sourceType = source.type as SourceType;

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
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await this.cattleRepository.save(cattle);

        // Register in herd book if requested
        if (createCattleDto.herd_book_id) {
            const entry = this.herdBookCattleRepository.create({
                id: crypto.randomUUID(),
                cattleId: cattle.id,
                herdBookId: createCattleDto.herd_book_id,
                categoryId: createCattleDto.category || 'default_category_id',
                statusId: 'STAT004',
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            await this.herdBookCattleRepository.save(entry);
        }

        // Reload with relations
        const savedCattle = await this.cattleRepository.findOne({
            where: { id: cattle.id },
            relations: ['character', 'herdBookEntries', 'herdBookEntries.herdBook', 'herdBookEntries.category', 'herdBookEntries.status', 'events', 'treatments']
        });

        return this.toResponse(savedCattle, createCattleDto.herd_book_id);
    }

    async update(id: string, updateCattleDto: any, user: User) {
        const cattle = await this.cattleRepository.findOne({
            where: { id },
            relations: ['events', 'treatments', 'herdBookEntries', 'herdBookEntries.herdBook']
        });

        if (!cattle) {
            throw new NotFoundException(`Cattle with ID ${id} not found`);
        }

        // Deep update logic
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
            // Delete missing
            const incomingIds = events.filter(e => e.id).map(e => e.id);
            const toDelete = cattle.events.filter(e => !incomingIds.includes(e.id));
            if (toDelete.length > 0) {
                await this.eventRepository.remove(toDelete);
            }

            // Update or Create
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
            // Delete missing
            const incomingIds = treatments.filter(t => t.id).map(t => t.id);
            const toDelete = cattle.treatments.filter(t => !incomingIds.includes(t.id));
            if (toDelete.length > 0) {
                await this.treatmentRepository.remove(toDelete);
            }

            // Update or Create
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
            // Find relevant entry (current year or most recent)
            // For simplicity, we update the first one found or creating a new one might be too complex here without context
            // We'll update the most recent one
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
        const cattle = await this.cattleRepository.findOne({
            where: { id },
            relations: ['character', 'herdBookEntries', 'herdBookEntries.herdBook', 'herdBookEntries.category', 'herdBookEntries.status']
        });

        if (!cattle) {
            throw new NotFoundException(`Cattle with ID ${id} not found`);
        }

        const response = this.toResponse(cattle);
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
            calves: 0, // Logic to calculate calves based on age
            heifers: 0, // Logic for heifers
            cows: 0, // Logic for cows
            bulls: 0 // Logic for bulls
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

        // Create calf
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
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await this.cattleRepository.save(calf);

        // Create HerdBookCattle for calf (same as mother's latest or default)
        // Find mother's herd book entry
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
                statusId: 'STAT004', // En bonne santé
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            await this.herdBookCattleRepository.save(entry);
        }

        // Create Events
        const birthEventType = await this.eventTypeRepository.findOne({ where: { name: 'Naissance' } });
        if (birthEventType) {
            // Calf event
            const calfEvent = this.eventRepository.create({
                id: crypto.randomUUID(),
                cattleId: calf.id,
                eventTypeId: birthEventType.id,
                date: birthData.birthDate,
                description: `Né de ${mother.name} (${motherId})`,
                details: `Naissance enregistrée le ${new Date().toLocaleDateString()}`
            });
            await this.eventRepository.save(calfEvent);

            // Mother event
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

import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cattle, Gender, SourceType } from './entities/cattle.entity';
import { CreateCattleDto } from './dto/create-cattle.dto';
import { UpdateCattleDto } from './dto/update-cattle.dto';
import { RegisterBirthDto } from './dto/register-birth.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { HerdBook } from '../herd-books/entities/herd-book.entity';
import { HerdBookCattle } from '../herd-book-cattle/entities/herd-book-cattle.entity';
import { Event as EventEntity } from '../events/entities/event.entity';
import { Treatment } from '../treatments/entities/treatment.entity';
import { EventType } from '../event-types/entities/event-type.entity';
import { CattleRepository, CattleFilters } from './cattle.repository';
import { CattleMapper } from './cattle.mapper';
import { CattleQueryDto } from './dto/cattle-query.dto';
import { STATUS_ACTIVE_ID } from '../../common/constants/status.constants';
import * as crypto from 'crypto';

@Injectable()
export class CattleService {
    private readonly logger = new Logger(CattleService.name);

    constructor(
        private readonly cattleRepository: CattleRepository,
        private readonly dataSource: DataSource,
        @InjectRepository(HerdBookCattle)
        private herdBookCattleRepository: Repository<HerdBookCattle>,
        @InjectRepository(EventEntity)
        private eventRepository: Repository<EventEntity>,
        @InjectRepository(Treatment)
        private treatmentRepository: Repository<Treatment>,
        @InjectRepository(EventType)
        private eventTypeRepository: Repository<EventType>,
    ) { }

    async findAll(query: CattleQueryDto, user: User) {
        // Résolution RBAC : le repository ne reçoit qu'un ownerId déjà calculé
        let ownerId: string | null = null;
        if (user.role === UserRole.SUPER_ADMIN) {
            ownerId = query.ownerId ?? null; // SUPER_ADMIN peut filtrer par ownerId ou voir tout
        } else {
            if (!user.ownerId) {
                throw new ForbiddenException('User must belong to an owner to list cattle');
            }
            ownerId = user.ownerId;
        }

        const filters: CattleFilters = {
            ...query,
            ownerId,
        };

        const result = await this.cattleRepository.findAllWithRelations(filters, query);

        return {
            ...result,
            data: CattleMapper.toResponseList(result.data, query.herdBookId)
        };
    }

    async findOne(id: string, user: User) {
        const cattle = await this.cattleRepository.findOneWithRelations(id);
        if (!cattle) {
            throw new NotFoundException(`Cattle with ID ${id} not found`);
        }
        return CattleMapper.toResponse(cattle);
    }

    async create(createCattleDto: CreateCattleDto, user: User) {
        return this.dataSource.transaction(async transactionalEntityManager => {
            const { character, events, treatments, source, ...cattleData } = createCattleDto;

            // Mapping robuste pour les types de source
            const sourceType = this.mapSourceType(source?.type);

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
            }) as unknown as Cattle;

            await transactionalEntityManager.save(cattle);

            // Register in herd book if requested
            if (createCattleDto.herdBookId) {
                const entry = this.herdBookCattleRepository.create({
                    id: crypto.randomUUID(),
                    cattleId: cattle.id,
                    herdBookId: createCattleDto.herdBookId,
                    categoryId: createCattleDto.category || null,
                    statusId: STATUS_ACTIVE_ID,
                });
                await transactionalEntityManager.save(entry);
            }

            const savedCattle = await this.cattleRepository.findOneWithBasicRelations(cattle.id);
            return CattleMapper.toResponse(savedCattle, createCattleDto.herdBookId);
        });
    }

    async update(id: string, updateCattleDto: UpdateCattleDto, user: User) {
        const cattle = await this.cattleRepository.findOneForUpdate(id);
        if (!cattle) {
            throw new NotFoundException(`Cattle with ID ${id} not found`);
        }

        return this.dataSource.transaction(async transactionalEntityManager => {
            const { events, treatments, source, category, status, nCarnet, ...cattleData } = updateCattleDto;

            // Update basic fields
            Object.assign(cattle, cattleData);

            // Update Source
            if (source) {
                if (source.type) cattle.sourceType = this.mapSourceType(source.type);
                if (source.supplier) cattle.sourceSupplier = source.supplier;
                if (source.purchaseDate) cattle.sourcePurchaseDate = source.purchaseDate;
                if (source.purchasePrice) cattle.sourcePurchasePrice = source.purchasePrice;
                if (source.purchaseWeight) cattle.sourcePurchaseWeight = source.purchaseWeight;
                if (source.purchaseHealthStatus) cattle.sourcePurchaseHealthStatus = source.purchaseHealthStatus;
                if (source.purchaseNotes) cattle.sourcePurchaseNotes = source.purchaseNotes;
                if (source.motherId) cattle.sourceMotherId = source.motherId;
            }

            // Update Events & Treatments logic simplified for brevity but kept functional
            // (Ideally, these should be moved to their own services)
            await this.updateRelations(transactionalEntityManager, cattle, events, treatments);

            // Update HerdBookCattle fields
            if (category || status || nCarnet) {
                const entry = cattle.herdBookEntries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
                if (entry) {
                    if (category) entry.categoryId = category;
                    if (status) entry.statusId = status;
                    if (nCarnet) entry.nCarnet = nCarnet;
                    await transactionalEntityManager.save(entry);
                }
            }

            await transactionalEntityManager.save(cattle);
            return this.findOne(id, user);
        });
    }

    private async updateRelations(em: any, cattle: Cattle, events: any[], treatments: any[]) {
        if (events) {
            const incomingIds = events.filter(e => e.id).map(e => e.id);
            const toDelete = cattle.events.filter(e => !incomingIds.includes(e.id));
            if (toDelete.length > 0) await em.remove(toDelete);

            for (const eventData of events) {
                if (eventData.id) {
                    await em.update(EventEntity, eventData.id, {
                        eventTypeId: eventData.type,
                        date: eventData.date,
                        description: eventData.description,
                        details: eventData.details
                    });
                } else {
                    const newEvent = this.eventRepository.create({
                        ...eventData,
                        cattleId: cattle.id,
                        eventTypeId: eventData.type,
                        id: crypto.randomUUID()
                    });
                    await em.save(newEvent);
                }
            }
        }

        if (treatments) {
            const incomingIds = treatments.filter(t => t.id).map(t => t.id);
            const toDelete = cattle.treatments.filter(t => !incomingIds.includes(t.id));
            if (toDelete.length > 0) await em.remove(toDelete);

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
                    animalPoids: dosage.animalPoids,
                    dosageNotes: dosage.notes
                };

                if (treatmentData.id) {
                    await em.update(Treatment, treatmentData.id, treatmentPayload);
                } else {
                    const newTreatment = this.treatmentRepository.create({
                        ...treatmentPayload,
                        cattleId: cattle.id,
                        id: crypto.randomUUID()
                    });
                    await em.save(newTreatment);
                }
            }
        }
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
        const total = await this.cattleRepository.count();
        const males = await this.cattleRepository.count({ where: { gender: Gender.M } });
        const females = await this.cattleRepository.count({ where: { gender: Gender.F } });

        return { total, males, females, calves: 0, heifers: 0, cows: 0, bulls: 0 };
    }

    async registerBirth(motherId: string, birthData: RegisterBirthDto, user: User) {
        return this.dataSource.transaction(async em => {
            const mother = await this.cattleRepository.findOne({ where: { id: motherId } });
            if (!mother || mother.gender !== Gender.F) {
                throw new BadRequestException("Invalid mother or not a female");
            }

            const { character, category, birthEventDate, ...restBirthData } = birthData;

            const calf = this.cattleRepository.create({
                id: crypto.randomUUID(),
                ...restBirthData,
                characterId: character,
                sourceType: SourceType.NE_DANS_TROUPEAU,
                sourceMotherId: motherId,
            }) as unknown as Cattle;
            await em.save(calf);

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
                    statusId: STATUS_ACTIVE_ID,
                });
                await em.save(entry);
            }

            // Create birth event logic
            const birthEventType = await em.findOne(EventType, { where: { name: 'Naissance' } });
            if (birthEventType) {
                const birthEvent = this.eventRepository.create({
                    id: crypto.randomUUID(),
                    cattleId: calf.id,
                    eventTypeId: birthEventType.id,
                    date: birthData.birthDate,
                    description: `Né de ${mother.name} (${motherId})`,
                } as any);
                await em.save(birthEvent);
            }

            return this.findOne(calf.id, user);
        });
    }

    private mapSourceType(type?: string): SourceType {
        const rawType = type?.toUpperCase();
        if (rawType === 'NE_DANS_TROUPEAU' || rawType === 'BORN_ON_FARM') {
            return SourceType.NE_DANS_TROUPEAU;
        }
        return SourceType.ACHETE;
    }
}

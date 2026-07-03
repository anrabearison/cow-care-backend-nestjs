import {BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {DataSource, Repository, EntityManager} from 'typeorm';
import {Cattle, Gender, SourceType} from './entities/cattle.entity';
import {CreateCattleDto} from './dto/create-cattle.dto';
import {UpdateCattleDto} from './dto/update-cattle.dto';
import {RegisterBirthDto} from './dto/register-birth.dto';
import {User, UserRole} from '../users/entities/user.entity';
import {HerdBookCattle} from '../herd-book-cattle/entities/herd-book-cattle.entity';
import {Event as EventEntity} from '../events/entities/event.entity';
import {Treatment} from '../treatments/entities/treatment.entity';
import {EventType} from '../event-types/entities/event-type.entity';
import {CattleFilters, CattleRepository} from './cattle.repository';
import {CattleMapper} from './cattle.mapper';
import {CattleQueryDto} from './dto/cattle-query.dto';
import {STATUS_ACTIVE_ID} from '../../common/constants/status.constants';
import {EventsService} from '../events/events.service';
import {TreatmentsService} from '../treatments/treatments.service';
import { resolveOwnerIdFromUser } from '../../common/utils/rbac.util';
import { UpdateEventDto } from '../events/dto/update-event.dto';
import { UpdateTreatmentDto } from '../treatments/dto/update-treatment.dto';
import { CattleBirthService } from './cattle-birth.service';

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
        private readonly eventsService: EventsService,
        private readonly treatmentsService: TreatmentsService,
        private readonly cattleBirthService: CattleBirthService,
    ) { }

    async findAll(query: CattleQueryDto, user: User) {
        const ownerId = resolveOwnerIdFromUser(user, query.ownerId, 'cattle');

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

    async findOne(id: string, user: User, em?: EntityManager) {
        let repo = this.cattleRepository;
        if (em) {
            repo = Object.create(this.cattleRepository);
            (repo as any).manager = em;
        }
        const cattle = await repo.findOneWithRelations(id);
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
                ownerId: user.ownerId || createCattleDto.ownerId,
                characterId: character,
                sourceType: sourceType,
                // Map source fields
                sourceSupplier: source?.supplier,
                sourcePurchaseDate: source?.purchaseDate,
                sourcePurchasePrice: source?.purchasePrice,
                sourcePurchaseWeight: source?.purchaseWeight,
                sourcePurchaseHealthStatus: source?.purchaseHealthStatus,
                sourcePurchaseNotes: source?.purchaseNotes,
            }) as unknown as Cattle;

            await transactionalEntityManager.save(cattle);

            // Register in herd book if requested
            if (createCattleDto.herdBookId) {
                const entry = this.herdBookCattleRepository.create({
                    cattleId: cattle.id,
                    herdBookId: createCattleDto.herdBookId,
                    categoryId: createCattleDto.category || null,
                    statusId: STATUS_ACTIVE_ID,
                    year: new Date().getFullYear(),
                });
                await transactionalEntityManager.save(entry);
            }

            const transCattleRepo = Object.create(this.cattleRepository);
            transCattleRepo.manager = transactionalEntityManager;
            const savedCattle = await transCattleRepo.findOneWithBasicRelations(cattle.id);
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
                if (source.type) {
                    cattle.sourceType = this.mapSourceType(source.type);
                }
                if (source.supplier !== undefined) {
                    cattle.sourceSupplier = source.supplier;
                }
                if (source.purchaseDate !== undefined) {
                    cattle.sourcePurchaseDate = source.purchaseDate;
                }
                if (source.purchasePrice !== undefined) {
                    cattle.sourcePurchasePrice = source.purchasePrice;
                }
                if (source.purchaseWeight !== undefined) {
                    cattle.sourcePurchaseWeight = source.purchaseWeight;
                }
                if (source.purchaseHealthStatus !== undefined) {
                    cattle.sourcePurchaseHealthStatus = source.purchaseHealthStatus;
                }
                if (source.purchaseNotes !== undefined) {
                    cattle.sourcePurchaseNotes = source.purchaseNotes;
                }
            }

            // Update Events & Treatments logic
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
            return this.findOne(id, user, transactionalEntityManager);
        });
    }

    private async updateRelations(em: EntityManager, cattle: Cattle, events: any[], treatments: any[]) {
        if (events) {
            await this.eventsService.updateCattleEvents(em, cattle.id, cattle.events, events);
        }

        if (treatments) {
            await this.treatmentsService.updateCattleTreatments(em, cattle.id, cattle.treatments, treatments);
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

    async getStatistics(requestedOwnerId: string, user: User) {
        const ownerId = resolveOwnerIdFromUser(user, requestedOwnerId, 'cattle statistics');
        const whereClause = ownerId ? { ownerId } : {};

        const total = await this.cattleRepository.count({ where: whereClause });
        const males = await this.cattleRepository.count({ where: { gender: Gender.M, ...whereClause } });
        const females = await this.cattleRepository.count({ where: { gender: Gender.F, ...whereClause } });

        return { total, males, females, calves: 0, heifers: 0, cows: 0, bulls: 0 };
    }

    async registerBirth(motherId: string, birthData: RegisterBirthDto, user: User) {
        return this.cattleBirthService.registerBirth(motherId, birthData, user, this);
    }

    private mapSourceType(type?: string): SourceType {
        const rawType = type?.toUpperCase();
        if (rawType === 'NE_DANS_TROUPEAU' || rawType === 'BORN_ON_FARM') {
            return SourceType.NE_DANS_TROUPEAU;
        }
        return SourceType.ACHETE;
    }
}

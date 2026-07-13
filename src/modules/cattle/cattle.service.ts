import {BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {DataSource, Repository, EntityManager} from 'typeorm';
import {Cattle, SourceType} from './entities/cattle.entity';
import { CattlePhoto } from './entities/cattle-photo.entity';
import {CreateCattleDto} from './dto/create-cattle.dto';
import {UpdateCattleDto} from './dto/update-cattle.dto';
import {RegisterBirthDto} from './dto/register-birth.dto';
import {User} from '../users/entities/user.entity';
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
        @InjectRepository(CattlePhoto)
        private cattlePhotoRepository: Repository<CattlePhoto>,
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
        let cattle;
        if (em) {
            cattle = await em.findOne(Cattle, {
                where: { id },
                relations: [
                    'character',
                    'mother',
                    'herdBookEntries',
                    'herdBookEntries.herdBook',
                    'herdBookEntries.category',
                    'herdBookEntries.status',
                    'events',
                    'treatments'
                ]
            });
        } else {
            cattle = await this.cattleRepository.findOneWithRelations(id);
        }

        if (!cattle) {
            throw new NotFoundException(`Cattle with ID ${id} not found`);
        }

        // Check RBAC
        const ownerId = resolveOwnerIdFromUser(user, null, 'view cattle');
        if (ownerId && cattle.ownerId !== ownerId) {
            throw new ForbiddenException(`You do not have permission to access this cattle`);
        }

        return CattleMapper.toResponse(cattle);
    }

    async create(createCattleDto: CreateCattleDto, user: User) {
        return this.dataSource.transaction(async transactionalEntityManager => {
            const { character, events, treatments, source, photos, ...cattleData } = createCattleDto;
            const normalizedPhotos = this.normalizePhotos(photos, cattleData.photo);

            // Mapping robuste pour les types de source
            const sourceType = this.mapSourceType(source?.type);

            const cattle = this.cattleRepository.create({
                ...cattleData,
                photo: normalizedPhotos[0]?.url || cattleData.photo,
                ownerId: user.ownerId || createCattleDto.ownerId,
                characterId: character || null,
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
            await this.replacePhotos(transactionalEntityManager, cattle.id, normalizedPhotos);

            // Register in herd book if requested
            if (createCattleDto.herdBookId) {
                const entry = this.herdBookCattleRepository.create({
                    cattleId: cattle.id,
                    herdBookId: createCattleDto.herdBookId,
                    statusId: STATUS_ACTIVE_ID,
                });
                await transactionalEntityManager.save(entry);
            }

            // Create purchase event if source type is ACHETE
            if (sourceType === SourceType.ACHETE) {
                const purchaseEventType = await transactionalEntityManager.findOne(EventType, { where: { name: 'Achat' } });
                if (purchaseEventType) {
                    const purchaseEvent = transactionalEntityManager.create(EventEntity, {
                        cattleId: cattle.id,
                        eventTypeId: purchaseEventType.id,
                        date: source?.purchaseDate || cattle.birthDate,
                        description: source?.supplier 
                            ? `Achat auprès de ${source.supplier}${source?.purchasePrice ? ` pour ${source.purchasePrice} MGA` : ''}`
                            : 'Achat enregistré',
                    } as any);
                    await transactionalEntityManager.save(EventEntity, purchaseEvent);
                }
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

        // Check RBAC
        const ownerId = resolveOwnerIdFromUser(user, null, 'update cattle');
        if (ownerId && cattle.ownerId !== ownerId) {
            throw new ForbiddenException(`You do not have permission to update this cattle`);
        }

        return this.dataSource.transaction(async transactionalEntityManager => {
            const { events, treatments, source, status, nCarnet, photos, ...cattleData } = updateCattleDto;
            const shouldReplacePhotos = Array.isArray(photos);

            // Update basic fields
            Object.assign(cattle, cattleData);
            if (shouldReplacePhotos) {
                const normalizedPhotos = this.normalizePhotos(photos, cattleData.photo);
                cattle.photo = normalizedPhotos[0]?.url || null;
                await this.replacePhotos(transactionalEntityManager, cattle.id, normalizedPhotos);
            }

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
            if (status || nCarnet) {
                const entry = cattle.herdBookEntries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
                if (entry) {
                    if (status) entry.statusId = status;
                    if (nCarnet) entry.nCarnet = nCarnet;
                    await transactionalEntityManager.save(entry);
                }
            }

            // Sync relations from DB to prevent TypeORM cascade from nullifying FKs
            cattle.events = await transactionalEntityManager.find(EventEntity, { where: { cattleId: cattle.id } });
            cattle.treatments = await transactionalEntityManager.find(Treatment, { where: { cattleId: cattle.id } });

            await transactionalEntityManager.save(cattle);
            return this.findOne(id, user, transactionalEntityManager);
        });
    }

    private normalizePhotos(photos?: any[], fallbackPhoto?: string | null) {
        const sourcePhotos = Array.isArray(photos) ? photos : [];
        const normalized = sourcePhotos
            .filter(photo => photo?.url)
            .slice(0, 5)
            .map((photo, index) => ({
                url: photo.url,
                publicId: photo.publicId || photo.public_id || null,
                position: Number.isFinite(Number(photo.position)) ? Number(photo.position) : index,
                isPrimary: Boolean(photo.isPrimary || photo.is_primary),
            }))
            .sort((a, b) => a.position - b.position)
            .map((photo, index) => ({ ...photo, position: index }));

        if (normalized.length === 0 && fallbackPhoto) {
            normalized.push({
                url: fallbackPhoto,
                publicId: null,
                position: 0,
                isPrimary: true,
            });
        }

        if (normalized.length > 0 && !normalized.some(photo => photo.isPrimary)) {
            normalized[0].isPrimary = true;
        }

        let primarySeen = false;
        return normalized.map(photo => {
            if (photo.isPrimary && !primarySeen) {
                primarySeen = true;
                return photo;
            }
            return { ...photo, isPrimary: false };
        });
    }

    private async replacePhotos(em: EntityManager, cattleId: string, photos: any[]) {
        await em.delete(CattlePhoto, { cattleId });

        if (photos.length === 0) {
            return;
        }

        const entities = photos.map(photo => em.create(CattlePhoto, {
            cattleId,
            url: photo.url,
            publicId: photo.publicId,
            position: photo.position,
            isPrimary: photo.isPrimary,
        }));

        await em.save(CattlePhoto, entities);
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

        // Check RBAC
        const ownerId = resolveOwnerIdFromUser(user, null, 'delete cattle');
        if (ownerId && cattle.ownerId !== ownerId) {
            throw new ForbiddenException(`You do not have permission to delete this cattle`);
        }
        const response = CattleMapper.toResponse(cattle);
        await this.cattleRepository.remove(cattle);
        return response;
    }

    async getStatistics(requestedOwnerId: string, user: User) {
        const ownerId = resolveOwnerIdFromUser(user, requestedOwnerId, 'cattle statistics');
        const whereClause = ownerId ? { ownerId } : {};

        const qb = this.cattleRepository.createQueryBuilder('cattle');
        if (ownerId) {
            qb.where('cattle.ownerId = :ownerId', { ownerId });
        }

        const stats = await qb
            .select('COUNT(cattle.id)', 'total')
            .addSelect("COUNT(CASE WHEN cattle.gender = 'M' THEN 1 END)", 'males')
            .addSelect("COUNT(CASE WHEN cattle.gender = 'F' THEN 1 END)", 'females')
            .getRawOne();

        return {
            total: parseInt(stats.total || '0', 10),
            males: parseInt(stats.males || '0', 10),
            females: parseInt(stats.females || '0', 10),
            calves: 0, 
            heifers: 0, 
            cows: 0, 
            bulls: 0 
        };
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

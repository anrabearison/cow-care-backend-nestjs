import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Event as EventEntity } from '../../entities/event.entity';

export interface EventsFilters {
    q?: string;
    date?: string;
    id?: string | string[];
    cattleId?: string;
    eventTypeId?: string;
    type?: string;
    ownerId?: string;
    userRole?: string;
    userOwnerId?: string;
}

export interface EventsPaginationOptions {
    page: number;
    perPage: number;
    sort: string;
    order: 'ASC' | 'DESC';
}

@Injectable()
export class EventsRepository extends Repository<EventEntity> {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) {
        super(EventEntity, dataSource.createEntityManager());
    }

    async findAllWithRelations(
        filters: EventsFilters,
        pagination: EventsPaginationOptions,
    ): Promise<[EventEntity[], number]> {
        const { page, perPage, sort, order } = pagination;
        const skip = (page - 1) * perPage;

        const qb = this.createQueryBuilder('event')
            .leftJoinAndSelect('event.cattle', 'cattle')
            .leftJoinAndSelect('event.eventType', 'eventType');

        // RBAC & Owner Filtering
        let filterOwnerId = null;
        if (filters.userRole !== 'SUPER_ADMIN') {
            if (!filters.userOwnerId) {
                return [[], 0];
            }
            filterOwnerId = filters.userOwnerId;
        } else if (filters.ownerId) {
            filterOwnerId = filters.ownerId;
        }

        if (filterOwnerId) {
            qb.innerJoin('cattle.herdBookEntries', 'herdBookEntries')
                .innerJoin('herdBookEntries.herdBook', 'herdBook')
                .andWhere('herdBook.ownerId = :ownerId', { ownerId: filterOwnerId });
            qb.distinct(true);
        }

        // Filtering
        if (filters.cattleId) {
            qb.andWhere('event.cattleId = :cattleId', { cattleId: filters.cattleId });
        }

        const targetTypeId = filters.type || filters.eventTypeId;
        if (targetTypeId) {
            qb.andWhere('event.eventTypeId = :eventTypeId', { eventTypeId: targetTypeId });
        }

        if (filters.date) {
            qb.andWhere('event.date = :date', { date: filters.date });
        }

        if (filters.q) {
            qb.andWhere('event.description ILIKE :q', { q: `%${filters.q}%` });
        }

        if (filters.id) {
            const ids = Array.isArray(filters.id) ? filters.id : [filters.id];
            qb.andWhere('event.id IN (:...ids)', { ids });
        }

        qb.orderBy(`event.${sort}`, order);
        qb.skip(skip).take(perPage);

        return qb.getManyAndCount();
    }

    async findOneWithRelations(id: string, userRole?: string, userOwnerId?: string): Promise<EventEntity | null> {
        const qb = this.createQueryBuilder('event')
            .leftJoinAndSelect('event.cattle', 'cattle')
            .leftJoinAndSelect('event.eventType', 'eventType')
            .where('event.id = :id', { id });

        if (userRole !== 'SUPER_ADMIN') {
            if (!userOwnerId) {
                return null;
            }
            qb.innerJoin('cattle.herdBookEntries', 'herdBookEntries')
                .innerJoin('herdBookEntries.herdBook', 'herdBook')
                .andWhere('herdBook.ownerId = :ownerId', { ownerId: userOwnerId });
        }

        return qb.getOne();
    }
}

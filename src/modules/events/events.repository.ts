import { Injectable } from '@nestjs/common';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Event as EventEntity } from '../../entities/event.entity';
import { BaseRepository } from '../../common/repositories/base.repository';
import { PaginationOptions } from '../../common/utils/pagination.util';

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

@Injectable()
export class EventsRepository extends BaseRepository<EventEntity> {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) {
        super(EventEntity, dataSource.createEntityManager());
    }

    async findAllWithRelations(
        filters: EventsFilters,
        pagination: PaginationOptions,
    ) {
        const qb = this.createQueryBuilder('event');
        
        this.applyStandardJoins(qb, [
            'cattle',
            'eventType'
        ]);

        this.applyFilters(qb, filters);

        return this.paginate(qb, pagination);
    }

    private applyFilters(qb: SelectQueryBuilder<EventEntity>, filters: EventsFilters) {
        // RBAC & Owner Filtering
        let filterOwnerId = null;
        if (filters.userRole !== 'SUPER_ADMIN') {
            if (!filters.userOwnerId) {
                qb.andWhere('1=0');
                return;
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

        if (filters.cattleId) {
            qb.andWhere('event.cattleId = :cattleId', { cattleId: filters.cattleId });
        }

        if (filters.eventTypeId || filters.type) {
            const targetTypeId = filters.type || filters.eventTypeId;
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
    }

    async findOneWithRelations(id: string, userRole?: string, userOwnerId?: string): Promise<EventEntity | null> {
        const qb = this.createQueryBuilder('event');
        this.applyStandardJoins(qb, ['cattle', 'eventType']);
        
        qb.where('event.id = :id', { id });

        if (userRole !== 'SUPER_ADMIN' && userOwnerId) {
            qb.innerJoin('cattle.herdBookEntries', 'herdBookEntries')
                .innerJoin('herdBookEntries.herdBook', 'herdBook')
                .andWhere('herdBook.ownerId = :ownerId', { ownerId: userOwnerId });
        }

        return qb.getOne();
    }
}

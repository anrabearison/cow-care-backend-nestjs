import { Injectable } from '@nestjs/common';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { EventType } from './entities/event-type.entity';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { PaginationOptions } from '../../../common/utils/pagination.util';

@Injectable()
export class EventTypesRepository extends BaseRepository<EventType> {
    constructor(
        @InjectDataSource() private readonly _dataSource: DataSource,
    ) {
        super(EventType, _dataSource.createEntityManager());
    }

    async findAllWithRelations(
        filters: any,
        pagination: PaginationOptions,
    ) {
        const qb = this.createQueryBuilder('eventType');
        this.applyFilters(qb, filters);
        return this.paginate(qb, pagination);
    }

    private applyFilters(qb: SelectQueryBuilder<EventType>, filters: any) {
        if (filters.id) {
            const ids = Array.isArray(filters.id) ? filters.id : [filters.id];
            qb.andWhere('eventType.id IN (:...ids)', { ids });
        }

        if (filters.q) {
            qb.andWhere('(eventType.name ILIKE :q OR eventType.description ILIKE :q)', { q: `%${filters.q}%` });
        }
    }
}

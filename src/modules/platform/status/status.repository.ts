import { Injectable } from '@nestjs/common';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Status } from './entities/status.entity';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { PaginationOptions } from '../../../common/utils/pagination.util';

@Injectable()
export class StatusRepository extends BaseRepository<Status> {
    constructor(
        @InjectDataSource() private readonly _dataSource: DataSource,
    ) {
        super(Status, _dataSource.createEntityManager());
    }

    async findAllWithRelations(
        filters: any,
        pagination: PaginationOptions,
    ) {
        const qb = this.createQueryBuilder('status');
        this.applyFilters(qb, filters);
        return this.paginate(qb, pagination);
    }

    private applyFilters(qb: SelectQueryBuilder<Status>, filters: any) {
        if (filters.id) {
            const ids = Array.isArray(filters.id) ? filters.id : [filters.id];
            qb.andWhere('status.id IN (:...ids)', { ids });
        }

        if (filters.q) {
            qb.andWhere('status.name ILIKE :q', { q: `%${filters.q}%` });
        }
    }

    async findByName(name: string): Promise<Status | null> {
        // Case-insensitive and trim whitespace comparison
        const normalized = name.trim().toLowerCase();
        return await this.findOne({
            where: {
                name: normalized,
            },
        });
    }
}

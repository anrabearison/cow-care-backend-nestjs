import { Injectable } from '@nestjs/common';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Owner } from './entities/owner.entity';
import { BaseRepository } from '../../common/repositories/base.repository';
import { PaginationOptions } from '../../common/utils/pagination.util';

export interface OwnersFilters {
    q?: string;
    id?: string | string[];
}

@Injectable()
export class OwnersRepository extends BaseRepository<Owner> {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) {
        super(Owner, dataSource.createEntityManager());
    }

    async findAllWithRelations(
        filters: OwnersFilters,
        pagination: PaginationOptions,
    ) {
        const qb = this.createQueryBuilder('owner');
        this.applyFilters(qb, filters);
        return this.paginate(qb, pagination);
    }

    private applyFilters(qb: SelectQueryBuilder<Owner>, filters: OwnersFilters) {
        if (filters.id) {
            const ids = Array.isArray(filters.id) ? filters.id : [filters.id];
            qb.andWhere('owner.id IN (:...ids)', { ids });
        }

        if (filters.q) {
            qb.andWhere('owner.name ILIKE :q', { q: `%${filters.q}%` });
        }
    }
}

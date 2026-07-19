import { Injectable } from '@nestjs/common';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { HerdBookCattle } from './entities/herd-book-cattle.entity';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { PaginationOptions } from '../../../common/utils/pagination.util';

export interface HerdBookCattleFilters {
    q?: string;
    cattleId?: string;
    herdBookId?: string;
    categoryId?: string;
    statusId?: string;
    ownerId?: string;
    userRole?: string;
    userOwnerId?: string;
    id?: string | string[];
}

@Injectable()
export class HerdBookCattleRepository extends BaseRepository<HerdBookCattle> {
    constructor(
        @InjectDataSource() private readonly _dataSource: DataSource,
    ) {
        super(HerdBookCattle, _dataSource.createEntityManager());
    }

    async findAllWithRelations(
        filters: HerdBookCattleFilters,
        pagination: PaginationOptions,
    ) {
        const qb = this.createQueryBuilder('hbc');
        
        this.applyStandardJoins(qb, [
            'cattle',
            'herdBook',
            'category',
            'status'
        ]);

        this.applyFilters(qb, filters);

        return this.paginate(qb, pagination);
    }

    private applyFilters(qb: SelectQueryBuilder<HerdBookCattle>, filters: HerdBookCattleFilters) {
        // RBAC filtering
        if (filters.userRole !== 'SUPER_ADMIN') {
            if (filters.userOwnerId) {
                qb.andWhere('herdBook.ownerId = :ownerId', { ownerId: filters.userOwnerId });
            } else {
                qb.andWhere('1=0');
            }
        } else if (filters.ownerId) {
            qb.andWhere('herdBook.ownerId = :ownerId', { ownerId: filters.ownerId });
        }

        if (filters.id) {
            const ids = Array.isArray(filters.id) ? filters.id : [filters.id];
            qb.andWhere('hbc.id IN (:...ids)', { ids });
        }

        if (filters.q) {
            qb.andWhere(
                '(CAST(hbc.nCarnet AS TEXT) ILIKE :q OR cattle.name ILIKE :q OR cattle.nickname ILIKE :q OR herdBook.reference ILIKE :q)',
                { q: `%${filters.q}%` },
            );
        }

        if (filters.cattleId) {
            qb.andWhere('hbc.cattleId = :cattleId', { cattleId: filters.cattleId });
        }

        if (filters.herdBookId) {
            qb.andWhere('hbc.herdBookId = :herdBookId', { herdBookId: filters.herdBookId });
        }

        if (filters.categoryId) {
            qb.andWhere('hbc.categoryId = :categoryId', { categoryId: filters.categoryId });
        }

        if (filters.statusId) {
            qb.andWhere('hbc.statusId = :statusId', { statusId: filters.statusId });
        }
    }
}

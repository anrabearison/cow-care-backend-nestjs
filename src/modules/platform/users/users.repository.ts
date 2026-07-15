import { Injectable } from '@nestjs/common';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { PaginationOptions } from '../../../common/utils/pagination.util';

export interface UsersFilters {
    q?: string;
    role?: string;
    ownerId?: string;
    id?: string | string[];
    excludeRole?: string;
}

@Injectable()
export class UsersRepository extends BaseRepository<User> {
    constructor(
        @InjectDataSource() private readonly _dataSource: DataSource,
    ) {
        super(User, _dataSource.createEntityManager());
    }

    async findAllWithRelations(
        filters: UsersFilters,
        pagination: PaginationOptions,
    ) {
        const qb = this.createQueryBuilder('user');
        
        this.applyStandardJoins(qb, [
            'owner'
        ]);

        this.applyFilters(qb, filters);

        return this.paginate(qb, pagination);
    }

    private applyFilters(qb: SelectQueryBuilder<User>, filters: UsersFilters) {
        if (filters.id) {
            const ids = Array.isArray(filters.id) ? filters.id : [filters.id];
            qb.andWhere('user.id IN (:...ids)', { ids });
        }

        if (filters.ownerId) {
            qb.andWhere('user.ownerId = :ownerId', { ownerId: filters.ownerId });
        }

        if (filters.role) {
            qb.andWhere('user.role = :role', { role: filters.role });
        }

        if (filters.excludeRole) {
            qb.andWhere('user.role != :excludeRole', { excludeRole: filters.excludeRole });
        }

        if (filters.q) {
            qb.andWhere('(user.name ILIKE :q OR user.email ILIKE :q)', { q: `%${filters.q}%` });
        }
    }
}

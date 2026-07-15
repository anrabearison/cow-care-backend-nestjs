import { Injectable } from '@nestjs/common';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { PaginationOptions } from '../../../common/utils/pagination.util';

@Injectable()
export class CategoriesRepository extends BaseRepository<Category> {
    constructor(
        @InjectDataSource() private readonly _dataSource: DataSource,
    ) {
        super(Category, _dataSource.createEntityManager());
    }

    async findAllWithRelations(
        filters: any,
        pagination: PaginationOptions,
    ) {
        const qb = this.createQueryBuilder('category');
        this.applyFilters(qb, filters);
        return this.paginate(qb, pagination);
    }

    private applyFilters(qb: SelectQueryBuilder<Category>, filters: any) {
        if (filters.id) {
            const ids = Array.isArray(filters.id) ? filters.id : [filters.id];
            qb.andWhere('category.id IN (:...ids)', { ids });
        }

        if (filters.q) {
            qb.andWhere('category.name ILIKE :q', { q: `%${filters.q}%` });
        }
    }
}

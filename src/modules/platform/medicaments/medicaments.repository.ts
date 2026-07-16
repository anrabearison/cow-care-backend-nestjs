import { Injectable } from '@nestjs/common';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Medicament } from './entities/medicament.entity';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { PaginationOptions } from '../../../common/utils/pagination.util';

export interface MedicamentsFilters {
    q?: string;
    type?: string;
    id?: string | string[];
}

@Injectable()
export class MedicamentsRepository extends BaseRepository<Medicament> {
    constructor(
        @InjectDataSource() private readonly _dataSource: DataSource,
    ) {
        super(Medicament, _dataSource.createEntityManager());
    }

    async findAllWithRelations(
        filters: MedicamentsFilters,
        pagination: PaginationOptions,
    ) {
        const qb = this.createQueryBuilder('medicament');
        this.applyFilters(qb, filters);
        return this.paginate(qb, pagination);
    }

    private applyFilters(qb: SelectQueryBuilder<Medicament>, filters: MedicamentsFilters) {
        if (filters.id) {
            const ids = Array.isArray(filters.id) ? filters.id : [filters.id];
            qb.andWhere('medicament.id IN (:...ids)', { ids });
        }

        if (filters.q) {
            qb.andWhere('medicament.name ILIKE :q', { q: `%${filters.q}%` });
        }

        if (filters.type) {
            qb.andWhere('medicament.type = :type', { type: filters.type });
        }
    }
}

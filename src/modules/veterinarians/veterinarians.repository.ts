import { Injectable } from '@nestjs/common';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Veterinarian } from './entities/veterinarian.entity';
import { BaseRepository } from '../../common/repositories/base.repository';
import { PaginationOptions } from '../../common/utils/pagination.util';

export interface VeterinariansFilters {
    q?: string;
    specialty?: string;
    id?: string | string[];
}

@Injectable()
export class VeterinariansRepository extends BaseRepository<Veterinarian> {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) {
        super(Veterinarian, dataSource.createEntityManager());
    }

    async findAllWithRelations(
        filters: VeterinariansFilters,
        pagination: PaginationOptions,
    ) {
        const qb = this.createQueryBuilder('veterinarian');
        this.applyFilters(qb, filters);
        return this.paginate(qb, pagination);
    }

    private applyFilters(qb: SelectQueryBuilder<Veterinarian>, filters: VeterinariansFilters) {
        if (filters.id) {
            const ids = Array.isArray(filters.id) ? filters.id : [filters.id];
            qb.andWhere('veterinarian.id IN (:...ids)', { ids });
        }

        if (filters.q) {
            qb.andWhere('veterinarian.name ILIKE :q', { q: `%${filters.q}%` });
        }

        if (filters.specialty) {
            qb.andWhere('veterinarian.specialty ILIKE :specialty', { specialty: `%${filters.specialty}%` });
        }
    }
}

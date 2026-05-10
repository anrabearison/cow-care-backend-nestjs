import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Medicament } from '../../entities/medicament.entity';

export interface MedicamentsFilters {
    q?: string;
    type?: string;
    id?: string | string[];
}

export interface MedicamentsPaginationOptions {
    page: number;
    perPage: number;
    sort: string;
    order: 'ASC' | 'DESC';
}

@Injectable()
export class MedicamentsRepository extends Repository<Medicament> {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) {
        super(Medicament, dataSource.createEntityManager());
    }

    async findAllWithRelations(
        filters: MedicamentsFilters,
        pagination: MedicamentsPaginationOptions,
    ): Promise<[Medicament[], number]> {
        const { page, perPage, sort, order } = pagination;
        const skip = (page - 1) * perPage;

        const qb = this.createQueryBuilder('medicament');

        if (filters.id) {
            const ids = Array.isArray(filters.id) ? filters.id : [filters.id];
            qb.andWhere('medicament.id IN (:...ids)', { ids });
        }

        if (filters.q) {
            qb.andWhere('medicament.nom ILIKE :q', { q: `%${filters.q}%` });
        }

        if (filters.type) {
            qb.andWhere('medicament.type ILIKE :type', { type: `%${filters.type}%` });
        }

        qb.orderBy(`medicament.${sort}`, order);
        qb.skip(skip).take(perPage);

        return qb.getManyAndCount();
    }

    async findOneWithRelations(id: string): Promise<Medicament | null> {
        return this.findOne({ where: { id } });
    }
}

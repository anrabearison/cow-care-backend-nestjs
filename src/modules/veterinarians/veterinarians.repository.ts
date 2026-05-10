import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Veterinarian } from '../../entities/veterinarian.entity';

export interface VeterinariansFilters {
    q?: string;
    specialite?: string;
    id?: string | string[];
}

export interface VeterinariansPaginationOptions {
    page: number;
    perPage: number;
    sort: string;
    order: 'ASC' | 'DESC';
}

@Injectable()
export class VeterinariansRepository extends Repository<Veterinarian> {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) {
        super(Veterinarian, dataSource.createEntityManager());
    }

    async findAllWithRelations(
        filters: VeterinariansFilters,
        pagination: VeterinariansPaginationOptions,
    ): Promise<[Veterinarian[], number]> {
        const { page, perPage, sort, order } = pagination;
        const skip = (page - 1) * perPage;

        // Map frontend French sort field names to TypeORM TypeScript property names
        const sortFieldMap: Record<string, string> = {
            nom: 'name',
            telephone: 'phone',
            adresse: 'address',
        };
        const sortField = sortFieldMap[sort] || sort;

        const qb = this.createQueryBuilder('veterinarian');

        if (filters.id) {
            const ids = Array.isArray(filters.id) ? filters.id : [filters.id];
            qb.andWhere('veterinarian.id IN (:...ids)', { ids });
        }

        if (filters.q) {
            qb.andWhere('veterinarian.name ILIKE :q', { q: `%${filters.q}%` });
        }

        if (filters.specialite) {
            qb.andWhere('veterinarian.specialite ILIKE :specialite', { specialite: `%${filters.specialite}%` });
        }

        qb.orderBy(`veterinarian.${sortField}`, order);
        qb.skip(skip).take(perPage);

        return qb.getManyAndCount();
    }

    async findOneWithRelations(id: string): Promise<Veterinarian | null> {
        return this.findOne({ where: { id } });
    }
}

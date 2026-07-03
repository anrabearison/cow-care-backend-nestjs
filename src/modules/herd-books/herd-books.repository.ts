import { Injectable } from '@nestjs/common';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { HerdBook } from './entities/herd-book.entity';
import { BaseRepository } from '../../common/repositories/base.repository';
import { PaginationOptions, getPaginationOffsets, formatPaginatedResponse } from '../../common/utils/pagination.util';

export interface HerdBooksFilters {
    q?: string;
    /** ownerId déjà résolu par le service selon le rôle de l'utilisateur */
    ownerId?: string | null;
    id?: string | string[];
}

@Injectable()
export class HerdBooksRepository extends BaseRepository<HerdBook> {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) {
        super(HerdBook, dataSource.createEntityManager());
    }

    async findAllWithRelations(
        filters: HerdBooksFilters,
        pagination: PaginationOptions,
    ) {
        const qb = this.createQueryBuilder('herdBook');
        
        this.applyStandardJoins(qb, [
            'owner'
        ]);

        this.applyFilters(qb, filters);

        qb.distinct(true);

        // Bypass bugget manyandcount with TypeORM
        const { skip, take, page, perPage } = getPaginationOffsets(pagination);
        
        // We use offset/limit instead of skip/take to avoid TypeORM bug with getManyAndCount
        qb.offset(skip).limit(take);
        
        const data = await qb.getMany();
        return formatPaginatedResponse(data, data.length, { page, perPage });
    }

    private applyFilters(qb: SelectQueryBuilder<HerdBook>, filters: HerdBooksFilters) {
        // Le service a déjà résolu l'ownerId selon le rôle de l'utilisateur
        if (filters.ownerId) {
            qb.andWhere('herdBook.ownerId = :ownerId', { ownerId: filters.ownerId });
        }

        if (filters.id) {
            const ids = Array.isArray(filters.id) ? filters.id : [filters.id];
            qb.andWhere('herdBook.id IN (:...ids)', { ids });
        }

        if (filters.q) {
            qb.andWhere('herdBook.reference ILIKE :q', { q: `%${filters.q}%` });
        }

        qb.distinct(true);
    }

    async findOneWithRelations(id: string, ownerId?: string): Promise<HerdBook | null> {
        const qb = this.createQueryBuilder('herdBook');
        this.applyStandardJoins(qb, ['owner', 'entries']);
        
        qb.where('herdBook.id = :id', { id });

        if (ownerId) {
            qb.andWhere('herdBook.ownerId = :ownerId', { ownerId });
        }

        return qb.getOne();
    }
}

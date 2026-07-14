import { Injectable } from '@nestjs/common';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Cattle } from './entities/cattle.entity';
import { BaseRepository } from '../../common/repositories/base.repository';
import { PaginationOptions } from '../../common/utils/pagination.util';

export interface CattleFilters {
    id?: string | string[];
    q?: string;
    gender?: string;
    category?: string;
    character?: string;
    sourceType?: string;
    /** ownerId déjà résolu par le service selon le rôle de l'utilisateur */
    ownerId?: string | null;
    /** organizationId pour le filtrage multi-tenant */
    organizationId?: string | null;
    herdBookId?: string;
    excludedHerdBookId?: string;
    motherId?: string;
}

@Injectable()
export class CattleRepository extends BaseRepository<Cattle> {
    constructor(
        @InjectDataSource() private readonly _dataSource: DataSource,
    ) {
        super(Cattle, _dataSource.createEntityManager());
    }

    async findAllWithRelations(
        filters: CattleFilters,
        pagination: PaginationOptions,
    ) {
        const qb = this.createQueryBuilder('cattle');
        
        this.applyStandardJoins(qb, [
            'character',
            'herdBookEntries',
            'herdBookEntries.herdBook',
            'herdBookEntries.category',
            'herdBookEntries.status',
            'events',
            'treatments',
            'photos'
        ]);

        this.applyFilters(qb, filters);

        return this.paginate(qb, pagination);
    }

    private applyFilters(qb: SelectQueryBuilder<Cattle>, filters: CattleFilters) {
        // Le service a déjà résolu l'ownerId selon le rôle de l'utilisateur
        if (filters.ownerId) {
            qb.andWhere('cattle.ownerId = :ownerId', { ownerId: filters.ownerId });
        }

        // Filtrage par organization pour le multi-tenant
        if (filters.organizationId) {
            qb.andWhere('cattle.organizationId = :organizationId', { organizationId: filters.organizationId });
        }

        if (filters.herdBookId) {
            qb.andWhere('herdBook.id = :herdBookId', { herdBookId: filters.herdBookId });
        }

        if (filters.excludedHerdBookId) {
            qb.andWhere((subQb) => {
                const subQuery = subQb
                    .subQuery()
                    .select('excludedHbc.cattle_id')
                    .from('herd_book_cattle', 'excludedHbc')
                    .where('excludedHbc.herd_book_id = :excludedHerdBookId')
                    .getQuery();
                return `cattle.id NOT IN ${subQuery}`;
            }, { excludedHerdBookId: filters.excludedHerdBookId });
        }

        if (filters.motherId) {
            qb.andWhere('cattle.motherId = :motherId', { motherId: filters.motherId });
        }

        if (filters.q) {
            qb.andWhere(
                '(cattle.name ILIKE :q OR cattle.nickname ILIKE :q OR cattle.id ILIKE :q)',
                { q: `%${filters.q}%` },
            );
        }

        if (filters.gender) {
            qb.andWhere('cattle.gender = :gender', { gender: filters.gender });
        }

        if (filters.character) {
            qb.andWhere('cattle.characterId = :character', { character: filters.character });
        }

        if (filters.sourceType) {
            qb.andWhere('cattle.sourceType = :sourceType', { sourceType: filters.sourceType });
        }

        if (filters.category) {
            qb.andWhere('herdBookEntries.categoryId = :category', { category: filters.category });
        }

        if (filters.id) {
            const ids = Array.isArray(filters.id) ? filters.id : [filters.id];
            qb.andWhere('cattle.id IN (:...ids)', { ids });
        }

        qb.distinct(true);
    }

    async findOneWithRelations(id: string): Promise<Cattle | null> {
        const qb = this.createQueryBuilder('cattle');
        this.applyStandardJoins(qb, [
            'character',
            'mother',
            'herdBookEntries',
            'herdBookEntries.herdBook',
            'herdBookEntries.category',
            'herdBookEntries.status',
            'events',
            'treatments',
            'photos'
        ]);
        return qb.where('cattle.id = :id', { id }).getOne();
    }

    async findOneWithBasicRelations(id: string): Promise<Cattle | null> {
        return this.findOne({
            where: { id },
            relations: [
                'character',
                'herdBookEntries',
                'herdBookEntries.herdBook',
                'herdBookEntries.category',
                'herdBookEntries.status',
                'events',
                'treatments',
                'photos',
            ],
        });
    }

    async findOneForUpdate(id: string): Promise<Cattle | null> {
        return this.findOne({
            where: { id },
            relations: ['events', 'treatments', 'herdBookEntries', 'herdBookEntries.herdBook', 'photos'],
        });
    }
}

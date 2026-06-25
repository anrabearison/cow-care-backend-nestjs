import { Injectable } from '@nestjs/common';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Character } from './entities/character.entity';
import { BaseRepository } from '../../common/repositories/base.repository';
import { PaginationOptions } from '../../common/utils/pagination.util';

@Injectable()
export class CharactersRepository extends BaseRepository<Character> {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) {
        super(Character, dataSource.createEntityManager());
    }

    async findAllWithRelations(
        filters: any,
        pagination: PaginationOptions,
    ) {
        const qb = this.createQueryBuilder('character');
        this.applyFilters(qb, filters);
        return this.paginate(qb, pagination);
    }

    private applyFilters(qb: SelectQueryBuilder<Character>, filters: any) {
        if (filters.id) {
            const ids = Array.isArray(filters.id) ? filters.id : [filters.id];
            qb.andWhere('character.id IN (:...ids)', { ids });
        }

        if (filters.q) {
            qb.andWhere('character.name ILIKE :q', { q: `%${filters.q}%` });
        }
    }
}

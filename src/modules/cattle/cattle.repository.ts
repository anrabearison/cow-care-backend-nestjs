import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Cattle } from '../../entities/cattle.entity';

export interface CattleFilters {
    q?: string;
    gender?: string;
    category?: string;
    character?: string;
    source_type?: string;
    owner_id?: string;
    herd_book_id?: string;
    userRole?: string;
    userOwnerId?: string;
}

export interface CattlePaginationOptions {
    page: number;
    per_page: number;
    sort: string;
    order: 'ASC' | 'DESC';
}

@Injectable()
export class CattleRepository extends Repository<Cattle> {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) {
        super(Cattle, dataSource.createEntityManager());
    }

    async findAllWithRelations(
        filters: CattleFilters,
        pagination: CattlePaginationOptions,
    ): Promise<[Cattle[], number]> {
        const { page, per_page, sort, order } = pagination;
        const skip = (page - 1) * per_page;

        const qb = this.createQueryBuilder('cattle')
            .leftJoinAndSelect('cattle.character', 'character')
            .leftJoinAndSelect('cattle.herdBookEntries', 'herdBookEntries')
            .leftJoinAndSelect('herdBookEntries.herdBook', 'herdBook')
            .leftJoinAndSelect('herdBookEntries.category', 'category')
            .leftJoinAndSelect('herdBookEntries.status', 'status')
            .leftJoinAndSelect('cattle.events', 'events')
            .leftJoinAndSelect('cattle.treatments', 'treatments');

        // RBAC filtering
        if (filters.userRole !== 'SUPER_ADMIN') {
            if (filters.userOwnerId) {
                qb.andWhere('herdBook.ownerId = :ownerId', { ownerId: filters.userOwnerId });
            } else {
                return [[], 0];
            }
        } else if (filters.owner_id) {
            qb.andWhere('herdBook.ownerId = :ownerId', { ownerId: filters.owner_id });
        }

        if (filters.herd_book_id) {
            qb.andWhere('herdBook.id = :herdBookId', { herdBookId: filters.herd_book_id });
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

        if (filters.source_type) {
            qb.andWhere('cattle.sourceType = :sourceType', { sourceType: filters.source_type });
        }

        if (filters.category) {
            qb.andWhere('herdBookEntries.categoryId = :category', { category: filters.category });
        }

        qb.distinct(true);
        qb.orderBy(`cattle.${sort}`, order);
        qb.skip(skip).take(per_page);

        return qb.getManyAndCount();
    }

    async findOneWithRelations(id: string): Promise<Cattle | null> {
        return this.createQueryBuilder('cattle')
            .leftJoinAndSelect('cattle.character', 'character')
            .leftJoinAndSelect('cattle.mother', 'mother')
            .leftJoinAndSelect('cattle.herdBookEntries', 'herdBookEntries')
            .leftJoinAndSelect('herdBookEntries.herdBook', 'herdBook')
            .leftJoinAndSelect('herdBookEntries.category', 'category')
            .leftJoinAndSelect('herdBookEntries.status', 'status')
            .leftJoinAndSelect('cattle.events', 'events')
            .leftJoinAndSelect('cattle.treatments', 'treatments')
            .where('cattle.id = :id', { id })
            .getOne();
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
            ],
        });
    }

    async findOneForUpdate(id: string): Promise<Cattle | null> {
        return this.findOne({
            where: { id },
            relations: ['events', 'treatments', 'herdBookEntries', 'herdBookEntries.herdBook'],
        });
    }
}

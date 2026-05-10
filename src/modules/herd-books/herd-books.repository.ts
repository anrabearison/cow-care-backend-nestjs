import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { HerdBook } from '../../entities/herd-book.entity';
import { UserRole } from '../../entities/user.entity';

export interface HerdBooksFilters {
    ownerId?: string;
    currentUserRole?: string;
    currentUserOwnerId?: string | null;
}

export interface HerdBooksPaginationOptions {
    page: number;
    perPage: number;
    sort: string;
    order: 'ASC' | 'DESC';
}

@Injectable()
export class HerdBooksRepository extends Repository<HerdBook> {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) {
        super(HerdBook, dataSource.createEntityManager());
    }

    async findAllWithRelations(
        filters: HerdBooksFilters,
        pagination: HerdBooksPaginationOptions,
    ): Promise<[HerdBook[], number]> {
        const { page, perPage, sort, order } = pagination;
        const skip = (page - 1) * perPage;

        const qb = this.createQueryBuilder('herdBook')
            .leftJoinAndSelect('herdBook.owner', 'owner');

        // RBAC filtering
        if (filters.currentUserRole && filters.currentUserRole !== UserRole.SUPER_ADMIN) {
            if (filters.currentUserOwnerId) {
                qb.andWhere('herdBook.ownerId = :ownerId', { ownerId: filters.currentUserOwnerId });
            } else {
                return [[], 0];
            }
        } else if (filters.ownerId) {
            qb.andWhere('herdBook.ownerId = :ownerId', { ownerId: filters.ownerId });
        }

        const sortMapping = {
            'created_at': 'createdAt',
            'updated_at': 'updatedAt',
            'owner_id': 'ownerId'
        };
        const sortField = sortMapping[sort] || sort;

        qb.orderBy(`herdBook.${sortField}`, order);
        qb.skip(skip).take(perPage);
        qb.loadRelationCountAndMap('herdBook.cattleCount', 'herdBook.entries');

        return qb.getManyAndCount();
    }

    async findOneWithRelations(id: string): Promise<HerdBook | null> {
        return this.createQueryBuilder('herdBook')
            .leftJoinAndSelect('herdBook.owner', 'owner')
            .where('herdBook.id = :id', { id })
            .loadRelationCountAndMap('herdBook.cattleCount', 'herdBook.entries')
            .getOne();
    }
}

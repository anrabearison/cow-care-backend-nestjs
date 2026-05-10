import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { HerdBook } from '../../entities/herd-book.entity';
import { UserRole } from '../../entities/user.entity';

export interface HerdBooksFilters {
    owner_id?: string;
    currentUserRole?: string;
    currentUserOwnerId?: string | null;
}

export interface HerdBooksPaginationOptions {
    page: number;
    per_page: number;
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
        const { page, per_page, sort, order } = pagination;
        const skip = (page - 1) * per_page;

        const qb = this.createQueryBuilder('herdBook');

        // RBAC filtering
        if (filters.currentUserRole && filters.currentUserRole !== UserRole.SUPER_ADMIN) {
            if (filters.currentUserOwnerId) {
                qb.andWhere('herdBook.ownerId = :ownerId', { ownerId: filters.currentUserOwnerId });
            } else {
                return [[], 0];
            }
        } else if (filters.owner_id) {
            qb.andWhere('herdBook.ownerId = :ownerId', { ownerId: filters.owner_id });
        }

        const sortMapping = {
            'created_at': 'createdAt',
            'updated_at': 'updatedAt',
            'owner_id': 'ownerId'
        };
        const sortField = sortMapping[sort] || sort;

        qb.orderBy(`herdBook.${sortField}`, order);
        qb.skip(skip).take(per_page);
        qb.loadRelationCountAndMap('herdBook.cattleCount', 'herdBook.entries');

        return qb.getManyAndCount();
    }

    async findOneWithRelations(id: string): Promise<HerdBook | null> {
        return this.createQueryBuilder('herdBook')
            .where('herdBook.id = :id', { id })
            .loadRelationCountAndMap('herdBook.cattleCount', 'herdBook.entries')
            .getOne();
    }
}

import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { HerdBookCattle } from '../../entities/herd-book-cattle.entity';
import { UserRole } from '../../entities/user.entity';

export interface HerdBookCattleFilters {
    q?: string;
    herd_book_id?: string;
    cattle_id?: string;
    category_id?: string;
    status_id?: string;
    id?: string | string[];
    currentUserRole?: string;
    currentUserOwnerId?: string | null;
}

export interface HerdBookCattlePaginationOptions {
    page: number;
    per_page: number;
    sort: string;
    order: 'ASC' | 'DESC';
}

@Injectable()
export class HerdBookCattleRepository extends Repository<HerdBookCattle> {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) {
        super(HerdBookCattle, dataSource.createEntityManager());
    }

    async findAllWithRelations(
        filters: HerdBookCattleFilters,
        pagination: HerdBookCattlePaginationOptions,
    ): Promise<[HerdBookCattle[], number]> {
        const { page, per_page, sort, order } = pagination;
        const skip = (page - 1) * per_page;

        const qb = this.createQueryBuilder('hbc')
            .leftJoinAndSelect('hbc.herdBook', 'herdBook')
            .leftJoinAndSelect('hbc.cattle', 'cattle')
            .leftJoinAndSelect('hbc.category', 'category')
            .leftJoinAndSelect('hbc.status', 'status');

        // RBAC filtering
        if (filters.currentUserRole && filters.currentUserRole !== UserRole.SUPER_ADMIN) {
            // Note: In original code it used user.owner_id as herdBookId. 
            // Assuming ownerId = herdBookId for non-admins is a simplification or requirement.
            if (filters.currentUserOwnerId) {
                qb.andWhere('hbc.herdBookId = :herdBookId', { herdBookId: filters.currentUserOwnerId });
            } else {
                return [[], 0];
            }
        }

        if (filters.herd_book_id) qb.andWhere('hbc.herdBookId = :herdBookId', { herdBookId: filters.herd_book_id });
        if (filters.cattle_id) qb.andWhere('hbc.cattleId = :cattleId', { cattleId: filters.cattle_id });
        if (filters.category_id) qb.andWhere('hbc.categoryId = :categoryId', { categoryId: filters.category_id });
        if (filters.status_id) qb.andWhere('hbc.statusId = :statusId', { statusId: filters.status_id });
        
        if (filters.id) {
            const ids = Array.isArray(filters.id) ? filters.id : [filters.id];
            qb.andWhere('hbc.id IN (:...ids)', { ids });
        }

        if (filters.q) {
            qb.andWhere('(hbc.nCarnet ILIKE :search OR hbc.categoryId ILIKE :search)', { search: `%${filters.q}%` });
        }

        const sortMapping = {
            'created_at': 'createdAt',
            'updated_at': 'updatedAt',
            'n_carnet': 'nCarnet',
            'herd_book_id': 'herdBookId',
            'cattle_id': 'cattleId',
            'category_id': 'categoryId',
            'status_id': 'statusId'
        };
        const sortField = sortMapping[sort] || sort;

        qb.orderBy(`hbc.${sortField}`, order);
        qb.skip(skip).take(per_page);

        return qb.getManyAndCount();
    }

    async findOneWithRelations(id: string): Promise<HerdBookCattle | null> {
        return this.findOne({
            where: { id },
            relations: ['herdBook', 'cattle', 'category', 'status']
        });
    }
}

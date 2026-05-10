import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { HerdBookCattle } from '../../entities/herd-book-cattle.entity';
import { UserRole } from '../../entities/user.entity';

export interface HerdBookCattleFilters {
    q?: string;
    herdBookId?: string;
    cattleId?: string;
    categoryId?: string;
    statusId?: string;
    id?: string | string[];
    currentUserRole?: string;
    currentUserOwnerId?: string | null;
}

export interface HerdBookCattlePaginationOptions {
    page: number;
    perPage: number;
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
        const { page, perPage, sort, order } = pagination;
        const skip = (page - 1) * perPage;

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

        if (filters.herdBookId) qb.andWhere('hbc.herdBookId = :herdBookId', { herdBookId: filters.herdBookId });
        if (filters.cattleId) qb.andWhere('hbc.cattleId = :cattleId', { cattleId: filters.cattleId });
        if (filters.categoryId) qb.andWhere('hbc.categoryId = :categoryId', { categoryId: filters.categoryId });
        if (filters.statusId) qb.andWhere('hbc.statusId = :statusId', { statusId: filters.statusId });
        
        if (filters.id) {
            const ids = Array.isArray(filters.id) ? filters.id : [filters.id];
            qb.andWhere('hbc.id IN (:...ids)', { ids });
        }

        if (filters.q) {
            qb.andWhere('(hbc.nCarnet ILIKE :search OR hbc.categoryId ILIKE :search)', { search: `%${filters.q}%` });
        }

        const sortMapping = {
            'createdAt': 'createdAt',
            'updatedAt': 'updatedAt',
            'nCarnet': 'nCarnet',
            'herdBookId': 'herdBookId',
            'cattleId': 'cattleId',
            'categoryId': 'categoryId',
            'statusId': 'statusId'
        };
        const sortField = sortMapping[sort] || sort;

        qb.orderBy(`hbc.${sortField}`, order);
        qb.skip(skip).take(perPage);

        return qb.getManyAndCount();
    }

    async findOneWithRelations(id: string): Promise<HerdBookCattle | null> {
        return this.findOne({
            where: { id },
            relations: ['herdBook', 'cattle', 'category', 'status']
        });
    }
}

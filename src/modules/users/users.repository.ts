import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { User, UserRole } from '../../entities/user.entity';

export interface UsersFilters {
    q?: string;
    role?: string;
    id?: string | string[];
    owner_id?: string;
    currentUserRole: UserRole;
    currentUserOwnerId: string | null;
}

export interface UsersPaginationOptions {
    page: number;
    perPage: number;
    sort: string;
    order: 'ASC' | 'DESC';
}

@Injectable()
export class UsersRepository extends Repository<User> {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) {
        super(User, dataSource.createEntityManager());
    }

    async findAllWithRelations(
        filters: UsersFilters,
        pagination: UsersPaginationOptions,
    ): Promise<[User[], number]> {
        const { page, perPage, sort, order } = pagination;
        const skip = (page - 1) * perPage;

        const qb = this.createQueryBuilder('user')
            .leftJoinAndSelect('user.owner', 'owner');

        // RBAC: Filter by owner for non-super admins
        if (filters.currentUserRole !== UserRole.SUPER_ADMIN) {
            if (!filters.currentUserOwnerId) {
                return [[], 0];
            }
            qb.andWhere('user.ownerId = :currentOwnerId', { currentOwnerId: filters.currentUserOwnerId });
        } else if (filters.owner_id) {
            // Super admin filtering by owner
            qb.andWhere('user.ownerId = :ownerId', { ownerId: filters.owner_id });
        }

        // Filtering
        if (filters.q) {
            qb.andWhere('(user.name ILIKE :q OR user.email ILIKE :q)', { q: `%${filters.q}%` });
        }
        if (filters.role) {
            qb.andWhere('user.role = :role', { role: filters.role });
        }
        if (filters.id) {
            const ids = Array.isArray(filters.id) ? filters.id : [filters.id];
            qb.andWhere('user.id IN (:...ids)', { ids });
        }

        // Sorting
        const sortMapping = {
            'owner_id': 'ownerId',
            'created_at': 'createdAt',
            'updated_at': 'updatedAt'
        };
        const sortField = sortMapping[sort] || sort;

        qb.orderBy(`user.${sortField}`, order);
        qb.skip(skip).take(perPage);

        return qb.getManyAndCount();
    }

    async findOneWithRelations(id: string): Promise<User | null> {
        return this.findOne({
            where: { id },
            relations: ['owner']
        });
    }
}

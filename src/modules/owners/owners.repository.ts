import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Owner } from '../../entities/owner.entity';
import { UserRole } from '../../entities/user.entity';

export interface OwnersFilters {
    q?: string;
    id?: string | string[];
    currentUserRole?: string;
    currentUserOwnerId?: string | null;
}

export interface OwnersPaginationOptions {
    page: number;
    per_page: number;
    sort: string;
    order: 'ASC' | 'DESC';
}

@Injectable()
export class OwnersRepository extends Repository<Owner> {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) {
        super(Owner, dataSource.createEntityManager());
    }

    async findAllWithRelations(
        filters: OwnersFilters,
        pagination: OwnersPaginationOptions,
    ): Promise<[Owner[], number]> {
        const { page, per_page, sort, order } = pagination;
        const skip = (page - 1) * per_page;

        const qb = this.createQueryBuilder('owner');

        // RBAC: Filter by owner for non-super admins
        if (filters.currentUserRole && filters.currentUserRole !== UserRole.SUPER_ADMIN) {
            if (filters.currentUserOwnerId) {
                qb.andWhere('owner.id = :ownerId', { ownerId: filters.currentUserOwnerId });
            } else {
                return [[], 0];
            }
        }

        if (filters.id) {
            const ids = Array.isArray(filters.id) ? filters.id : [filters.id];
            qb.andWhere('owner.id IN (:...ids)', { ids });
        }

        if (filters.q) {
            qb.andWhere('(owner.name ILIKE :q OR owner.contactInfo ILIKE :q OR owner.address ILIKE :q)', { q: `%${filters.q}%` });
        }

        qb.orderBy(`owner.${sort}`, order);
        qb.skip(skip).take(per_page);

        return qb.getManyAndCount();
    }

    async findOneWithRelations(id: string, userRole?: string, userOwnerId?: string): Promise<Owner | null> {
        const qb = this.createQueryBuilder('owner')
            .where('owner.id = :id', { id });

        if (userRole && userRole !== UserRole.SUPER_ADMIN) {
            if (userOwnerId !== id) {
                return null;
            }
        }

        return qb.getOne();
    }
}

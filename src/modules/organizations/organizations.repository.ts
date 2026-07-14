import { Injectable } from '@nestjs/common';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Organization } from './entities/organization.entity';
import { BaseRepository } from '../../common/repositories/base.repository';
import { PaginationOptions } from '../../common/utils/pagination.util';

export interface OrganizationsFilters {
    q?: string;
    isActive?: boolean;
    code?: string;
}

@Injectable()
export class OrganizationsRepository extends BaseRepository<Organization> {
    constructor(
        @InjectDataSource() private readonly _dataSource: DataSource,
    ) {
        super(Organization, _dataSource.createEntityManager());
    }

    async findAllWithRelations(
        filters: OrganizationsFilters,
        pagination: PaginationOptions,
    ) {
        const qb = this.createQueryBuilder('organization');
        
        this.applyStandardJoins(qb, [
            'users'
        ]);

        this.applyFilters(qb, filters);

        return this.paginate(qb, pagination);
    }

    private applyFilters(qb: SelectQueryBuilder<Organization>, filters: OrganizationsFilters) {
        if (filters.code) {
            qb.andWhere('organization.code = :code', { code: filters.code });
        }

        if (filters.isActive !== undefined) {
            qb.andWhere('organization.isActive = :isActive', { isActive: filters.isActive });
        }

        if (filters.q) {
            qb.andWhere('(organization.name ILIKE :q OR organization.code ILIKE :q OR organization.description ILIKE :q)', { 
                q: `%${filters.q}%` 
            });
        }
    }

    async findByCode(code: string): Promise<Organization | null> {
        return this.findOne({ where: { code } });
    }
}

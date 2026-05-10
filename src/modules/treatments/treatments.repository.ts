import { Injectable } from '@nestjs/common';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Treatment } from '../../entities/treatment.entity';
import { BaseRepository } from '../../common/repositories/base.repository';
import { PaginationOptions } from '../../common/utils/pagination.util';

export interface TreatmentsFilters {
    cattleId?: string;
    type?: string;
    ownerId?: string;
    userRole?: string;
    userOwnerId?: string;
}

@Injectable()
export class TreatmentsRepository extends BaseRepository<Treatment> {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) {
        super(Treatment, dataSource.createEntityManager());
    }

    async findAllWithRelations(
        filters: TreatmentsFilters,
        pagination: PaginationOptions,
    ) {
        const qb = this.createQueryBuilder('treatment');
        
        this.applyStandardJoins(qb, [
            'cattle',
            'medicament',
            'veterinarian'
        ]);

        this.applyFilters(qb, filters);

        return this.paginate(qb, pagination);
    }

    private applyFilters(qb: SelectQueryBuilder<Treatment>, filters: TreatmentsFilters) {
        // RBAC & Owner Filtering
        if (filters.userRole !== 'SUPER_ADMIN') {
            if (!filters.userOwnerId) {
                qb.andWhere('1=0');
            } else {
                qb.innerJoin('cattle.herdBookEntries', 'herdBookEntries')
                  .innerJoin('herdBookEntries.herdBook', 'herdBook')
                  .andWhere('herdBook.ownerId = :ownerId', { ownerId: filters.userOwnerId });
                qb.distinct(true);
            }
        } else if (filters.ownerId) {
            qb.innerJoin('cattle.herdBookEntries', 'herdBookEntries')
              .innerJoin('herdBookEntries.herdBook', 'herdBook')
              .andWhere('herdBook.ownerId = :ownerId', { ownerId: filters.ownerId });
            qb.distinct(true);
        }

        if (filters.cattleId) {
            qb.andWhere('treatment.cattleId = :cattleId', { cattleId: filters.cattleId });
        }

        if (filters.type) {
            qb.andWhere('treatment.type = :type', { type: filters.type });
        }
    }

    async findOneWithRelations(id: string, userRole?: string, userOwnerId?: string): Promise<Treatment | null> {
        const qb = this.createQueryBuilder('treatment');
        this.applyStandardJoins(qb, ['cattle', 'medicament', 'veterinarian']);
        
        qb.where('treatment.id = :id', { id });

        if (userRole !== 'SUPER_ADMIN' && userOwnerId) {
            qb.innerJoin('cattle.herdBookEntries', 'herdBookEntries')
              .innerJoin('herdBookEntries.herdBook', 'herdBook')
              .andWhere('herdBook.ownerId = :ownerId', { ownerId: userOwnerId });
        }

        return qb.getOne();
    }
}

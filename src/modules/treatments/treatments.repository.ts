import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Treatment } from '../../entities/treatment.entity';

export interface TreatmentsFilters {
    cattleId?: string;
    type?: string;
    ownerId?: string;
    userRole?: string;
    userOwnerId?: string;
}

export interface TreatmentsPaginationOptions {
    page: number;
    perPage: number;
    sort: string;
    order: 'ASC' | 'DESC';
}

@Injectable()
export class TreatmentsRepository extends Repository<Treatment> {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) {
        super(Treatment, dataSource.createEntityManager());
    }

    async findAllWithRelations(
        filters: TreatmentsFilters,
        pagination: TreatmentsPaginationOptions,
    ): Promise<[Treatment[], number]> {
        const { page, perPage, sort, order } = pagination;
        const skip = (page - 1) * perPage;

        const qb = this.createQueryBuilder('treatment')
            .leftJoinAndSelect('treatment.cattle', 'cattle')
            .leftJoinAndSelect('treatment.medicament', 'medicament')
            .leftJoinAndSelect('treatment.veterinarian', 'veterinarian');

        // RBAC & Owner Filtering
        let filterOwnerId = null;
        if (filters.userRole !== 'SUPER_ADMIN') {
            if (!filters.userOwnerId) {
                return [[], 0];
            }
            filterOwnerId = filters.userOwnerId;
        } else if (filters.ownerId) {
            filterOwnerId = filters.ownerId;
        }

        if (filterOwnerId) {
            qb.innerJoin('cattle.herdBookEntries', 'herdBookEntries')
              .innerJoin('herdBookEntries.herdBook', 'herdBook')
              .andWhere('herdBook.ownerId = :ownerId', { ownerId: filterOwnerId });
            qb.distinct(true);
        }

        if (filters.cattleId) {
            qb.andWhere('treatment.cattleId = :cattleId', { cattleId: filters.cattleId });
        }

        if (filters.type) {
            qb.andWhere('treatment.type = :type', { type: filters.type });
        }

        qb.orderBy(`treatment.${sort}`, order);
        qb.skip(skip).take(perPage);

        return qb.getManyAndCount();
    }

    async findOneWithRelations(id: string, userRole?: string, userOwnerId?: string): Promise<Treatment | null> {
        const qb = this.createQueryBuilder('treatment')
            .leftJoinAndSelect('treatment.cattle', 'cattle')
            .leftJoinAndSelect('treatment.medicament', 'medicament')
            .leftJoinAndSelect('treatment.veterinarian', 'veterinarian')
            .where('treatment.id = :id', { id });

        if (userRole !== 'SUPER_ADMIN') {
            if (!userOwnerId) {
                return null;
            }
            qb.innerJoin('cattle.herdBookEntries', 'herdBookEntries')
              .innerJoin('herdBookEntries.herdBook', 'herdBook')
              .andWhere('herdBook.ownerId = :ownerId', { ownerId: userOwnerId });
        }

        return qb.getOne();
    }
}

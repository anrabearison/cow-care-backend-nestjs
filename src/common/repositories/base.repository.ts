import { Repository, SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import { PaginationOptions, getPaginationOffsets, formatPaginatedResponse } from '../utils/pagination.util';

export abstract class BaseRepository<T extends ObjectLiteral> extends Repository<T> {
    
    /**
     * Applique la pagination à un QueryBuilder
     */
    protected async paginate(
        qb: SelectQueryBuilder<T>,
        options: PaginationOptions
    ) {
        const { skip, take, page, perPage } = getPaginationOffsets(options);
        
        if (options.sort) {
            const sortField = options.sort.includes('.') ? options.sort : `${qb.alias}.${options.sort}`;
            qb.orderBy(sortField, options.order || 'ASC');
        }

        qb.skip(skip).take(take);

        const [data, total] = await qb.getManyAndCount();
        return formatPaginatedResponse(data, total, { page, perPage });
    }

    /**
     * Helper pour ajouter des jointures communes
     */
    protected applyStandardJoins(qb: SelectQueryBuilder<T>, relations: string[]) {
        relations.forEach(rel => {
            const parts = rel.split('.');
            if (parts.length === 1) {
                qb.leftJoinAndSelect(`${qb.alias}.${rel}`, rel);
            } else {
                // Gère les jointures imbriquées (ex: 'herdBookEntries.herdBook')
                qb.leftJoinAndSelect(rel, parts[parts.length - 1]);
            }
        });
        return qb;
    }
}

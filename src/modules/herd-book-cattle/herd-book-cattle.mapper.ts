import { BaseMapper } from '../../common/mappers/base.mapper';
import { HerdBookCattle } from './entities/herd-book-cattle.entity';

export class HerdBookCattleMapper extends BaseMapper {
    static toResponse(hbc: HerdBookCattle) {
        if (!hbc) return null;

        return {
            id: hbc.id,
            cattleId: hbc.cattleId,
            cattle: hbc.cattle ? {
                id: hbc.cattle.id,
                name: hbc.cattle.name,
                nickname: hbc.cattle.nickname,
            } : null,
            herdBookId: hbc.herdBookId,
            herdBook: hbc.herdBook ? {
                id: hbc.herdBook.id,
                reference: hbc.herdBook.reference,
                ownerId: hbc.herdBook.ownerId,
                owner: hbc.herdBook.owner ? {
                    id: hbc.herdBook.owner.id,
                    name: hbc.herdBook.owner.name,
                } : null,
            } : null,
            categoryId: hbc.categoryId,
            category: hbc.category ? {
                id: hbc.category.id,
                name: hbc.category.name,
            } : null,
            statusId: hbc.statusId,
            status: hbc.status ? {
                id: hbc.status.id,
                name: hbc.status.name,
            } : null,
            nCarnet: hbc.nCarnet,
            createdAt: hbc.createdAt,
            updatedAt: hbc.updatedAt,
        };
    }

    static toResponseList(entities: HerdBookCattle[]) {
        return this.mapList(entities, (e) => this.toResponse(e));
    }
}

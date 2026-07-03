import { BaseMapper } from '../../common/mappers/base.mapper';
import { HerdBook } from './entities/herd-book.entity';

export class HerdBooksMapper extends BaseMapper {
    static toResponse(herdBook: HerdBook) {
        if (!herdBook) return null;

        return {
            id: herdBook.id,
            reference: herdBook.reference,
            description: herdBook.description,
            ownerId: herdBook.ownerId,
            owner: herdBook.owner ? {
                id: herdBook.owner.id,
                name: herdBook.owner.name,
            } : null,
            cattleCount: herdBook.entries ? herdBook.entries.length : 0,
            createdAt: herdBook.createdAt,
            updatedAt: herdBook.updatedAt,
        };
    }

    static toResponseList(entities: HerdBook[]) {
        return this.mapList(entities, (e) => this.toResponse(e));
    }
}

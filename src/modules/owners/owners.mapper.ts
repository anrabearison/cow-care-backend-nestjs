import { BaseMapper } from '../../common/mappers/base.mapper';
import { Owner } from './entities/owner.entity';

export class OwnersMapper extends BaseMapper {
    static toResponse(owner: Owner) {
        if (!owner) return null;

        return {
            id: owner.id,
            name: owner.name,
            contactInfo: owner.contactInfo,
            address: owner.address,
            createdAt: owner.createdAt,
            updatedAt: owner.updatedAt,
        };
    }

    static toResponseList(entities: Owner[]) {
        return this.mapList(entities, (e) => this.toResponse(e));
    }
}

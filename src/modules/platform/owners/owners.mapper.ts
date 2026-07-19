import { BaseMapper } from '../../../common/mappers/base.mapper';
import { Owner } from './entities/owner.entity';

export class OwnersMapper extends BaseMapper {
    static toResponse(owner: Owner) {
        if (!owner) return null;

        return {
            id: owner.id,
            name: owner.name,
            email: owner.email,
            phone: owner.phone,
            address: owner.address,
            city: owner.city,
            createdAt: owner.createdAt,
            updatedAt: owner.updatedAt,
        };
    }

    static toResponseList(entities: Owner[]) {
        return this.mapList(entities, (e) => this.toResponse(e));
    }
}

import { BaseMapper } from '../../common/mappers/base.mapper';
import { User } from './entities/user.entity';

export class UsersMapper extends BaseMapper {
    static toResponse(user: User) {
        if (!user) return null;

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            ownerId: user.ownerId,
            owner: user.owner ? {
                id: user.owner.id,
                name: user.owner.name,
            } : null,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }

    static toResponseList(entities: User[]) {
        return this.mapList(entities, (e) => this.toResponse(e));
    }
}

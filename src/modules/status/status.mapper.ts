import { BaseMapper } from '../../common/mappers/base.mapper';
import { Status } from '../../entities/status.entity';

export class StatusMapper extends BaseMapper {
    static toResponse(status: Status) {
        if (!status) return null;
        return {
            id: status.id,
            name: status.name,
            createdAt: status.createdAt,
            updatedAt: status.updatedAt,
        };
    }

    static toResponseList(entities: Status[]) {
        return this.mapList(entities, (e) => this.toResponse(e));
    }
}

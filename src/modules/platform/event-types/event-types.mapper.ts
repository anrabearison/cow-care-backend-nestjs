import { BaseMapper } from '../../../common/mappers/base.mapper';
import { EventType } from './entities/event-type.entity';

export class EventTypesMapper extends BaseMapper {
    static toResponse(eventType: EventType) {
        if (!eventType) return null;
        return {
            id: eventType.id,
            name: eventType.name,
            icon: eventType.icon,
            description: eventType.description,
            createdAt: eventType.createdAt,
            updatedAt: eventType.updatedAt,
        };
    }

    static toResponseList(entities: EventType[]) {
        return this.mapList(entities, (e) => this.toResponse(e));
    }
}

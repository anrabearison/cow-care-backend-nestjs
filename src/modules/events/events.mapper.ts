import { BaseMapper } from '../../common/mappers/base.mapper';
import { Event as EventEntity } from '../../entities/event.entity';

export class EventsMapper extends BaseMapper {
    static toResponse(event: EventEntity) {
        if (!event) return null;

        return {
            id: event.id,
            cattleId: event.cattleId,
            cattle: event.cattle ? {
                id: event.cattle.id,
                name: event.cattle.name,
                nickname: event.cattle.nickname,
            } : null,
            eventTypeId: event.eventTypeId,
            type: event.eventTypeId,
            eventType: event.eventType ? {
                id: event.eventType.id,
                name: event.eventType.name, // Use name
            } : null,
            date: event.date,
            description: event.description,
            details: event.details,
            createdAt: event.createdAt,
            updatedAt: event.updatedAt,
        };
    }

    static toResponseList(entities: EventEntity[]) {
        return this.mapList(entities, (e) => this.toResponse(e));
    }
}

import { Event as EventEntity } from '../../entities/event.entity';

export class EventsMapper {
    static toResponse(event: EventEntity) {
        if (!event) {
            return null;
        }

        return {
            ...event,
            type: event.eventTypeId, // Frontend expects 'type' property
        };
    }
}

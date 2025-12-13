import { Cattle } from './cattle.entity';
import { EventType } from './event-type.entity';
export declare class Event {
    id: string;
    cattleId: string;
    cattle: Cattle;
    eventTypeId: string;
    eventType: EventType;
    date: Date;
    description: string;
    details: string;
    createdAt: Date;
    updatedAt: Date;
}

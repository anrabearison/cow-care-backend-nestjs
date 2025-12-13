import { Repository } from 'typeorm';
import { Event } from '../../entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { User } from '../../entities/user.entity';
export declare class EventsService {
    private eventsRepository;
    constructor(eventsRepository: Repository<Event>);
    findAll(query: any, user: User): Promise<{
        data: {
            type: string;
            id: string;
            cattleId: string;
            cattle: import("../../entities/cattle.entity").Cattle;
            eventTypeId: string;
            eventType: import("../../entities/event-type.entity").EventType;
            date: Date;
            description: string;
            details: string;
            createdAt: Date;
            updatedAt: Date;
        }[];
        total: number;
        page: number;
        per_page: number;
    }>;
    findOne(id: string, user: User): Promise<Event>;
    create(createEventDto: CreateEventDto, user: User): Promise<Event>;
    update(id: string, updateEventDto: any, user: User): Promise<Event>;
    remove(id: string, user: User): Promise<Event>;
}

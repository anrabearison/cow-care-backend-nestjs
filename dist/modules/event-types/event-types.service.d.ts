import { Repository } from 'typeorm';
import { EventType } from '../../entities/event-type.entity';
import { CreateEventTypeDto, UpdateEventTypeDto } from './dto/create-event-type.dto';
export declare class EventTypesService {
    private eventTypesRepository;
    constructor(eventTypesRepository: Repository<EventType>);
    findAll(): Promise<EventType[]>;
    findOne(id: string): Promise<EventType>;
    create(createEventTypeDto: CreateEventTypeDto): Promise<EventType>;
    update(id: string, updateEventTypeDto: UpdateEventTypeDto): Promise<EventType>;
    remove(id: string): Promise<void>;
}

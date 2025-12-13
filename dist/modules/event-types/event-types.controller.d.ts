import { EventTypesService } from './event-types.service';
import { CreateEventTypeDto, UpdateEventTypeDto } from './dto/create-event-type.dto';
import { Response } from 'express';
export declare class EventTypesController {
    private readonly eventTypesService;
    constructor(eventTypesService: EventTypesService);
    findAll(res: Response): Promise<Response<any, Record<string, any>>>;
    findOne(id: string): Promise<import("../../entities/event-type.entity").EventType>;
    create(createEventTypeDto: CreateEventTypeDto): Promise<import("../../entities/event-type.entity").EventType>;
    update(id: string, updateEventTypeDto: UpdateEventTypeDto): Promise<import("../../entities/event-type.entity").EventType>;
    remove(id: string): Promise<void>;
}

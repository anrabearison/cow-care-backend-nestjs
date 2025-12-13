import { Response } from 'express';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
export declare class EventsController {
    private readonly eventsService;
    constructor(eventsService: EventsService);
    findAll(query: any, res: Response, req: any): Promise<void>;
    findOne(id: string, req: any): Promise<import("../../entities/event.entity").Event>;
    create(createEventDto: CreateEventDto, req: any): Promise<import("../../entities/event.entity").Event>;
    update(id: string, updateEventDto: any, req: any): Promise<import("../../entities/event.entity").Event>;
    remove(id: string, req: any): Promise<import("../../entities/event.entity").Event>;
}

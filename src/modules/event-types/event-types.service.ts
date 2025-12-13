import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventType } from '../../entities/event-type.entity';
import { CreateEventTypeDto, UpdateEventTypeDto } from './dto/create-event-type.dto';

@Injectable()
export class EventTypesService {
    constructor(
        @InjectRepository(EventType)
        private eventTypesRepository: Repository<EventType>,
    ) { }

    async findAll(): Promise<EventType[]> {
        return this.eventTypesRepository.find();
    }

    async findOne(id: string): Promise<EventType> {
        const eventType = await this.eventTypesRepository.findOne({ where: { id } });
        if (!eventType) {
            throw new NotFoundException(`EventType with ID ${id} not found`);
        }
        return eventType;
    }

    async create(createEventTypeDto: CreateEventTypeDto): Promise<EventType> {
        const eventType = this.eventTypesRepository.create(createEventTypeDto);
        return this.eventTypesRepository.save(eventType);
    }

    async update(id: string, updateEventTypeDto: UpdateEventTypeDto): Promise<EventType> {
        const eventType = await this.findOne(id);
        Object.assign(eventType, updateEventTypeDto);
        return this.eventTypesRepository.save(eventType);
    }

    async remove(id: string): Promise<void> {
        const eventType = await this.findOne(id);
        await this.eventTypesRepository.remove(eventType);
    }
}

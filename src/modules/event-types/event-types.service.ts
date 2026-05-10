import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEventTypeDto, UpdateEventTypeDto } from './dto/create-event-type.dto';
import { EventTypesRepository } from './event-types.repository';

@Injectable()
export class EventTypesService {
    constructor(
        private readonly eventTypesRepository: EventTypesRepository,
    ) { }

    async findAll() {
        return this.eventTypesRepository.findAllWithRelations();
    }

    async findOne(id: string) {
        const eventType = await this.eventTypesRepository.findOneWithRelations(id);
        if (!eventType) {
            throw new NotFoundException(`EventType with ID ${id} not found`);
        }
        return eventType;
    }

    async create(createEventTypeDto: CreateEventTypeDto) {
        const eventType = this.eventTypesRepository.create(createEventTypeDto);
        return this.eventTypesRepository.save(eventType);
    }

    async update(id: string, updateEventTypeDto: UpdateEventTypeDto) {
        const eventType = await this.eventTypesRepository.findOne({ where: { id } });
        if (!eventType) {
            throw new NotFoundException(`EventType with ID ${id} not found`);
        }
        Object.assign(eventType, updateEventTypeDto);
        return this.eventTypesRepository.save(eventType);
    }

    async remove(id: string) {
        const eventType = await this.eventTypesRepository.findOne({ where: { id } });
        if (!eventType) {
            throw new NotFoundException(`EventType with ID ${id} not found`);
        }
        await this.eventTypesRepository.remove(eventType);
        return eventType;
    }
}

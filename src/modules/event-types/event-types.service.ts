import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEventTypeDto, UpdateEventTypeDto } from './dto/create-event-type.dto';
import { EventTypesRepository } from './event-types.repository';
import { transformKeysToSnakeCase } from '../../common/utils/case-transform.util';

@Injectable()
export class EventTypesService {
    constructor(
        private readonly eventTypesRepository: EventTypesRepository,
    ) { }

    async findAll() {
        const rawData = await this.eventTypesRepository.findAllWithRelations();
        return transformKeysToSnakeCase(rawData);
    }

    async findOne(id: string) {
        const eventType = await this.eventTypesRepository.findOneWithRelations(id);
        if (!eventType) {
            throw new NotFoundException(`EventType with ID ${id} not found`);
        }
        return transformKeysToSnakeCase(eventType);
    }

    async create(createEventTypeDto: CreateEventTypeDto) {
        const eventType = this.eventTypesRepository.create(createEventTypeDto);
        const saved = await this.eventTypesRepository.save(eventType);
        return transformKeysToSnakeCase(saved);
    }

    async update(id: string, updateEventTypeDto: UpdateEventTypeDto) {
        const eventType = await this.eventTypesRepository.findOne({ where: { id } });
        if (!eventType) {
            throw new NotFoundException(`EventType with ID ${id} not found`);
        }
        Object.assign(eventType, updateEventTypeDto);
        const saved = await this.eventTypesRepository.save(eventType);
        return transformKeysToSnakeCase(saved);
    }

    async remove(id: string) {
        const eventType = await this.eventTypesRepository.findOne({ where: { id } });
        if (!eventType) {
            throw new NotFoundException(`EventType with ID ${id} not found`);
        }
        await this.eventTypesRepository.remove(eventType);
        return transformKeysToSnakeCase(eventType);
    }
}

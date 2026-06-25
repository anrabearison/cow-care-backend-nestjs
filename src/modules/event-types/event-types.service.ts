import { Injectable, NotFoundException } from '@nestjs/common';
import { EventTypesRepository } from './event-types.repository';
import { EventTypesMapper } from './event-types.mapper';
import { EventType } from './entities/event-type.entity';
import * as crypto from 'crypto';

@Injectable()
export class EventTypesService {
    constructor(
        private readonly eventTypesRepository: EventTypesRepository,
    ) { }

    async findAll(query: any) {
        const result = await this.eventTypesRepository.findAllWithRelations(query, query);

        return {
            ...result,
            data: EventTypesMapper.toResponseList(result.data)
        };
    }

    async findOne(id: string) {
        const eventType = await this.eventTypesRepository.findOne({ where: { id } });
        if (!eventType) {
            throw new NotFoundException(`EventType with ID ${id} not found`);
        }
        return EventTypesMapper.toResponse(eventType);
    }

    async create(createDto: any) {
        const eventType = this.eventTypesRepository.create({
            id: crypto.randomUUID(),
            ...createDto,
        } as any) as unknown as EventType;

        await this.eventTypesRepository.save(eventType);
        return this.findOne(eventType.id);
    }

    async update(id: string, updateDto: any) {
        const eventType = await this.eventTypesRepository.findOne({ where: { id } });
        if (!eventType) {
            throw new NotFoundException(`EventType with ID ${id} not found`);
        }

        Object.assign(eventType, updateDto);
        await this.eventTypesRepository.save(eventType);
        return this.findOne(id);
    }

    async remove(id: string) {
        const eventType = await this.eventTypesRepository.findOne({ where: { id } });
        if (!eventType) {
            throw new NotFoundException(`EventType with ID ${id} not found`);
        }
        const response = EventTypesMapper.toResponse(eventType);
        await this.eventTypesRepository.remove(eventType);
        return response;
    }
}

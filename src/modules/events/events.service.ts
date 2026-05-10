import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { User } from '../../entities/user.entity';
import { EventsRepository, EventsFilters } from './events.repository';
import { EventsMapper } from './events.mapper';
import { Event as EventEntity } from '../../entities/event.entity';
import * as crypto from 'crypto';

@Injectable()
export class EventsService {
    constructor(
        private readonly eventsRepository: EventsRepository,
    ) { }

    async findAll(query: any, user: User) {
        const filters: EventsFilters = {
            ...query,
            userRole: user.role,
            userOwnerId: user.ownerId
        };

        const result = await this.eventsRepository.findAllWithRelations(filters, query);

        return {
            ...result,
            data: EventsMapper.toResponseList(result.data)
        };
    }

    async findOne(id: string, user: User) {
        const event = await this.eventsRepository.findOneWithRelations(id, user.role, user.ownerId);
        if (!event) {
            throw new NotFoundException(`Event with ID ${id} not found`);
        }
        return EventsMapper.toResponse(event);
    }

    async create(createEventDto: CreateEventDto, user: User) {
        const event = this.eventsRepository.create({
            id: crypto.randomUUID(),
            cattleId: createEventDto.cattleId,
            eventTypeId: createEventDto.eventTypeId || createEventDto.type,
            date: createEventDto.date,
            description: createEventDto.description,
            details: createEventDto.details,
        } as any) as unknown as EventEntity;

        await this.eventsRepository.save(event);
        return this.findOne(event.id, user);
    }

    async update(id: string, updateEventDto: any, user: User) {
        const event = await this.eventsRepository.findOneWithRelations(id, user.role, user.ownerId);
        if (!event) {
            throw new NotFoundException(`Event with ID ${id} not found`);
        }

        if (updateEventDto.type) {
            updateEventDto.eventTypeId = updateEventDto.type;
            delete updateEventDto.type;
        }

        Object.assign(event, updateEventDto);

        await this.eventsRepository.save(event);
        return this.findOne(id, user);
    }

    async remove(id: string, user: User) {
        const event = await this.eventsRepository.findOneWithRelations(id, user.role, user.ownerId);
        if (!event) {
            throw new NotFoundException(`Event with ID ${id} not found`);
        }
        const response = EventsMapper.toResponse(event);
        await this.eventsRepository.remove(event);
        return response;
    }
}

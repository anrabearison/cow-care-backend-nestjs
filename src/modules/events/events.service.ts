import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { EventsRepository, EventsFilters } from './events.repository';
import { EventsMapper } from './events.mapper';
import { Event as EventEntity } from './entities/event.entity';
import * as crypto from 'crypto';

@Injectable()
export class EventsService {
    constructor(
        private readonly eventsRepository: EventsRepository,
    ) { }

    async findAll(query: any, user: User) {
        // Résolution RBAC : le repository ne reçoit qu'un ownerId déjà calculé
        let ownerId: string | null = null;
        if (user.role === UserRole.SUPER_ADMIN) {
            ownerId = query.ownerId ?? null;
        } else {
            if (!user.ownerId) {
                throw new ForbiddenException('User must belong to an owner to list events');
            }
            ownerId = user.ownerId;
        }

        const filters: EventsFilters = {
            ...query,
            ownerId,
        };

        const result = await this.eventsRepository.findAllWithRelations(filters, query);

        return {
            ...result,
            data: EventsMapper.toResponseList(result.data)
        };
    }

    async findOne(id: string, user: User) {
        const ownerId = user.role !== UserRole.SUPER_ADMIN ? user.ownerId : undefined;
        const event = await this.eventsRepository.findOneWithRelations(id, ownerId);
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

    async update(id: string, updateEventDto: UpdateEventDto, user: User) {
        const ownerId = user.role !== UserRole.SUPER_ADMIN ? user.ownerId : undefined;
        const event = await this.eventsRepository.findOneWithRelations(id, ownerId);
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
        const ownerId = user.role !== UserRole.SUPER_ADMIN ? user.ownerId : undefined;
        const event = await this.eventsRepository.findOneWithRelations(id, ownerId);
        if (!event) {
            throw new NotFoundException(`Event with ID ${id} not found`);
        }
        const response = EventsMapper.toResponse(event);
        await this.eventsRepository.remove(event);
        return response;
    }
}

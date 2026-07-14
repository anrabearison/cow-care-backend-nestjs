import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { User } from '../users/entities/user.entity';
import { EventsRepository, EventsFilters } from './events.repository';
import { EventsMapper } from './events.mapper';
import { Event as EventEntity } from './entities/event.entity';
import { resolveOwnerIdFromUser, resolveOrganizationIdFromUser } from '../../common/utils/rbac.util';
import { EntityManager } from 'typeorm';

@Injectable()
export class EventsService {
    constructor(
        private readonly eventsRepository: EventsRepository,
    ) { }

    async findAll(query: any, user: User) {
        const ownerId = resolveOwnerIdFromUser(user, query.ownerId, 'events');
        const organizationId = resolveOrganizationIdFromUser(user, query.organizationId, 'events');

        const filters: EventsFilters = {
            ...query,
            ownerId,
            organizationId,
        };

        const result = await this.eventsRepository.findAllWithRelations(filters, query);

        return {
            ...result,
            data: EventsMapper.toResponseList(result.data)
        };
    }

    async findOne(id: string, user: User) {
        const ownerId = resolveOwnerIdFromUser(user, null, 'event');
        const organizationId = resolveOrganizationIdFromUser(user, null, 'event');
        const event = await this.eventsRepository.findOneWithRelations(id, ownerId, organizationId);
        if (!event) {
            throw new NotFoundException(`Event with ID ${id} not found`);
        }
        return EventsMapper.toResponse(event);
    }

    async create(createEventDto: CreateEventDto, user: User) {
        const organizationId = resolveOrganizationIdFromUser(user, null, 'events');

        const event = this.eventsRepository.create({
            cattleId: createEventDto.cattleId,
            eventTypeId: createEventDto.eventTypeId || createEventDto.type,
            date: createEventDto.date,
            description: createEventDto.description,
            details: createEventDto.details,
            organizationId,
        } as any) as unknown as EventEntity;

        await this.eventsRepository.save(event);
        return this.findOne(event.id, user);
    }

    async update(id: string, updateEventDto: UpdateEventDto, user: User) {
        const ownerId = resolveOwnerIdFromUser(user, null, 'event');
        const organizationId = resolveOrganizationIdFromUser(user, null, 'event');
        const event = await this.eventsRepository.findOneWithRelations(id, ownerId, organizationId);
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
        const ownerId = resolveOwnerIdFromUser(user, null, 'event');
        const organizationId = resolveOrganizationIdFromUser(user, null, 'event');
        const event = await this.eventsRepository.findOneWithRelations(id, ownerId, organizationId);
        if (!event) {
            throw new NotFoundException(`Event with ID ${id} not found`);
        }
        const response = EventsMapper.toResponse(event);
        await this.eventsRepository.remove(event);
        return response;
    }

    async updateCattleEvents(em: EntityManager, cattleId: string, currentEvents: EventEntity[], incomingEvents: (UpdateEventDto & { id?: string })[]) {
        if (!incomingEvents) return;
        const incomingIds = incomingEvents.filter(e => e.id).map(e => e.id);
        const toDelete = currentEvents.filter(e => !incomingIds.includes(e.id));
        if (toDelete.length > 0) await em.remove(toDelete);

        for (const eventData of incomingEvents) {
            if (eventData.id) {
                await em.update(EventEntity, eventData.id, {
                    eventTypeId: eventData.type,
                    date: eventData.date,
                    description: eventData.description,
                    details: eventData.details
                });
            } else {
                await em.insert(EventEntity, {
                    cattleId: cattleId,
                    eventTypeId: eventData.type,
                    date: eventData.date,
                    description: eventData.description,
                    details: eventData.details
                });
            }
        }
    }
}

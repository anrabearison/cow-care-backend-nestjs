import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event as EventEntity } from '../../entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { User } from '../../entities/user.entity';
import { Cattle } from '../../entities/cattle.entity';
import { EventType } from '../../entities/event-type.entity';
import { EventsRepository, EventsFilters, EventsPaginationOptions } from './events.repository';
import { EventsMapper } from './events.mapper';
import { EventsQueryDto } from './dto/events-query.dto';

@Injectable()
export class EventsService {
    private readonly logger = new Logger(EventsService.name);

    constructor(
        private readonly eventsRepository: EventsRepository,
        @InjectRepository(Cattle)
        private cattleRepository: Repository<Cattle>,
        @InjectRepository(EventType)
        private eventTypeRepository: Repository<EventType>,
    ) { }

    async findAll(query: EventsQueryDto, user: User) {
        const filters: EventsFilters = {
            ...query,
            userRole: user.role,
            userOwnerId: user.ownerId
        };

        const pagination: EventsPaginationOptions = {
            page: Number(query.page) || 1,
            perPage: Number(query.perPage) || 10,
            sort: query.sort || 'date',
            order: query.order || 'DESC'
        };

        try {
            const [rawData, total] = await this.eventsRepository.findAllWithRelations(filters, pagination);
            const data = rawData.map(event => EventsMapper.toResponse(event));

            return {
                data,
                total,
                page: Number(query.page),
                perPage: Number(query.perPage)
            };
        } catch (error) {
            this.logger.error(`[EventsService.findAll] ${error.message}`, error.stack);
            throw new Error(`[EventsService.findAll] ${error.message}`);
        }
    }

    async findOne(id: string, user: User) {
        const event = await this.eventsRepository.findOneWithRelations(id, user.role, user.ownerId);

        if (!event) {
            throw new NotFoundException(`Event with ID ${id} not found`);
        }

        return EventsMapper.toResponse(event);
    }

    async create(createEventDto: CreateEventDto, user: User) {
        const eventTypeId = createEventDto.eventTypeId || createEventDto.type;
        if (!eventTypeId) {
            throw new NotFoundException('Event Type ID is required');
        }

        const eventType = await this.eventTypeRepository.findOne({ where: { id: eventTypeId } });
        if (!eventType) {
            throw new NotFoundException(`EventType with ID ${eventTypeId} not found`);
        }

        const cattle = await this.cattleRepository.findOne({ where: { id: createEventDto.cattleId } });
        if (!cattle) {
            throw new NotFoundException(`Cattle with ID ${createEventDto.cattleId} not found`);
        }

        const event = this.eventsRepository.create({
            ...createEventDto,
            eventTypeId,
            id: crypto.randomUUID(),
        });

        try {
            await this.eventsRepository.save(event);
        } catch (error) {
            this.logger.error(`Error creating event: ${error.message}`, error.stack);
            throw new NotFoundException(`Error creating event: ${error.message}`);
        }

        return this.findOne(event.id, user);
    }

    async update(id: string, updateEventDto: any, user: User) {
        const event = await this.eventsRepository.findOneWithRelations(id, user.role, user.ownerId);
        if (!event) {
             throw new NotFoundException(`Event with ID ${id} not found`);
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
        await this.eventsRepository.remove(event);
        return EventsMapper.toResponse(event);
    }
}

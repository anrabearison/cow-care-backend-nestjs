import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../../entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { User, UserRole } from '../../entities/user.entity';
import { Cattle } from '../../entities/cattle.entity';
import { EventType } from '../../entities/event-type.entity';

@Injectable()
export class EventsService {
    constructor(
        @InjectRepository(Event)
        private eventsRepository: Repository<Event>,
        @InjectRepository(Cattle)
        private cattleRepository: Repository<Cattle>,
        @InjectRepository(EventType)
        private eventTypeRepository: Repository<EventType>,
    ) { }

    async findAll(query: any, user: User) {
        const {
            page = 1,
            per_page = 10,
            sort = 'date',
            order = 'DESC',
            cattle_id,
            cattleId,
            event_type_id,
            type,
            q,
            date,
            id,
            owner_id
        } = query;

        const skip = (page - 1) * per_page;

        const qb = this.eventsRepository.createQueryBuilder('event')
            .leftJoinAndSelect('event.cattle', 'cattle')
            .leftJoinAndSelect('event.eventType', 'eventType');

        // RBAC & Owner Filtering
        let filterOwnerId = null;
        if (user.role !== UserRole.SUPER_ADMIN) {
            if (!user.ownerId) {
                return { data: [], total: 0, page: Number(page), per_page: Number(per_page) };
            }
            filterOwnerId = user.ownerId;
        } else if (owner_id) {
            filterOwnerId = owner_id;
        }

        if (filterOwnerId) {
            // Join to filter by owner
            qb.innerJoin('cattle.herdBookEntries', 'herdBookEntries')
                .innerJoin('herdBookEntries.herdBook', 'herdBook')
                .andWhere('herdBook.ownerId = :ownerId', { ownerId: filterOwnerId });

            // Apply distinct to avoid duplicates if cattle is in multiple herd books of the same owner (unlikely but possible)
            // However, TypeORM's getManyAndCount with distinct can be tricky with pagination.
            // FastAPI uses distinct().
            qb.distinct(true);
        }

        // Filtering
        const targetCattleId = cattleId || cattle_id;
        if (targetCattleId) {
            qb.andWhere('event.cattleId = :cattleId', { cattleId: targetCattleId });
        }

        const targetTypeId = type || event_type_id;
        if (targetTypeId) {
            qb.andWhere('event.eventTypeId = :eventTypeId', { eventTypeId: targetTypeId });
        }

        if (date) {
            qb.andWhere('event.date = :date', { date });
        }

        if (q) {
            qb.andWhere('event.description ILIKE :q', { q: `%${q}%` });
        }

        if (id) {
            const ids = Array.isArray(id) ? id : [id];
            qb.andWhere('event.id IN (:...ids)', { ids });
        }

        qb.orderBy(`event.${sort}`, order as 'ASC' | 'DESC');
        qb.skip(skip).take(per_page);

        const [rawData, total] = await qb.getManyAndCount();

        // Transform data to match frontend expectations
        const data = rawData.map(event => ({
            ...event,
            type: event.eventTypeId, // Frontend expects 'type' property
        }));

        return {
            data,
            total,
            page: Number(page),
            per_page: Number(per_page)
        };
    }

    async findOne(id: string, user: User) {
        const qb = this.eventsRepository.createQueryBuilder('event')
            .leftJoinAndSelect('event.cattle', 'cattle')
            .leftJoinAndSelect('event.eventType', 'eventType')
            .where('event.id = :id', { id });

        if (user.role !== UserRole.SUPER_ADMIN) {
            if (!user.ownerId) {
                throw new NotFoundException(`Event with ID ${id} not found`);
            }
            // Join to filter by owner
            qb.innerJoin('cattle.herdBookEntries', 'herdBookEntries')
                .innerJoin('herdBookEntries.herdBook', 'herdBook')
                .andWhere('herdBook.ownerId = :ownerId', { ownerId: user.ownerId });
        }

        const event = await qb.getOne();

        if (!event) {
            throw new NotFoundException(`Event with ID ${id} not found`);
        }

        return event;
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
            throw new NotFoundException(`Error creating event: ${error.message}`);
        }

        return this.findOne(event.id, user);
    }

    async update(id: string, updateEventDto: any, user: User) {
        const event = await this.findOne(id, user);
        Object.assign(event, updateEventDto);
        await this.eventsRepository.save(event);
        return this.findOne(id, user);
    }

    async remove(id: string, user: User) {
        const event = await this.findOne(id, user);
        await this.eventsRepository.remove(event);
        return event;
    }
}

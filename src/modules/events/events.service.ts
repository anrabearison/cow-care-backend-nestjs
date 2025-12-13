import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../../entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { User } from '../../entities/user.entity';

@Injectable()
export class EventsService {
    constructor(
        @InjectRepository(Event)
        private eventsRepository: Repository<Event>,
    ) { }

    async findAll(query: any, user: User) {
        const {
            page = 1,
            per_page = 10,
            sort = 'date',
            order = 'DESC',
            cattle_id,
            event_type_id
        } = query;

        const skip = (page - 1) * per_page;

        const qb = this.eventsRepository.createQueryBuilder('event')
            .leftJoinAndSelect('event.cattle', 'cattle')
            .leftJoinAndSelect('event.eventType', 'eventType');

        if (cattle_id) {
            qb.andWhere('event.cattleId = :cattleId', { cattleId: cattle_id });
        }

        if (event_type_id) {
            qb.andWhere('event.eventTypeId = :eventTypeId', { eventTypeId: event_type_id });
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
        const event = await this.eventsRepository.findOne({
            where: { id },
            relations: ['cattle', 'eventType']
        });

        if (!event) {
            throw new NotFoundException(`Event with ID ${id} not found`);
        }

        return event;
    }

    async create(createEventDto: CreateEventDto, user: User) {
        const event = this.eventsRepository.create({
            ...createEventDto,
            id: crypto.randomUUID(),
        });

        await this.eventsRepository.save(event);
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

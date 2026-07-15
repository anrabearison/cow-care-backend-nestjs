import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEventTypeDto } from '../../../event-types/dto/create-event-type.dto';
import { UpdateEventTypeDto } from '../../../event-types/dto/update-event-type.dto';
import { EventTypesRepository } from '../../../event-types/event-types.repository';
import { EventTypesMapper } from '../../../event-types/event-types.mapper';
import * as crypto from 'crypto';

@Injectable()
export class EventTypesService {
  constructor(private readonly eventTypesRepository: EventTypesRepository) {}

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

  async create(createEventTypeDto: CreateEventTypeDto) {
    const eventType = this.eventTypesRepository.create({
      id: crypto.randomUUID(),
      ...createEventTypeDto,
    } as any) as any;

    await this.eventTypesRepository.save(eventType);
    return this.findOne(eventType.id);
  }

  async update(id: string, updateEventTypeDto: UpdateEventTypeDto) {
    const eventType = await this.eventTypesRepository.findOne({ where: { id } });
    if (!eventType) {
      throw new NotFoundException(`EventType with ID ${id} not found`);
    }

    Object.assign(eventType, updateEventTypeDto);
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

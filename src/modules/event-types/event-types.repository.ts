import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { EventType } from '../../entities/event-type.entity';

@Injectable()
export class EventTypesRepository extends Repository<EventType> {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) {
        super(EventType, dataSource.createEntityManager());
    }

    async findAllWithRelations(): Promise<EventType[]> {
        return this.find();
    }

    async findOneWithRelations(id: string): Promise<EventType | null> {
        return this.findOne({ where: { id } });
    }
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { EventsRepository } from './events.repository';
import { Event as EventEntity } from './entities/event.entity';
import { Cattle } from '../cattle/entities/cattle.entity';
import { EventType } from '../event-types/entities/event-type.entity';
import { Organization } from '../organizations/entities/organization.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([EventEntity, Cattle, EventType, Organization]),
    ],
    controllers: [EventsController],
    providers: [EventsService, EventsRepository],
    exports: [EventsService],
})
export class EventsModule { }

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { Event as EventEntity } from '../../entities/event.entity';
import { Cattle } from '../../entities/cattle.entity';
import { EventType } from '../../entities/event-type.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([EventEntity, Cattle, EventType]),
    ],
    controllers: [EventsController],
    providers: [EventsService],
    exports: [EventsService],
})
export class EventsModule { }

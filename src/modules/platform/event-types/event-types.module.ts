import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventTypesService } from './event-types.service';
import { EventTypesController } from './event-types.controller';
import { EventType } from './entities/event-type.entity';
import { EventTypesRepository } from './event-types.repository';

@Module({
    imports: [TypeOrmModule.forFeature([EventType])],
    controllers: [EventTypesController],
    providers: [EventTypesService, EventTypesRepository],
    exports: [EventTypesService],
})
export class EventTypesModule { }

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventTypesService } from './event-types.service';
import { EventTypesController } from './event-types.controller';
import { EventType } from '../../entities/event-type.entity';

@Module({
    imports: [TypeOrmModule.forFeature([EventType])],
    controllers: [EventTypesController],
    providers: [EventTypesService],
    exports: [EventTypesService],
})
export class EventTypesModule { }

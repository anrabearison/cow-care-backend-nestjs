import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CattleService } from './cattle.service';
import { CattleBirthService } from './cattle-birth.service';
import { CattleController } from './cattle.controller';
import { CattleRepository } from './cattle.repository';
import { Cattle } from './entities/cattle.entity';
import { CattlePhoto } from './entities/cattle-photo.entity';
import { HerdBook } from '../herd-books/entities/herd-book.entity';
import { HerdBookCattle } from '../herd-book-cattle/entities/herd-book-cattle.entity';
import { Character } from '../../platform/characters/entities/character.entity';
import { Event as EventEntity } from '../events/entities/event.entity';
import { Treatment } from '../treatments/entities/treatment.entity';
import { EventType } from '../../platform/event-types/entities/event-type.entity';
import { EventsModule } from '../events/events.module';
import { TreatmentsModule } from '../treatments/treatments.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Cattle, CattlePhoto, HerdBook, HerdBookCattle, Character, EventEntity, Treatment, EventType]),
        EventsModule,
        TreatmentsModule,
    ],
    controllers: [CattleController],
    providers: [CattleService, CattleBirthService, CattleRepository],
    exports: [CattleService],
})
export class CattleModule { }

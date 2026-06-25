import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CattleService } from './cattle.service';
import { CattleController } from './cattle.controller';
import { CattleRepository } from './cattle.repository';
import { Cattle } from './entities/cattle.entity';
import { HerdBook } from '../herd-books/entities/herd-book.entity';
import { HerdBookCattle } from '../herd-book-cattle/entities/herd-book-cattle.entity';
import { Character } from '../characters/entities/character.entity';
import { Event as EventEntity } from '../events/entities/event.entity';
import { Treatment } from '../treatments/entities/treatment.entity';
import { EventType } from '../event-types/entities/event-type.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Cattle, HerdBook, HerdBookCattle, Character, EventEntity, Treatment, EventType]),
    ],
    controllers: [CattleController],
    providers: [CattleService, CattleRepository],
    exports: [CattleService],
})
export class CattleModule { }

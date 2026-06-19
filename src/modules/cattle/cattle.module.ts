import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CattleService } from './cattle.service';
import { CattleController } from './cattle.controller';
import { CattleRepository } from './cattle.repository';
import { Cattle } from '../../entities/cattle.entity';
import { HerdBook } from '../../entities/herd-book.entity';
import { HerdBookCattle } from '../../entities/herd-book-cattle.entity';
import { Character } from '../../entities/character.entity';
import { Event as EventEntity } from '../../entities/event.entity';
import { Treatment } from '../../entities/treatment.entity';
import { EventType } from '../../entities/event-type.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Cattle, HerdBook, HerdBookCattle, Character, EventEntity, Treatment, EventType]),
    ],
    controllers: [CattleController],
    providers: [CattleService, CattleRepository],
    exports: [CattleService],
})
export class CattleModule { }

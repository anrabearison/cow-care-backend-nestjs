import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CattleService } from './cattle.service';
import { CattleController } from './cattle.controller';
import { Cattle } from '../../entities/cattle.entity';
import { HerdBook } from '../../entities/herd-book.entity';
import { HerdBookCattle } from '../../entities/herd-book-cattle.entity';
import { Character } from '../../entities/character.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Cattle, HerdBook, HerdBookCattle, Character]),
    ],
    controllers: [CattleController],
    providers: [CattleService],
    exports: [CattleService],
})
export class CattleModule { }

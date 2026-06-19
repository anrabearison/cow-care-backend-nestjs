import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CharactersService } from './characters.service';
import { CharactersController } from './characters.controller';
import { Character } from '../../entities/character.entity';
import { CharactersRepository } from './characters.repository';

@Module({
    imports: [TypeOrmModule.forFeature([Character])],
    controllers: [CharactersController],
    providers: [CharactersService, CharactersRepository],
    exports: [CharactersService],
})
export class CharactersModule { }

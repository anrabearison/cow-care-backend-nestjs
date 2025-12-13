import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Character } from '../../entities/character.entity';
import { CreateCharacterDto, UpdateCharacterDto } from './dto/create-character.dto';

@Injectable()
export class CharactersService {
    constructor(
        @InjectRepository(Character)
        private charactersRepository: Repository<Character>,
    ) { }

    async findAll(): Promise<Character[]> {
        return this.charactersRepository.find();
    }

    async findOne(id: string): Promise<Character> {
        const character = await this.charactersRepository.findOne({ where: { id } });
        if (!character) {
            throw new NotFoundException(`Character with ID ${id} not found`);
        }
        return character;
    }

    async create(createCharacterDto: CreateCharacterDto): Promise<Character> {
        const character = this.charactersRepository.create(createCharacterDto);
        return this.charactersRepository.save(character);
    }

    async update(id: string, updateCharacterDto: UpdateCharacterDto): Promise<Character> {
        const character = await this.findOne(id);
        Object.assign(character, updateCharacterDto);
        return this.charactersRepository.save(character);
    }

    async remove(id: string): Promise<void> {
        const character = await this.findOne(id);
        await this.charactersRepository.remove(character);
    }
}

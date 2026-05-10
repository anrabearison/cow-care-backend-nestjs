import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCharacterDto, UpdateCharacterDto } from './dto/create-character.dto';
import { CharactersRepository } from './characters.repository';

@Injectable()
export class CharactersService {
    constructor(
        private readonly charactersRepository: CharactersRepository,
    ) { }

    async findAll() {
        return this.charactersRepository.findAllWithRelations();
    }

    async findOne(id: string) {
        const character = await this.charactersRepository.findOneWithRelations(id);
        if (!character) {
            throw new NotFoundException(`Character with ID ${id} not found`);
        }
        return character;
    }

    async create(createCharacterDto: CreateCharacterDto) {
        const character = this.charactersRepository.create(createCharacterDto);
        return this.charactersRepository.save(character);
    }

    async update(id: string, updateCharacterDto: UpdateCharacterDto) {
        const character = await this.charactersRepository.findOne({ where: { id } });
        if (!character) {
            throw new NotFoundException(`Character with ID ${id} not found`);
        }
        Object.assign(character, updateCharacterDto);
        return this.charactersRepository.save(character);
    }

    async remove(id: string) {
        const character = await this.charactersRepository.findOne({ where: { id } });
        if (!character) {
            throw new NotFoundException(`Character with ID ${id} not found`);
        }
        await this.charactersRepository.remove(character);
        return character;
    }
}

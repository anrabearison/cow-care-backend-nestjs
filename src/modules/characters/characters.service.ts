import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCharacterDto, UpdateCharacterDto } from './dto/create-character.dto';
import { CharactersRepository } from './characters.repository';
import { transformKeysToSnakeCase } from '../../common/utils/case-transform.util';

@Injectable()
export class CharactersService {
    constructor(
        private readonly charactersRepository: CharactersRepository,
    ) { }

    async findAll() {
        const rawData = await this.charactersRepository.findAllWithRelations();
        return transformKeysToSnakeCase(rawData);
    }

    async findOne(id: string) {
        const character = await this.charactersRepository.findOneWithRelations(id);
        if (!character) {
            throw new NotFoundException(`Character with ID ${id} not found`);
        }
        return transformKeysToSnakeCase(character);
    }

    async create(createCharacterDto: CreateCharacterDto) {
        const character = this.charactersRepository.create(createCharacterDto);
        const saved = await this.charactersRepository.save(character);
        return transformKeysToSnakeCase(saved);
    }

    async update(id: string, updateCharacterDto: UpdateCharacterDto) {
        const character = await this.charactersRepository.findOne({ where: { id } });
        if (!character) {
            throw new NotFoundException(`Character with ID ${id} not found`);
        }
        Object.assign(character, updateCharacterDto);
        const saved = await this.charactersRepository.save(character);
        return transformKeysToSnakeCase(saved);
    }

    async remove(id: string) {
        const character = await this.charactersRepository.findOne({ where: { id } });
        if (!character) {
            throw new NotFoundException(`Character with ID ${id} not found`);
        }
        await this.charactersRepository.remove(character);
        return transformKeysToSnakeCase(character);
    }
}

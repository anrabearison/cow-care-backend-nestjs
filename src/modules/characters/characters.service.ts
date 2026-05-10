import { Injectable, NotFoundException } from '@nestjs/common';
import { CharactersRepository } from './characters.repository';
import { CharactersMapper } from './characters.mapper';
import { Character } from '../../entities/character.entity';
import * as crypto from 'crypto';

@Injectable()
export class CharactersService {
    constructor(
        private readonly charactersRepository: CharactersRepository,
    ) { }

    async findAll(query: any) {
        const result = await this.charactersRepository.findAllWithRelations(query, query);

        return {
            ...result,
            data: CharactersMapper.toResponseList(result.data)
        };
    }

    async findOne(id: string) {
        const character = await this.charactersRepository.findOne({ where: { id } });
        if (!character) {
            throw new NotFoundException(`Character with ID ${id} not found`);
        }
        return CharactersMapper.toResponse(character);
    }

    async create(createDto: any) {
        const character = this.charactersRepository.create({
            id: crypto.randomUUID(),
            ...createDto,
        } as any) as unknown as Character;

        await this.charactersRepository.save(character);
        return this.findOne(character.id);
    }

    async update(id: string, updateDto: any) {
        const character = await this.charactersRepository.findOne({ where: { id } });
        if (!character) {
            throw new NotFoundException(`Character with ID ${id} not found`);
        }

        Object.assign(character, updateDto);
        await this.charactersRepository.save(character);
        return this.findOne(id);
    }

    async remove(id: string) {
        const character = await this.charactersRepository.findOne({ where: { id } });
        if (!character) {
            throw new NotFoundException(`Character with ID ${id} not found`);
        }
        const response = CharactersMapper.toResponse(character);
        await this.charactersRepository.remove(character);
        return response;
    }
}

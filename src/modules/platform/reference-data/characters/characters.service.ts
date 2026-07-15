import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCharacterDto } from '../../../characters/dto/create-character.dto';
import { UpdateCharacterDto } from '../../../characters/dto/update-character.dto';
import { CharactersRepository } from '../../../characters/characters.repository';
import { CharactersMapper } from '../../../characters/characters.mapper';
import * as crypto from 'crypto';

@Injectable()
export class CharactersService {
  constructor(private readonly charactersRepository: CharactersRepository) {}

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

  async create(createCharacterDto: CreateCharacterDto) {
    const character = this.charactersRepository.create({
      id: crypto.randomUUID(),
      ...createCharacterDto,
    } as any) as any;

    await this.charactersRepository.save(character);
    return this.findOne(character.id);
  }

  async update(id: string, updateCharacterDto: UpdateCharacterDto) {
    const character = await this.charactersRepository.findOne({ where: { id } });
    if (!character) {
      throw new NotFoundException(`Character with ID ${id} not found`);
    }

    Object.assign(character, updateCharacterDto);
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

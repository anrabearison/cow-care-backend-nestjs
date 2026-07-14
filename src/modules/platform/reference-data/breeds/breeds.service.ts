import { Injectable, NotFoundException } from '@nestjs/common';
import { BreedsRepository } from './breeds.repository';
import { CreateBreedDto } from './dto/create-breed.dto';
import { UpdateBreedDto } from './dto/update-breed.dto';

@Injectable()
export class BreedsService {
  constructor(private readonly breedsRepository: BreedsRepository) {}

  async findAll(query: any = {}) {
    return this.breedsRepository.findAll(query);
  }

  async findOne(id: string) {
    const breed = await this.breedsRepository.findOne(id);
    if (!breed) {
      throw new NotFoundException('Breed not found');
    }
    return breed;
  }

  async create(createBreedDto: CreateBreedDto) {
    return this.breedsRepository.create(createBreedDto);
  }

  async update(id: string, updateBreedDto: UpdateBreedDto) {
    await this.findOne(id);
    return this.breedsRepository.update(id, updateBreedDto);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.breedsRepository.remove(id);
  }
}

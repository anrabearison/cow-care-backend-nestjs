import { Injectable, NotFoundException } from '@nestjs/common';
import { DiseasesRepository } from './diseases.repository';
import { CreateDiseaseDto } from './dto/create-disease.dto';
import { UpdateDiseaseDto } from './dto/update-disease.dto';

@Injectable()
export class DiseasesService {
  constructor(private readonly diseasesRepository: DiseasesRepository) {}

  async findAll(query: any = {}) {
    return this.diseasesRepository.findAll(query);
  }

  async findOne(id: string) {
    const disease = await this.diseasesRepository.findOne(id);
    if (!disease) {
      throw new NotFoundException('Disease not found');
    }
    return disease;
  }

  async create(createDiseaseDto: CreateDiseaseDto) {
    return this.diseasesRepository.create(createDiseaseDto);
  }

  async update(id: string, updateDiseaseDto: UpdateDiseaseDto) {
    await this.findOne(id);
    return this.diseasesRepository.update(id, updateDiseaseDto);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.diseasesRepository.remove(id);
  }
}

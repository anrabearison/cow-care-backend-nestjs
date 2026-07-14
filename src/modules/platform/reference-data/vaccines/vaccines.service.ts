import { Injectable, NotFoundException } from '@nestjs/common';
import { VaccinesRepository } from './vaccines.repository';
import { CreateVaccineDto } from './dto/create-vaccine.dto';
import { UpdateVaccineDto } from './dto/update-vaccine.dto';

@Injectable()
export class VaccinesService {
  constructor(private readonly vaccinesRepository: VaccinesRepository) {}

  async findAll(query: any = {}) {
    return this.vaccinesRepository.findAll(query);
  }

  async findOne(id: string) {
    const vaccine = await this.vaccinesRepository.findOne(id);
    if (!vaccine) {
      throw new NotFoundException('Vaccine not found');
    }
    return vaccine;
  }

  async create(createVaccineDto: CreateVaccineDto) {
    return this.vaccinesRepository.create(createVaccineDto);
  }

  async update(id: string, updateVaccineDto: UpdateVaccineDto) {
    await this.findOne(id);
    return this.vaccinesRepository.update(id, updateVaccineDto);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.vaccinesRepository.remove(id);
  }
}

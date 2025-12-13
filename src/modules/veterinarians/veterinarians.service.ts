import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Veterinarian } from '../../entities/veterinarian.entity';
import { CreateVeterinarianDto, UpdateVeterinarianDto } from './dto/create-veterinarian.dto';

@Injectable()
export class VeterinariansService {
    constructor(
        @InjectRepository(Veterinarian)
        private veterinariansRepository: Repository<Veterinarian>,
    ) { }

    async findAll(): Promise<Veterinarian[]> {
        return this.veterinariansRepository.find();
    }

    async findOne(id: string): Promise<Veterinarian> {
        const veterinarian = await this.veterinariansRepository.findOne({ where: { id } });
        if (!veterinarian) {
            throw new NotFoundException(`Veterinarian with ID ${id} not found`);
        }
        return veterinarian;
    }

    async create(createVeterinarianDto: CreateVeterinarianDto): Promise<Veterinarian> {
        const veterinarian = this.veterinariansRepository.create(createVeterinarianDto);
        return this.veterinariansRepository.save(veterinarian);
    }

    async update(id: string, updateVeterinarianDto: UpdateVeterinarianDto): Promise<Veterinarian> {
        const veterinarian = await this.findOne(id);
        Object.assign(veterinarian, updateVeterinarianDto);
        return this.veterinariansRepository.save(veterinarian);
    }

    async remove(id: string): Promise<void> {
        const veterinarian = await this.findOne(id);
        await this.veterinariansRepository.remove(veterinarian);
    }
}

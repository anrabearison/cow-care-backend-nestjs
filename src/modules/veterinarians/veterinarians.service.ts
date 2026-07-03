import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateVeterinarianDto } from './dto/create-veterinarian.dto';
import { VeterinariansRepository, VeterinariansFilters } from './veterinarians.repository';
import { VeterinariansMapper } from './veterinarians.mapper';
import { Veterinarian } from './entities/veterinarian.entity';
import * as crypto from 'crypto';

@Injectable()
export class VeterinariansService {
    constructor(
        private readonly veterinariansRepository: VeterinariansRepository,
    ) { }

    async findAll(query: any) {
        const filters: VeterinariansFilters = { ...query };
        const result = await this.veterinariansRepository.findAllWithRelations(filters, query);

        return {
            ...result,
            data: VeterinariansMapper.toResponseList(result.data)
        };
    }

    async findOne(id: string) {
        const vet = await this.veterinariansRepository.findOne({ where: { id } });
        if (!vet) {
            throw new NotFoundException(`Veterinarian with ID ${id} not found`);
        }
        return VeterinariansMapper.toResponse(vet);
    }

    async create(createVeterinarianDto: CreateVeterinarianDto) {
        const vet = this.veterinariansRepository.create({
            id: crypto.randomUUID(),
            ...createVeterinarianDto,
        } as any) as unknown as Veterinarian;

        await this.veterinariansRepository.save(vet);
        return this.findOne(vet.id);
    }

    async update(id: string, updateVeterinarianDto: any) {
        const vet = await this.veterinariansRepository.findOne({ where: { id } });
        if (!vet) {
            throw new NotFoundException(`Veterinarian with ID ${id} not found`);
        }

        Object.assign(vet, updateVeterinarianDto);
        await this.veterinariansRepository.save(vet);
        return this.findOne(id);
    }

    async remove(id: string) {
        const vet = await this.veterinariansRepository.findOne({ where: { id } });
        if (!vet) {
            throw new NotFoundException(`Veterinarian with ID ${id} not found`);
        }
        const response = VeterinariansMapper.toResponse(vet);
        await this.veterinariansRepository.remove(vet);
        return response;
    }
}

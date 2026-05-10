import { Injectable, NotFoundException } from '@nestjs/common';
import { Veterinarian } from '../../entities/veterinarian.entity';
import { CreateVeterinarianDto, UpdateVeterinarianDto } from './dto/create-veterinarian.dto';
import { VeterinariansRepository, VeterinariansFilters, VeterinariansPaginationOptions } from './veterinarians.repository';
import { VeterinariansMapper } from './veterinarians.mapper';
import * as crypto from 'crypto';

@Injectable()
export class VeterinariansService {
    constructor(
        private readonly veterinariansRepository: VeterinariansRepository,
    ) { }

    async findAll(query: any) {
        const filters: VeterinariansFilters = {
            ...query
        };

        const pagination: VeterinariansPaginationOptions = {
            page: Number(query.page) || 1,
            perPage: Number(query.perPage) || 10,
            sort: query.sort || 'id',
            order: (query.order as 'ASC' | 'DESC') || 'ASC'
        };

        const [rawData, total] = await this.veterinariansRepository.findAllWithRelations(filters, pagination);

        return {
            data: VeterinariansMapper.toResponseList(rawData),
            total,
            page: pagination.page,
            perPage: pagination.perPage
        };
    }

    async findOne(id: string): Promise<Veterinarian> {
        const veterinarian = await this.veterinariansRepository.findOneWithRelations(id);
        if (!veterinarian) {
            throw new NotFoundException(`Veterinarian with ID ${id} not found`);
        }
        return veterinarian;
    }

    async findOneFormatted(id: string) {
        const veterinarian = await this.findOne(id);
        return VeterinariansMapper.toResponse(veterinarian);
    }

    async create(createVeterinarianDto: CreateVeterinarianDto) {
        const veterinarian = this.veterinariansRepository.create({
            ...createVeterinarianDto,
            id: (createVeterinarianDto as any).id || crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        const saved = await this.veterinariansRepository.save(veterinarian);
        return VeterinariansMapper.toResponse(saved as Veterinarian);
    }

    async update(id: string, updateVeterinarianDto: UpdateVeterinarianDto) {
        const veterinarian = await this.findOne(id);
        Object.assign(veterinarian, updateVeterinarianDto);
        const saved = await this.veterinariansRepository.save(veterinarian);
        return VeterinariansMapper.toResponse(saved as Veterinarian);
    }

    async remove(id: string) {
        const veterinarian = await this.findOne(id);
        await this.veterinariansRepository.remove(veterinarian);
    }
}

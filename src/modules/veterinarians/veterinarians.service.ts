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
            per_page: Number(query.per_page) || 10,
            sort: query.sort || 'id',
            order: (query.order as 'ASC' | 'DESC') || 'ASC'
        };

        const [rawData, total] = await this.veterinariansRepository.findAllWithRelations(filters, pagination);

        return {
            data: VeterinariansMapper.toResponseList(rawData),
            total,
            page: pagination.page,
            per_page: pagination.per_page
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
        const { nom, telephone, adresse, name, phone, address, id, ...rest } = createVeterinarianDto as any;
        const veterinarian = this.veterinariansRepository.create({
            ...rest,
            id: id || crypto.randomUUID(),
            name: name || nom,
            phone: phone || telephone,
            address: address || adresse,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        const saved = await this.veterinariansRepository.save(veterinarian);
        return VeterinariansMapper.toResponse(saved);
    }

    async update(id: string, updateVeterinarianDto: UpdateVeterinarianDto) {
        const veterinarian = await this.findOne(id);
        const { nom, telephone, adresse, name, phone, address, ...rest } = updateVeterinarianDto as any;
        Object.assign(veterinarian, {
            ...rest,
            ...(name || nom ? { name: name || nom } : {}),
            ...(phone || telephone ? { phone: phone || telephone } : {}),
            ...(address || adresse ? { address: address || adresse } : {}),
        });
        const saved = await this.veterinariansRepository.save(veterinarian);
        return VeterinariansMapper.toResponse(saved);
    }

    async remove(id: string) {
        const veterinarian = await this.findOne(id);
        await this.veterinariansRepository.remove(veterinarian);
    }
}

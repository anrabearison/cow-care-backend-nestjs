import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateVeterinarianDto } from './dto/create-veterinarian.dto';
import { VeterinariansRepository, VeterinariansFilters } from './veterinarians.repository';
import { VeterinariansMapper } from './veterinarians.mapper';
import { Veterinarian } from './entities/veterinarian.entity';
import { User } from '../users/entities/user.entity';
import { resolveOrganizationIdFromUser } from '../../common/utils/rbac.util';
import * as crypto from 'crypto';

@Injectable()
export class VeterinariansService {
    constructor(
        private readonly veterinariansRepository: VeterinariansRepository,
    ) { }

    async findAll(query: any, user: User) {
        const organizationId = resolveOrganizationIdFromUser(user, query.organizationId, 'veterinarians');

        const filters: VeterinariansFilters = { 
            ...query,
            organizationId,
        };
        const result = await this.veterinariansRepository.findAllWithRelations(filters, query);

        return {
            ...result,
            data: VeterinariansMapper.toResponseList(result.data)
        };
    }

    async findOne(id: string, user: User) {
        const organizationId = resolveOrganizationIdFromUser(user, null, 'veterinarians');
        const vet = await this.veterinariansRepository.findOne({ 
            where: { id },
        });
        
        if (!vet) {
            throw new NotFoundException(`Veterinarian with ID ${id} not found`);
        }

        // Check organization access
        if (organizationId && vet.organizationId && vet.organizationId !== organizationId) {
            throw new NotFoundException(`Veterinarian with ID ${id} not found`);
        }

        return VeterinariansMapper.toResponse(vet);
    }

    async create(createVeterinarianDto: CreateVeterinarianDto, user: User) {
        const organizationId = resolveOrganizationIdFromUser(user, null, 'veterinarians');

        const vet = this.veterinariansRepository.create({
            id: crypto.randomUUID(),
            organizationId,
            ...createVeterinarianDto,
        } as any) as unknown as Veterinarian;

        await this.veterinariansRepository.save(vet);
        return this.findOne(vet.id, user);
    }

    async update(id: string, updateVeterinarianDto: any, user: User) {
        const organizationId = resolveOrganizationIdFromUser(user, null, 'veterinarians');
        const vet = await this.veterinariansRepository.findOne({ where: { id } });
        if (!vet) {
            throw new NotFoundException(`Veterinarian with ID ${id} not found`);
        }

        // Check organization access
        if (organizationId && vet.organizationId && vet.organizationId !== organizationId) {
            throw new NotFoundException(`Veterinarian with ID ${id} not found`);
        }

        Object.assign(vet, updateVeterinarianDto);
        await this.veterinariansRepository.save(vet);
        return this.findOne(id, user);
    }

    async remove(id: string, user: User) {
        const organizationId = resolveOrganizationIdFromUser(user, null, 'veterinarians');
        const vet = await this.veterinariansRepository.findOne({ where: { id } });
        if (!vet) {
            throw new NotFoundException(`Veterinarian with ID ${id} not found`);
        }

        // Check organization access
        if (organizationId && vet.organizationId && vet.organizationId !== organizationId) {
            throw new NotFoundException(`Veterinarian with ID ${id} not found`);
        }

        const response = VeterinariansMapper.toResponse(vet);
        await this.veterinariansRepository.remove(vet);
        return response;
    }
}

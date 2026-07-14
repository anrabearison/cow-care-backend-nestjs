import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { Organization } from './entities/organization.entity';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationsRepository } from './organizations.repository';
import * as crypto from 'crypto';

// Error messages constants
const ERROR_MESSAGES = {
  ORGANIZATION_NOT_FOUND: (id: string) => `Organization with ID ${id} not found`,
  CODE_ALREADY_EXISTS: 'Organization code already exists',
  CANNOT_DELETE_PHYSICAL: 'Physical deletion is not allowed. Use soft delete by setting isActive to false.',
} as const;

@Injectable()
export class OrganizationsService {
    constructor(
        private readonly organizationsRepository: OrganizationsRepository,
    ) { }

    async findAll(query: any) {
        const filters = {
            ...query,
        };

        const result = await this.organizationsRepository.findAllWithRelations(filters, query);

        return {
            ...result,
            data: result.data.map(org => this.toResponse(org))
        };
    }

    async findOne(id: string) {
        const organization = await this.organizationsRepository.findOne({ 
            where: { id },
            relations: ['users']
        });

        if (!organization) {
            throw new NotFoundException(ERROR_MESSAGES.ORGANIZATION_NOT_FOUND(id));
        }

        return this.toResponse(organization);
    }

    async create(createOrganizationDto: CreateOrganizationDto) {
        // Check if code already exists
        const existingOrg = await this.organizationsRepository.findByCode(createOrganizationDto.code);
        if (existingOrg) {
            throw new ConflictException(ERROR_MESSAGES.CODE_ALREADY_EXISTS);
        }

        const newOrganization = this.organizationsRepository.create({
            ...createOrganizationDto,
            id: crypto.randomUUID(),
            isActive: createOrganizationDto.isActive !== undefined ? createOrganizationDto.isActive : true,
        } as any) as unknown as Organization;

        await this.organizationsRepository.save(newOrganization);

        return this.toResponse(newOrganization);
    }

    async update(id: string, updateOrganizationDto: UpdateOrganizationDto) {
        const organization = await this.organizationsRepository.findOne({ where: { id } });
        if (!organization) {
            throw new NotFoundException(ERROR_MESSAGES.ORGANIZATION_NOT_FOUND(id));
        }

        // Check if code is being changed and if it already exists
        if (updateOrganizationDto.code && updateOrganizationDto.code !== organization.code) {
            const existingOrg = await this.organizationsRepository.findByCode(updateOrganizationDto.code);
            if (existingOrg) {
                throw new ConflictException(ERROR_MESSAGES.CODE_ALREADY_EXISTS);
            }
        }

        // Apply updates safely
        const allowedUpdates = ['name', 'code', 'description', 'isActive'];
        allowedUpdates.forEach(field => {
            if (updateOrganizationDto[field as keyof UpdateOrganizationDto] !== undefined) {
                (organization as any)[field] = updateOrganizationDto[field as keyof UpdateOrganizationDto];
            }
        });

        await this.organizationsRepository.save(organization);
        return this.findOne(id);
    }

    async remove(id: string) {
        const organization = await this.organizationsRepository.findOne({ where: { id } });
        if (!organization) {
            throw new NotFoundException(ERROR_MESSAGES.ORGANIZATION_NOT_FOUND(id));
        }

        // Soft delete - deactivate organization instead of deleting
        organization.isActive = false;
        await this.organizationsRepository.save(organization);
        
        return this.toResponse(organization);
    }

    async activate(id: string) {
        const organization = await this.organizationsRepository.findOne({ where: { id } });
        if (!organization) {
            throw new NotFoundException(ERROR_MESSAGES.ORGANIZATION_NOT_FOUND(id));
        }

        organization.isActive = true;
        await this.organizationsRepository.save(organization);
        
        return this.toResponse(organization);
    }

    async deactivate(id: string) {
        const organization = await this.organizationsRepository.findOne({ where: { id } });
        if (!organization) {
            throw new NotFoundException(ERROR_MESSAGES.ORGANIZATION_NOT_FOUND(id));
        }

        organization.isActive = false;
        await this.organizationsRepository.save(organization);
        
        return this.toResponse(organization);
    }

    private toResponse(organization: Organization) {
        const { users, ...response } = organization;
        return response;
    }
}

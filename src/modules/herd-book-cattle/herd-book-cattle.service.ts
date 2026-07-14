import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { HerdBookCattleRepository, HerdBookCattleFilters } from './herd-book-cattle.repository';
import { HerdBookCattleMapper } from './herd-book-cattle.mapper';
import { HerdBookCattle } from './entities/herd-book-cattle.entity';
import { CattleService } from '../cattle/cattle.service';
import { resolveOrganizationIdFromUser } from '../../common/utils/rbac.util';

@Injectable()
export class HerdBookCattleService {
    constructor(
        private readonly herdBookCattleRepository: HerdBookCattleRepository,
        private readonly cattleService: CattleService,
    ) { }

    async findAll(query: any, user: User) {
        const organizationId = resolveOrganizationIdFromUser(user, query.organizationId, 'herd book cattle');

        const filters: HerdBookCattleFilters = {
            ...query,
            userRole: user.role,
            userOwnerId: user.ownerId,
            organizationId,
        };

        const result = await this.herdBookCattleRepository.findAllWithRelations(filters, query);

        return {
            ...result,
            data: HerdBookCattleMapper.toResponseList(result.data)
        };
    }

    async findOne(id: string, user: User) {
        const organizationId = resolveOrganizationIdFromUser(user, null, 'herd book cattle');
        const hbc = await this.herdBookCattleRepository.findOne({ 
            where: { id },
            relations: ['cattle', 'herdBook', 'category', 'status']
        });

        if (!hbc) {
            throw new NotFoundException(`HerdBookCattle entry with ID ${id} not found`);
        }

        // Check organization access via herdBook
        if (organizationId && hbc.herdBook && hbc.herdBook.organizationId && hbc.herdBook.organizationId !== organizationId) {
            throw new NotFoundException(`HerdBookCattle entry with ID ${id} not found`);
        }

        return HerdBookCattleMapper.toResponse(hbc);
    }

    async create(createDto: any, user: User) {
        const organizationId = resolveOrganizationIdFromUser(user, null, 'herd book cattle');
        const { cattle, cattleId, ...herdBookCattleData } = createDto;

        let finalCattleId: string;

        if (cattleId) {
            // Cas 1: Utiliser un cattle existant
            finalCattleId = cattleId;
        } else if (cattle) {
            // Cas 2: Créer un nouveau cattle
            const createdCattle = await this.cattleService.create({
                ...cattle,
                category: herdBookCattleData.categoryId,
            }, user);
            finalCattleId = createdCattle.id;
        } else {
            throw new Error('Either cattleId or cattle must be provided');
        }

        const hbc = this.herdBookCattleRepository.create({
            id: crypto.randomUUID(),
            ...herdBookCattleData,
            cattleId: finalCattleId,
        } as any) as unknown as HerdBookCattle;

        await this.herdBookCattleRepository.save(hbc);
        return this.findOne(hbc.id, user);
    }

    async update(id: string, updateDto: any, user: User) {
        const organizationId = resolveOrganizationIdFromUser(user, null, 'herd book cattle');
        const hbc = await this.herdBookCattleRepository.findOne({ where: { id } });
        if (!hbc) {
            throw new NotFoundException(`HerdBookCattle entry with ID ${id} not found`);
        }

        // Check organization access via herdBook
        if (organizationId && hbc.herdBook && hbc.herdBook.organizationId && hbc.herdBook.organizationId !== organizationId) {
            throw new NotFoundException(`HerdBookCattle entry with ID ${id} not found`);
        }

        Object.assign(hbc, updateDto);
        await this.herdBookCattleRepository.save(hbc);
        return this.findOne(id, user);
    }

    async remove(id: string, user: User) {
        const organizationId = resolveOrganizationIdFromUser(user, null, 'herd book cattle');
        const hbc = await this.herdBookCattleRepository.findOne({ 
            where: { id },
            relations: ['herdBook']
        });
        if (!hbc) {
            throw new NotFoundException(`HerdBookCattle entry with ID ${id} not found`);
        }

        // Check organization access via herdBook
        if (organizationId && hbc.herdBook && hbc.herdBook.organizationId && hbc.herdBook.organizationId !== organizationId) {
            throw new NotFoundException(`HerdBookCattle entry with ID ${id} not found`);
        }

        const response = HerdBookCattleMapper.toResponse(hbc);
        await this.herdBookCattleRepository.remove(hbc);
        return response;
    }

    async findByHerdBook(herdBookId: string, query: any, user: User) {
        const filters: HerdBookCattleFilters = {
            ...query,
            herdBookId,
            userRole: user.role,
            userOwnerId: user.ownerId
        };

        const result = await this.herdBookCattleRepository.findAllWithRelations(filters, query);

        return {
            ...result,
            data: HerdBookCattleMapper.toResponseList(result.data)
        };
    }
}

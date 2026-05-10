import { Injectable, NotFoundException } from '@nestjs/common';
import { Owner } from '../../entities/owner.entity';
import { UserRole } from '../../entities/user.entity';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { OwnersRepository, OwnersFilters, OwnersPaginationOptions } from './owners.repository';
import * as crypto from 'crypto';

@Injectable()
export class OwnersService {
    constructor(
        private readonly ownersRepository: OwnersRepository,
    ) { }

    async findAll(query: any, user?: any) {
        const filters: OwnersFilters = {
            ...query,
            currentUserRole: user?.role,
            currentUserOwnerId: user?.ownerId,
        };

        const pagination: OwnersPaginationOptions = {
            page: Number(query.page) || 1,
            perPage: Number(query.perPage) || 10,
            sort: query.sort || 'name',
            order: query.order || 'ASC'
        };

        const [data, total] = await this.ownersRepository.findAllWithRelations(filters, pagination);

        return {
            data,
            total,
            page: pagination.page,
            perPage: pagination.perPage
        };
    }

    async findOne(id: string, user?: any) {
        const owner = await this.ownersRepository.findOneWithRelations(id, user?.role, user?.ownerId);
        if (!owner) {
            throw new NotFoundException(`Owner with ID ${id} not found`);
        }
        return owner;
    }

    async create(createOwnerDto: CreateOwnerDto) {
        const owner = this.ownersRepository.create({
            ...createOwnerDto,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await this.ownersRepository.save(owner);
        return owner;
    }

    async update(id: string, updateOwnerDto: any, user?: any) {
        const owner = await this.findOne(id, user);

        Object.assign(owner, updateOwnerDto);
        await this.ownersRepository.save(owner);
        return owner;
    }

    async remove(id: string, user?: any) {
        const owner = await this.findOne(id, user);
        await this.ownersRepository.remove(owner);
        return owner;
    }
}

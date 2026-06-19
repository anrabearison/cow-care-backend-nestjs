import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { OwnersRepository, OwnersFilters } from './owners.repository';
import { OwnersMapper } from './owners.mapper';
import { Owner } from '../../entities/owner.entity';
import * as crypto from 'crypto';

@Injectable()
export class OwnersService {
    constructor(
        private readonly ownersRepository: OwnersRepository,
    ) { }

    async findAll(query: any) {
        const filters: OwnersFilters = { ...query };
        const result = await this.ownersRepository.findAllWithRelations(filters, query);

        return {
            ...result,
            data: OwnersMapper.toResponseList(result.data)
        };
    }

    async findOne(id: string) {
        const owner = await this.ownersRepository.findOne({ where: { id } });
        if (!owner) {
            throw new NotFoundException(`Owner with ID ${id} not found`);
        }
        return OwnersMapper.toResponse(owner);
    }

    async create(createOwnerDto: CreateOwnerDto) {
        const owner = this.ownersRepository.create({
            id: crypto.randomUUID(),
            ...createOwnerDto,
        } as any) as unknown as Owner;

        await this.ownersRepository.save(owner);
        return this.findOne(owner.id);
    }

    async update(id: string, updateOwnerDto: any) {
        const owner = await this.ownersRepository.findOne({ where: { id } });
        if (!owner) {
            throw new NotFoundException(`Owner with ID ${id} not found`);
        }

        Object.assign(owner, updateOwnerDto);
        await this.ownersRepository.save(owner);
        return this.findOne(id);
    }

    async remove(id: string) {
        const owner = await this.ownersRepository.findOne({ where: { id } });
        if (!owner) {
            throw new NotFoundException(`Owner with ID ${id} not found`);
        }
        const response = OwnersMapper.toResponse(owner);
        await this.ownersRepository.remove(owner);
        return response;
    }
}

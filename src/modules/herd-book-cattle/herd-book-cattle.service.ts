import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../../entities/user.entity';
import { HerdBookCattleRepository, HerdBookCattleFilters } from './herd-book-cattle.repository';
import { HerdBookCattleMapper } from './herd-book-cattle.mapper';
import { HerdBookCattle } from '../../entities/herd-book-cattle.entity';
import * as crypto from 'crypto';

@Injectable()
export class HerdBookCattleService {
    constructor(
        private readonly herdBookCattleRepository: HerdBookCattleRepository,
    ) { }

    async findAll(query: any, user: User) {
        const filters: HerdBookCattleFilters = {
            ...query,
            userRole: user.role,
            userOwnerId: user.ownerId
        };

        const result = await this.herdBookCattleRepository.findAllWithRelations(filters, query);

        return {
            ...result,
            data: HerdBookCattleMapper.toResponseList(result.data)
        };
    }

    async findOne(id: string, user: User) {
        const hbc = await this.herdBookCattleRepository.findOne({ 
            where: { id },
            relations: ['cattle', 'herdBook', 'category', 'status']
        });

        if (!hbc) {
            throw new NotFoundException(`HerdBookCattle entry with ID ${id} not found`);
        }
        return HerdBookCattleMapper.toResponse(hbc);
    }

    async create(createDto: any, user: User) {
        const hbc = this.herdBookCattleRepository.create({
            id: crypto.randomUUID(),
            ...createDto,
        } as any) as unknown as HerdBookCattle;

        await this.herdBookCattleRepository.save(hbc);
        return this.findOne(hbc.id, user);
    }

    async update(id: string, updateDto: any, user: User) {
        const hbc = await this.herdBookCattleRepository.findOne({ where: { id } });
        if (!hbc) {
            throw new NotFoundException(`HerdBookCattle entry with ID ${id} not found`);
        }

        Object.assign(hbc, updateDto);
        await this.herdBookCattleRepository.save(hbc);
        return this.findOne(id, user);
    }

    async remove(id: string, user: User) {
        const hbc = await this.herdBookCattleRepository.findOne({ where: { id } });
        if (!hbc) {
            throw new NotFoundException(`HerdBookCattle entry with ID ${id} not found`);
        }
        const response = HerdBookCattleMapper.toResponse(hbc);
        await this.herdBookCattleRepository.remove(hbc);
        return response;
    }
}

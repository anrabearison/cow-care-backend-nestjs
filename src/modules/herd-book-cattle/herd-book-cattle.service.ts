import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateHerdBookCattleDto } from './dto/create-herd-book-cattle.dto';
import { UpdateHerdBookCattleDto } from './dto/update-herd-book-cattle.dto';
import { CattleService } from '../cattle/cattle.service';
import { HerdBookCattleRepository, HerdBookCattleFilters, HerdBookCattlePaginationOptions } from './herd-book-cattle.repository';
import * as crypto from 'crypto';

@Injectable()
export class HerdBookCattleService {
    constructor(
        private readonly herdBookCattleRepository: HerdBookCattleRepository,
        private readonly cattleService: CattleService,
    ) { }

    async findAll(query: any, user: any) {
        const filters: HerdBookCattleFilters = {
            ...query,
            currentUserRole: user?.role,
            currentUserOwnerId: user?.owner_id // Note: using owner_id as seen in original code RBAC
        };

        const pagination: HerdBookCattlePaginationOptions = {
            page: Number(query.page) || 1,
            per_page: Number(query.per_page) || 10,
            sort: query.sort || 'createdAt',
            order: (query.order as 'ASC' | 'DESC') || 'DESC'
        };

        const [data, total] = await this.herdBookCattleRepository.findAllWithRelations(filters, pagination);

        return { data, total, page: pagination.page, per_page: pagination.per_page };
    }

    async findOne(id: string) {
        const entity = await this.herdBookCattleRepository.findOneWithRelations(id);
        if (!entity) throw new NotFoundException('HerdBookCattle not found');
        return entity;
    }

    async create(dto: CreateHerdBookCattleDto, user?: any) {
        if (!dto.cattleId && dto.cattle) {
            const newCattle = await this.cattleService.create(dto.cattle, user);
            dto.cattleId = newCattle.id;
        } else if (!dto.cattleId) {
            throw new BadRequestException('Either cattleId or cattle details must be provided');
        }

        const { cattle, ...entityData } = dto;
        const entity = this.herdBookCattleRepository.create({
            ...entityData,
            id: (entityData as any).id || crypto.randomUUID()
        });
        return this.herdBookCattleRepository.save(entity);
    }

    async update(id: string, dto: UpdateHerdBookCattleDto) {
        await this.herdBookCattleRepository.update({ id }, dto as any);
        const updated = await this.herdBookCattleRepository.findOne({ where: { id } });
        if (!updated) throw new NotFoundException('HerdBookCattle not found');
        return updated;
    }

    async remove(id: string) {
        const entity = await this.herdBookCattleRepository.findOne({ where: { id } });
        if (!entity) throw new NotFoundException('HerdBookCattle not found');
        await this.herdBookCattleRepository.remove(entity);
        return entity;
    }
}

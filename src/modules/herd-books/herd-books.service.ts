import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateHerdBookDto, UpdateHerdBookDto } from './dto/create-herd-book.dto';
import { transformKeysToSnakeCase } from '../../common/utils/case-transform.util';
import { HerdBooksRepository, HerdBooksFilters, HerdBooksPaginationOptions } from './herd-books.repository';
import * as crypto from 'crypto';

@Injectable()
export class HerdBooksService {
    constructor(
        private readonly herdBooksRepository: HerdBooksRepository,
    ) { }

    async findAll(query: any = {}, user?: any) {
        // Parse filter if it exists (React Admin style)
        let parsedFilters = {};
        if (query.filter) {
            try {
                parsedFilters = JSON.parse(query.filter);
            } catch (e) {
                parsedFilters = {};
            }
        }

        const filters: HerdBooksFilters = {
            owner_id: query.owner_id || (parsedFilters as any).owner_id,
            currentUserRole: user?.role,
            currentUserOwnerId: user?.ownerId
        };

        const pagination: HerdBooksPaginationOptions = {
            page: Number(query.page) || 1,
            per_page: Number(query.per_page) || 10,
            sort: query.sort || 'createdAt',
            order: (query.order as 'ASC' | 'DESC') || 'DESC'
        };

        const [rawData, total] = await this.herdBooksRepository.findAllWithRelations(filters, pagination);
        const data = transformKeysToSnakeCase(rawData);

        return {
            data,
            total,
            page: pagination.page,
            per_page: pagination.per_page
        };
    }

    async findOne(id: string) {
        const herdBook = await this.herdBooksRepository.findOneWithRelations(id);
        if (!herdBook) {
            throw new NotFoundException(`HerdBook with ID ${id} not found`);
        }
        return transformKeysToSnakeCase(herdBook);
    }

    async create(createHerdBookDto: CreateHerdBookDto) {
        const herdBook = this.herdBooksRepository.create({
            ...createHerdBookDto,
            id: crypto.randomUUID(),
        });
        const saved = await this.herdBooksRepository.save(herdBook);
        return transformKeysToSnakeCase(saved);
    }

    async update(id: string, updateHerdBookDto: UpdateHerdBookDto) {
        const entity = await this.herdBooksRepository.findOne({ where: { id } });
        if (!entity) throw new NotFoundException(`HerdBook with ID ${id} not found`);

        Object.assign(entity, updateHerdBookDto);
        const saved = await this.herdBooksRepository.save(entity);
        return transformKeysToSnakeCase(saved);
    }

    async remove(id: string) {
        const entity = await this.herdBooksRepository.findOne({ where: { id } });
        if (!entity) throw new NotFoundException(`HerdBook with ID ${id} not found`);

        await this.herdBooksRepository.remove(entity);
        return transformKeysToSnakeCase(entity);
    }
}

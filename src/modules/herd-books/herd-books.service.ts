import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HerdBook } from '../../entities/herd-book.entity';
import { CreateHerdBookDto, UpdateHerdBookDto } from './dto/create-herd-book.dto';
import { transformKeysToSnakeCase } from '../../common/utils/case-transform.util';

@Injectable()
export class HerdBooksService {
    constructor(
        @InjectRepository(HerdBook)
        private herdBooksRepository: Repository<HerdBook>,
    ) { }

    async findAll(query: any = {}) {
        const { page = 1, per_page = 10, sort = 'createdAt', order = 'DESC' } = query;
        const skip = (page - 1) * per_page;

        // Parse filter if it exists (React Admin style)
        let filters = {};
        if (query.filter) {
            try {
                filters = JSON.parse(query.filter);
            } catch (e) {
                filters = {};
            }
        }

        // Merge flat params and parsed filters
        const owner_id = query.owner_id || filters['owner_id'];

        const qb = this.herdBooksRepository.createQueryBuilder('herdBook');

        if (owner_id) {
            qb.andWhere('herdBook.ownerId = :ownerId', { ownerId: owner_id });
        }

        const sortMapping = {
            'created_at': 'createdAt',
            'updated_at': 'updatedAt',
            'owner_id': 'ownerId'
        };
        const sortField = sortMapping[sort] || sort;

        qb.orderBy(`herdBook.${sortField}`, order as 'ASC' | 'DESC');
        qb.skip(skip).take(per_page);

        const [rawData, total] = await qb.getManyAndCount();
        const data = transformKeysToSnakeCase(rawData);

        return {
            data,
            total,
            page: Number(page),
            per_page: Number(per_page)
        };
    }

    async findOne(id: string) {
        const herdBook = await this.herdBooksRepository.findOne({ where: { id } });
        if (!herdBook) {
            throw new NotFoundException(`HerdBook with ID ${id} not found`);
        }
        return transformKeysToSnakeCase(herdBook);
    }

    async create(createHerdBookDto: CreateHerdBookDto) {
        const herdBook = this.herdBooksRepository.create(createHerdBookDto);
        const saved = await this.herdBooksRepository.save(herdBook);
        return transformKeysToSnakeCase(saved);
    }

    async update(id: string, updateHerdBookDto: UpdateHerdBookDto) {
        const herdBook = await this.findOne(id);
        // Note: findOne returns transformed object, but we need entity for save
        // So we fetch entity again or cast it back (but better to fetch fresh)
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

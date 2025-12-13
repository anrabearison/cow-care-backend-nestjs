import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HerdBook } from '../../entities/herd-book.entity';
import { CreateHerdBookDto, UpdateHerdBookDto } from './dto/create-herd-book.dto';

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

        qb.orderBy(`herdBook.${sort}`, order as 'ASC' | 'DESC');
        qb.skip(skip).take(per_page);

        const [data, total] = await qb.getManyAndCount();

        return {
            data,
            total,
            page: Number(page),
            per_page: Number(per_page)
        };
    }

    async findOne(id: string): Promise<HerdBook> {
        const herdBook = await this.herdBooksRepository.findOne({ where: { id } });
        if (!herdBook) {
            throw new NotFoundException(`HerdBook with ID ${id} not found`);
        }
        return herdBook;
    }

    async create(createHerdBookDto: CreateHerdBookDto): Promise<HerdBook> {
        const herdBook = this.herdBooksRepository.create(createHerdBookDto);
        return this.herdBooksRepository.save(herdBook);
    }

    async update(id: string, updateHerdBookDto: UpdateHerdBookDto): Promise<HerdBook> {
        const herdBook = await this.findOne(id);
        Object.assign(herdBook, updateHerdBookDto);
        return this.herdBooksRepository.save(herdBook);
    }

    async remove(id: string): Promise<void> {
        const herdBook = await this.findOne(id);
        await this.herdBooksRepository.remove(herdBook);
    }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateHerdBookDto } from './dto/create-herd-book.dto';
import { User } from '../../platform/users/entities/user.entity';
import { HerdBooksRepository, HerdBooksFilters } from './herd-books.repository';
import { HerdBooksMapper } from './herd-books.mapper';
import { HerdBook } from './entities/herd-book.entity';
import { resolveOwnerIdFromUser } from '../../../common/utils/rbac.util';

@Injectable()
export class HerdBooksService {
    constructor(
        private readonly herdBooksRepository: HerdBooksRepository,
    ) { }

    async findAll(query: any, user: User) {
        const ownerId = resolveOwnerIdFromUser(user, query.ownerId, 'herd books');

        const filters: HerdBooksFilters = {
            ...query,
            ownerId,
        };

        const result = await this.herdBooksRepository.findAllWithRelations(filters, query);

        return {
            ...result,
            data: HerdBooksMapper.toResponseList(result.data)
        };
    }

    async findOne(id: string, user: User) {
        const ownerId = resolveOwnerIdFromUser(user, null, 'herd book');
        const herdBook = await this.herdBooksRepository.findOneWithRelations(id, ownerId);
        if (!herdBook) {
            throw new NotFoundException(`HerdBook with ID ${id} not found`);
        }
        return HerdBooksMapper.toResponse(herdBook);
    }

    async create(createHerdBookDto: CreateHerdBookDto, user: User) {
        const herdBook = this.herdBooksRepository.create({
            ownerId: createHerdBookDto.ownerId ?? user.ownerId,
            ...createHerdBookDto,
        } as any) as unknown as HerdBook;

        await this.herdBooksRepository.save(herdBook);
        return this.findOne(herdBook.id, user);
    }

    async update(id: string, updateHerdBookDto: any, user: User) {
        const ownerId = resolveOwnerIdFromUser(user, null, 'herd book');
        const herdBook = await this.herdBooksRepository.findOneWithRelations(id, ownerId);
        if (!herdBook) {
            throw new NotFoundException(`HerdBook with ID ${id} not found`);
        }

        Object.assign(herdBook, updateHerdBookDto);
        await this.herdBooksRepository.save(herdBook);
        return this.findOne(id, user);
    }

    async remove(id: string, user: User) {
        const ownerId = resolveOwnerIdFromUser(user, null, 'herd book');
        const herdBook = await this.herdBooksRepository.findOneWithRelations(id, ownerId);
        if (!herdBook) {
            throw new NotFoundException(`HerdBook with ID ${id} not found`);
        }
        const response = HerdBooksMapper.toResponse(herdBook);
        await this.herdBooksRepository.remove(herdBook);
        return response;
    }
}

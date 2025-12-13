import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HerdBookCattle } from '../../entities/herd-book-cattle.entity';
import { CreateHerdBookCattleDto } from './dto/create-herd-book-cattle.dto';
import { UpdateHerdBookCattleDto } from './dto/update-herd-book-cattle.dto';
import { transformKeysToSnakeCase } from '../../common/utils/case-transform.util';

@Injectable()
export class HerdBookCattleService {
    constructor(
        @InjectRepository(HerdBookCattle)
        private readonly herdBookCattleRepo: Repository<HerdBookCattle>,
    ) { }

    async findAll(query: any, user: any) {
        const { page = 1, per_page = 10, sort = 'createdAt', order = 'DESC', q, herd_book_id, cattle_id, category_id, status_id, id } = query;
        const qb = this.herdBookCattleRepo.createQueryBuilder('hbc');
        qb.leftJoinAndSelect('hbc.herdBook', 'herdBook');
        qb.leftJoinAndSelect('hbc.cattle', 'cattle');

        // role based filter – super admin sees all, others see only their herd books
        if (user.role !== 'SUPER_ADMIN') {
            qb.andWhere('hbc.herdBookId = :herdBookId', { herdBookId: user.owner_id });
        }
        if (herd_book_id) qb.andWhere('hbc.herdBookId = :herdBookId', { herdBookId: herd_book_id });
        if (cattle_id) qb.andWhere('hbc.cattleId = :cattleId', { cattleId: cattle_id });
        if (category_id) qb.andWhere('hbc.categoryId = :categoryId', { categoryId: category_id });
        if (status_id) qb.andWhere('hbc.statusId = :statusId', { statusId: status_id });
        if (id) qb.andWhere('hbc.id IN (:...ids)', { ids: Array.isArray(id) ? id : [id] });
        if (q) {
            qb.andWhere('(hbc.nCarnet ILIKE :search OR hbc.categoryId ILIKE :search)', { search: `%${q}%` });
        }
        qb.orderBy(`hbc.${sort}`, order as 'ASC' | 'DESC');
        qb.skip((page - 1) * per_page).take(per_page);
        const [rawData, total] = await qb.getManyAndCount();
        const data = transformKeysToSnakeCase(rawData);
        return { data, total, page: Number(page), per_page: Number(per_page) };
    }

    async findOne(id: string) {
        const entity = await this.herdBookCattleRepo.findOne({
            where: { id },
            relations: ['herdBook', 'cattle']
        });
        if (!entity) throw new NotFoundException('HerdBookCattle not found');
        return transformKeysToSnakeCase(entity);
    }

    async create(dto: CreateHerdBookCattleDto) {
        const entity = this.herdBookCattleRepo.create(dto as any);
        const saved = await this.herdBookCattleRepo.save(entity);
        return transformKeysToSnakeCase(saved);
    }

    async update(id: string, dto: UpdateHerdBookCattleDto) {
        await this.herdBookCattleRepo.update({ id }, dto as any);
        const updated = await this.herdBookCattleRepo.findOne({ where: { id } });
        if (!updated) throw new NotFoundException('HerdBookCattle not found');
        return transformKeysToSnakeCase(updated);
    }

    async remove(id: string) {
        const entity = await this.herdBookCattleRepo.findOne({ where: { id } });
        if (!entity) throw new NotFoundException('HerdBookCattle not found');
        await this.herdBookCattleRepo.remove(entity);
        return transformKeysToSnakeCase(entity);
    }
}

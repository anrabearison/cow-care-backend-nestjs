import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HerdBookCattle } from '../../entities/herd-book-cattle.entity';
import { CreateHerdBookCattleDto } from './dto/create-herd-book-cattle.dto';
import { UpdateHerdBookCattleDto } from './dto/update-herd-book-cattle.dto';
import { transformKeysToSnakeCase } from '../../common/utils/case-transform.util';
import { CattleService } from '../cattle/cattle.service';

@Injectable()
export class HerdBookCattleService {
    constructor(
        @InjectRepository(HerdBookCattle)
        private readonly herdBookCattleRepo: Repository<HerdBookCattle>,
        private readonly cattleService: CattleService,
    ) { }

    async findAll(query: any, user: any) {
        const { page = 1, per_page = 10, sort = 'createdAt', order = 'DESC', q, herd_book_id, cattle_id, category_id, status_id, id } = query;
        const qb = this.herdBookCattleRepo.createQueryBuilder('hbc');
        qb.leftJoinAndSelect('hbc.herdBook', 'herdBook');
        qb.leftJoinAndSelect('hbc.cattle', 'cattle');
        qb.leftJoinAndSelect('hbc.category', 'category');
        qb.leftJoinAndSelect('hbc.status', 'status');

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

        const sortMapping = {
            'created_at': 'createdAt',
            'updated_at': 'updatedAt',
            'n_carnet': 'nCarnet',
            'herd_book_id': 'herdBookId',
            'cattle_id': 'cattleId',
            'category_id': 'categoryId',
            'status_id': 'statusId'
        };
        const sortField = sortMapping[sort] || sort;

        qb.orderBy(`hbc.${sortField}`, order as 'ASC' | 'DESC');
        qb.skip((page - 1) * per_page).take(per_page);
        const [rawData, total] = await qb.getManyAndCount();

        const data = transformKeysToSnakeCase(rawData);

        return { data, total, page: Number(page), per_page: Number(per_page) };
    }

    async findOne(id: string) {
        const entity = await this.herdBookCattleRepo.findOne({
            where: { id },
            relations: ['herdBook', 'cattle', 'category', 'status']
        });
        if (!entity) throw new NotFoundException('HerdBookCattle not found');
        return transformKeysToSnakeCase(entity);
    }

    async create(dto: CreateHerdBookCattleDto, user?: any) {
        if (!dto.cattleId && dto.cattle) {
            const newCattle = await this.cattleService.create(dto.cattle, user);
            dto.cattleId = newCattle.id;
        } else if (!dto.cattleId) {
            throw new BadRequestException('Either cattleId or cattle details must be provided');
        }

        const { cattle, ...entityData } = dto;
        const entity = this.herdBookCattleRepo.create(entityData as any);
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

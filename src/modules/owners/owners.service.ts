import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Owner } from '../../entities/owner.entity';
import { UserRole } from '../../entities/user.entity';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { transformKeysToSnakeCase } from '../../common/utils/case-transform.util';

@Injectable()
export class OwnersService {
    constructor(
        @InjectRepository(Owner)
        private ownersRepository: Repository<Owner>,
    ) { }

    async findAll(query: any, user?: any) {
        const { page = 1, per_page = 10, sort = 'name', order = 'ASC', q, id } = query;
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

        const qb = this.ownersRepository.createQueryBuilder('owner');

        // Role-based filtering (matching FastAPI logic)
        if (user) {
            if (user.role === UserRole.SUPER_ADMIN) {
                // Super admin can see all owners
            } else if (user.ownerId) {
                // Other roles can only see their own owner
                qb.andWhere('owner.id = :ownerId', { ownerId: user.ownerId });
            } else {
                // No access if not super admin and no owner_id
                return {
                    data: [],
                    total: 0,
                    page: Number(page),
                    per_page: Number(per_page)
                };
            }
        }

        // Filter by specific IDs if provided
        if (id) {
            const ids = Array.isArray(id) ? id : [id];
            qb.andWhere('owner.id IN (:...ids)', { ids });
        }

        // Extended search (matching FastAPI: name, contact_info, address)
        if (q) {
            qb.andWhere('(owner.name ILIKE :q OR owner.contactInfo ILIKE :q OR owner.address ILIKE :q)', { q: `%${q}%` });
        }

        qb.orderBy(`owner.${sort}`, order as 'ASC' | 'DESC');
        qb.skip(skip).take(per_page);

        const [rawData, total] = await qb.getManyAndCount();

        // Transform keys to snake_case for frontend compatibility
        const data = transformKeysToSnakeCase(rawData);

        return {
            data,
            total,
            page: Number(page),
            per_page: Number(per_page)
        };
    }

    async findOne(id: string, user?: any) {
        // RBAC check
        if (user && user.role !== UserRole.SUPER_ADMIN) {
            if (user.ownerId !== id) {
                throw new NotFoundException(`Owner with ID ${id} not found`);
            }
        }

        const owner = await this.ownersRepository.findOne({ where: { id } });
        if (!owner) {
            throw new NotFoundException(`Owner with ID ${id} not found`);
        }
        return owner;
    }

    async create(createOwnerDto: CreateOwnerDto) {
        const { contact_info, ...rest } = createOwnerDto as any;
        const owner = this.ownersRepository.create({
            ...rest,
            contactInfo: contact_info,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await this.ownersRepository.save(owner);
        return owner;
    }

    async update(id: string, updateOwnerDto: any, user?: any) {
        const owner = await this.findOne(id, user);
        
        // Map contact_info to contactInfo
        if (updateOwnerDto.contact_info !== undefined) {
            updateOwnerDto.contactInfo = updateOwnerDto.contact_info;
            delete updateOwnerDto.contact_info;
        }

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

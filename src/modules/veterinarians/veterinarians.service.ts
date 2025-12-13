import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Veterinarian } from '../../entities/veterinarian.entity';
import { CreateVeterinarianDto, UpdateVeterinarianDto } from './dto/create-veterinarian.dto';

@Injectable()
export class VeterinariansService {
    constructor(
        @InjectRepository(Veterinarian)
        private veterinariansRepository: Repository<Veterinarian>,
    ) { }

    async findAll(query: any) {
        const { page = 1, per_page = 10, sort = 'id', order = 'ASC', q, specialite, id } = query;
        const skip = (page - 1) * per_page;

        const qb = this.veterinariansRepository.createQueryBuilder('veterinarian');

        if (id) {
            const ids = Array.isArray(id) ? id : [id];
            qb.andWhere('veterinarian.id IN (:...ids)', { ids });
        }

        if (q) {
            qb.andWhere('veterinarian.nom ILIKE :q', { q: `%${q}%` });
        }

        if (specialite) {
            qb.andWhere('veterinarian.specialite ILIKE :specialite', { specialite: `%${specialite}%` });
        }

        qb.orderBy(`veterinarian.${sort}`, order as 'ASC' | 'DESC');
        qb.skip(skip).take(per_page);

        const [data, total] = await qb.getManyAndCount();

        return {
            data,
            total,
            page: Number(page),
            per_page: Number(per_page)
        };
    }

    async findOne(id: string): Promise<Veterinarian> {
        const veterinarian = await this.veterinariansRepository.findOne({ where: { id } });
        if (!veterinarian) {
            throw new NotFoundException(`Veterinarian with ID ${id} not found`);
        }
        return veterinarian;
    }

    async create(createVeterinarianDto: CreateVeterinarianDto): Promise<Veterinarian> {
        const veterinarian = this.veterinariansRepository.create({
            ...createVeterinarianDto,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        return this.veterinariansRepository.save(veterinarian);
    }

    async update(id: string, updateVeterinarianDto: UpdateVeterinarianDto): Promise<Veterinarian> {
        const veterinarian = await this.findOne(id);
        Object.assign(veterinarian, updateVeterinarianDto);
        return this.veterinariansRepository.save(veterinarian);
    }

    async remove(id: string): Promise<void> {
        const veterinarian = await this.findOne(id);
        await this.veterinariansRepository.remove(veterinarian);
    }
}

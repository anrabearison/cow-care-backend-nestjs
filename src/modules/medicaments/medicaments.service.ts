import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Medicament } from '../../entities/medicament.entity';
import { CreateMedicamentDto, UpdateMedicamentDto } from './dto/create-medicament.dto';

@Injectable()
export class MedicamentsService {
    constructor(
        @InjectRepository(Medicament)
        private medicamentsRepository: Repository<Medicament>,
    ) { }

    async findAll(query: any) {
        const { page = 1, per_page = 10, sort = 'id', order = 'ASC', q, type, id } = query;
        const skip = (page - 1) * per_page;

        const qb = this.medicamentsRepository.createQueryBuilder('medicament');

        if (id) {
            const ids = Array.isArray(id) ? id : [id];
            qb.andWhere('medicament.id IN (:...ids)', { ids });
        }

        if (q) {
            qb.andWhere('medicament.nom ILIKE :q', { q: `%${q}%` });
        }

        if (type) {
            qb.andWhere('medicament.type ILIKE :type', { type: `%${type}%` });
        }

        qb.orderBy(`medicament.${sort}`, order as 'ASC' | 'DESC');
        qb.skip(skip).take(per_page);

        const [data, total] = await qb.getManyAndCount();

        return {
            data,
            total,
            page: Number(page),
            per_page: Number(per_page)
        };
    }

    async findOne(id: string): Promise<Medicament> {
        const medicament = await this.medicamentsRepository.findOne({ where: { id } });
        if (!medicament) {
            throw new NotFoundException(`Medicament with ID ${id} not found`);
        }
        return medicament;
    }

    async create(createMedicamentDto: CreateMedicamentDto): Promise<Medicament> {
        const medicament = this.medicamentsRepository.create({
            ...createMedicamentDto,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        return this.medicamentsRepository.save(medicament);
    }

    async update(id: string, updateMedicamentDto: UpdateMedicamentDto): Promise<Medicament> {
        const medicament = await this.findOne(id);
        Object.assign(medicament, updateMedicamentDto);
        return this.medicamentsRepository.save(medicament);
    }

    async remove(id: string): Promise<void> {
        const medicament = await this.findOne(id);
        await this.medicamentsRepository.remove(medicament);
    }
}

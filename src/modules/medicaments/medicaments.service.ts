import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMedicamentDto, UpdateMedicamentDto } from './dto/create-medicament.dto';
import { MedicamentsRepository, MedicamentsFilters, MedicamentsPaginationOptions } from './medicaments.repository';
import { transformKeysToSnakeCase } from '../../common/utils/case-transform.util';

@Injectable()
export class MedicamentsService {
    constructor(
        private readonly medicamentsRepository: MedicamentsRepository,
    ) { }

    async findAll(query: any) {
        const filters: MedicamentsFilters = {
            ...query
        };

        const pagination: MedicamentsPaginationOptions = {
            page: Number(query.page) || 1,
            per_page: Number(query.per_page) || 10,
            sort: query.sort || 'id',
            order: (query.order as 'ASC' | 'DESC') || 'ASC'
        };

        const [rawData, total] = await this.medicamentsRepository.findAllWithRelations(filters, pagination);
        const data = transformKeysToSnakeCase(rawData);

        return {
            data,
            total,
            page: pagination.page,
            per_page: pagination.per_page
        };
    }

    async findOne(id: string) {
        const medicament = await this.medicamentsRepository.findOneWithRelations(id);
        if (!medicament) {
            throw new NotFoundException(`Medicament with ID ${id} not found`);
        }
        return transformKeysToSnakeCase(medicament);
    }

    async create(createMedicamentDto: CreateMedicamentDto) {
        const medicament = this.medicamentsRepository.create({
            ...createMedicamentDto,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        const saved = await this.medicamentsRepository.save(medicament);
        return transformKeysToSnakeCase(saved);
    }

    async update(id: string, updateMedicamentDto: UpdateMedicamentDto) {
        const medicament = await this.medicamentsRepository.findOne({ where: { id } });
        if (!medicament) {
            throw new NotFoundException(`Medicament with ID ${id} not found`);
        }
        Object.assign(medicament, updateMedicamentDto);
        const saved = await this.medicamentsRepository.save(medicament);
        return transformKeysToSnakeCase(saved);
    }

    async remove(id: string) {
        const medicament = await this.medicamentsRepository.findOne({ where: { id } });
        if (!medicament) {
            throw new NotFoundException(`Medicament with ID ${id} not found`);
        }
        await this.medicamentsRepository.remove(medicament);
        return transformKeysToSnakeCase(medicament);
    }
}

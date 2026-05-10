import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMedicamentDto, UpdateMedicamentDto } from './dto/create-medicament.dto';
import { MedicamentsRepository, MedicamentsFilters, MedicamentsPaginationOptions } from './medicaments.repository';
import { MedicamentsMapper } from './medicaments.mapper';

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
            perPage: Number(query.perPage) || 10,
            sort: query.sort || 'id',
            order: (query.order as 'ASC' | 'DESC') || 'ASC'
        };

        const [data, total] = await this.medicamentsRepository.findAllWithRelations(filters, pagination);

        return {
            data: MedicamentsMapper.toResponseList(data),
            total,
            page: pagination.page,
            perPage: pagination.perPage
        };
    }

    async findOne(id: string) {
        const medicament = await this.medicamentsRepository.findOneWithRelations(id);
        if (!medicament) {
            throw new NotFoundException(`Medicament with ID ${id} not found`);
        }
        return MedicamentsMapper.toResponse(medicament);
    }

    async create(createMedicamentDto: CreateMedicamentDto) {
        const medicament = this.medicamentsRepository.create({
            ...createMedicamentDto,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        return this.medicamentsRepository.save(medicament);
    }

    async update(id: string, updateMedicamentDto: UpdateMedicamentDto) {
        const medicament = await this.medicamentsRepository.findOne({ where: { id } });
        if (!medicament) {
            throw new NotFoundException(`Medicament with ID ${id} not found`);
        }
        Object.assign(medicament, updateMedicamentDto);
        return this.medicamentsRepository.save(medicament);
    }

    async remove(id: string) {
        const medicament = await this.medicamentsRepository.findOne({ where: { id } });
        if (!medicament) {
            throw new NotFoundException(`Medicament with ID ${id} not found`);
        }
        await this.medicamentsRepository.remove(medicament);
        return medicament;
    }
}

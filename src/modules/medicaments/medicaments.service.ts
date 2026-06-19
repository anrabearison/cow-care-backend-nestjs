import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMedicamentDto } from './dto/create-medicament.dto';
import { MedicamentsRepository, MedicamentsFilters } from './medicaments.repository';
import { MedicamentsMapper } from './medicaments.mapper';
import { Medicament } from '../../entities/medicament.entity';
import * as crypto from 'crypto';

@Injectable()
export class MedicamentsService {
    constructor(
        private readonly medicamentsRepository: MedicamentsRepository,
    ) { }

    async findAll(query: any) {
        const filters: MedicamentsFilters = { ...query };
        const result = await this.medicamentsRepository.findAllWithRelations(filters, query);

        return {
            ...result,
            data: MedicamentsMapper.toResponseList(result.data)
        };
    }

    async findOne(id: string) {
        const medicament = await this.medicamentsRepository.findOne({ where: { id } });
        if (!medicament) {
            throw new NotFoundException(`Medicament with ID ${id} not found`);
        }
        return MedicamentsMapper.toResponse(medicament);
    }

    async create(createMedicamentDto: CreateMedicamentDto) {
        const medicament = this.medicamentsRepository.create({
            id: crypto.randomUUID(),
            ...createMedicamentDto,
        } as any) as unknown as Medicament;

        await this.medicamentsRepository.save(medicament);
        return this.findOne(medicament.id);
    }

    async update(id: string, updateMedicamentDto: any) {
        const medicament = await this.medicamentsRepository.findOne({ where: { id } });
        if (!medicament) {
            throw new NotFoundException(`Medicament with ID ${id} not found`);
        }

        Object.assign(medicament, updateMedicamentDto);
        await this.medicamentsRepository.save(medicament);
        return this.findOne(id);
    }

    async remove(id: string) {
        const medicament = await this.medicamentsRepository.findOne({ where: { id } });
        if (!medicament) {
            throw new NotFoundException(`Medicament with ID ${id} not found`);
        }
        const response = MedicamentsMapper.toResponse(medicament);
        await this.medicamentsRepository.remove(medicament);
        return response;
    }
}

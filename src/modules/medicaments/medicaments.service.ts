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

    async findAll(): Promise<Medicament[]> {
        return this.medicamentsRepository.find();
    }

    async findOne(id: string): Promise<Medicament> {
        const medicament = await this.medicamentsRepository.findOne({ where: { id } });
        if (!medicament) {
            throw new NotFoundException(`Medicament with ID ${id} not found`);
        }
        return medicament;
    }

    async create(createMedicamentDto: CreateMedicamentDto): Promise<Medicament> {
        const medicament = this.medicamentsRepository.create(createMedicamentDto);
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

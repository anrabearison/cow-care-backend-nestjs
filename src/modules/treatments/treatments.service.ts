import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTreatmentDto } from './dto/create-treatment.dto';
import { User } from '../../entities/user.entity';
import { TreatmentsRepository, TreatmentsFilters, TreatmentsPaginationOptions } from './treatments.repository';
import { TreatmentsMapper } from './treatments.mapper';

@Injectable()
export class TreatmentsService {
    constructor(
        private readonly treatmentsRepository: TreatmentsRepository,
    ) { }

    async findAll(query: any, user: User) {
        const filters: TreatmentsFilters = {
            ...query,
            userRole: user.role,
            userOwnerId: user.ownerId
        };

        const pagination: TreatmentsPaginationOptions = {
            page: Number(query.page) || 1,
            perPage: Number(query.perPage) || 10,
            sort: query.sort || 'date',
            order: query.order || 'DESC'
        };

        const [rawData, total] = await this.treatmentsRepository.findAllWithRelations(filters, pagination);
        const data = rawData.map(item => TreatmentsMapper.toResponse(item));

        return {
            data,
            total,
            page: Number(pagination.page),
            perPage: Number(pagination.perPage)
        };
    }

    async findOne(id: string, user: User) {
        const treatment = await this.treatmentsRepository.findOneWithRelations(id, user.role, user.ownerId);

        if (!treatment) {
            throw new NotFoundException(`Treatment with ID ${id} not found`);
        }

        return TreatmentsMapper.toResponse(treatment);
    }

    async create(createTreatmentDto: CreateTreatmentDto, user: User) {
        const treatment = this.treatmentsRepository.create({
            id: crypto.randomUUID(),
            cattleId: createTreatmentDto.cattleId,
            type: createTreatmentDto.type,
            date: createTreatmentDto.date,
            medicamentId: createTreatmentDto.product,
            veterinarianId: createTreatmentDto.veterinarian,
            notes: createTreatmentDto.notes,
            administrationRoute: createTreatmentDto.administrationRoute,

            // Map dosage fields
            dosageQuantite: createTreatmentDto.dosage?.quantite,
            dosageUnite: createTreatmentDto.dosage?.unite,
            animalPoids: createTreatmentDto.dosage?.animalPoids,
            dosageNotes: createTreatmentDto.dosage?.notes,
        });

        await this.treatmentsRepository.save(treatment);
        return this.findOne(treatment.id, user);
    }

    async update(id: string, updateTreatmentDto: any, user: User) {
        const treatment = await this.treatmentsRepository.findOneWithRelations(id, user.role, user.ownerId);
        if (!treatment) {
            throw new NotFoundException(`Treatment with ID ${id} not found`);
        }

        // Handle updates (simplified)
        if (updateTreatmentDto.dosage) {
            treatment.dosageQuantite = updateTreatmentDto.dosage.quantite;
            treatment.dosageUnite = updateTreatmentDto.dosage.unite;
            treatment.animalPoids = updateTreatmentDto.dosage.animalPoids;
            treatment.dosageNotes = updateTreatmentDto.dosage.notes;
        }

        // Update other fields...
        Object.assign(treatment, updateTreatmentDto);
        // Remove nested objects that shouldn't be saved directly
        delete (treatment as any).dosage;

        await this.treatmentsRepository.save(treatment);
        return this.findOne(id, user);
    }

    async remove(id: string, user: User) {
        const treatment = await this.treatmentsRepository.findOneWithRelations(id, user.role, user.ownerId);
        if (!treatment) {
            throw new NotFoundException(`Treatment with ID ${id} not found`);
        }
        await this.treatmentsRepository.remove(treatment);
        return TreatmentsMapper.toResponse(treatment);
    }
}

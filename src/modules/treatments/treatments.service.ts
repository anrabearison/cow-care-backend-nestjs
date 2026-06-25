import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateTreatmentDto } from './dto/create-treatment.dto';
import { UpdateTreatmentDto } from './dto/update-treatment.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { TreatmentsRepository, TreatmentsFilters } from './treatments.repository';
import { TreatmentsMapper } from './treatments.mapper';
import * as crypto from 'crypto';

@Injectable()
export class TreatmentsService {
    constructor(
        private readonly treatmentsRepository: TreatmentsRepository,
    ) { }

    async findAll(query: any, user: User) {
        // Résolution RBAC : le repository ne reçoit qu'un ownerId déjà calculé
        let ownerId: string | null = null;
        if (user.role === UserRole.SUPER_ADMIN) {
            ownerId = query.ownerId ?? null;
        } else {
            if (!user.ownerId) {
                throw new ForbiddenException('User must belong to an owner to list treatments');
            }
            ownerId = user.ownerId;
        }

        const filters: TreatmentsFilters = {
            ...query,
            ownerId,
        };

        const result = await this.treatmentsRepository.findAllWithRelations(filters, query);

        return {
            ...result,
            data: TreatmentsMapper.toResponseList(result.data)
        };
    }

    async findOne(id: string, user: User) {
        const ownerId = user.role !== UserRole.SUPER_ADMIN ? user.ownerId : undefined;
        const treatment = await this.treatmentsRepository.findOneWithRelations(id, ownerId);
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

    async update(id: string, updateTreatmentDto: UpdateTreatmentDto, user: User) {
        const ownerId = user.role !== UserRole.SUPER_ADMIN ? user.ownerId : undefined;
        const treatment = await this.treatmentsRepository.findOneWithRelations(id, ownerId);
        if (!treatment) {
            throw new NotFoundException(`Treatment with ID ${id} not found`);
        }

        // Map dosage fields
        if (updateTreatmentDto.dosage) {
            treatment.dosageQuantite = updateTreatmentDto.dosage.quantite;
            treatment.dosageUnite = updateTreatmentDto.dosage.unite;
            treatment.animalPoids = updateTreatmentDto.dosage.animalPoids;
            treatment.dosageNotes = updateTreatmentDto.dosage.notes;
        }

        // Map other fields with correct column names
        if (updateTreatmentDto.type) treatment.type = updateTreatmentDto.type;
        if (updateTreatmentDto.date) treatment.date = updateTreatmentDto.date;
        if (updateTreatmentDto.product) treatment.medicamentId = updateTreatmentDto.product;
        if (updateTreatmentDto.veterinarian) treatment.veterinarianId = updateTreatmentDto.veterinarian;
        if (updateTreatmentDto.notes) treatment.notes = updateTreatmentDto.notes;
        if (updateTreatmentDto.administrationRoute) treatment.administrationRoute = updateTreatmentDto.administrationRoute;

        await this.treatmentsRepository.save(treatment);
        return this.findOne(id, user);
    }

    async remove(id: string, user: User) {
        const ownerId = user.role !== UserRole.SUPER_ADMIN ? user.ownerId : undefined;
        const treatment = await this.treatmentsRepository.findOneWithRelations(id, ownerId);
        if (!treatment) {
            throw new NotFoundException(`Treatment with ID ${id} not found`);
        }
        const response = TreatmentsMapper.toResponse(treatment);
        await this.treatmentsRepository.remove(treatment);
        return response;
    }
}

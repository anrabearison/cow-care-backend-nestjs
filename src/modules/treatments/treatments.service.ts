import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTreatmentDto } from './dto/create-treatment.dto';
import { UpdateTreatmentDto } from './dto/update-treatment.dto';
import { User } from '../users/entities/user.entity';
import { TreatmentsRepository, TreatmentsFilters } from './treatments.repository';
import { TreatmentsMapper } from './treatments.mapper';
import { Treatment } from './entities/treatment.entity';
import { resolveOwnerIdFromUser } from '../../common/utils/rbac.util';
import { EntityManager } from 'typeorm';

@Injectable()
export class TreatmentsService {
    constructor(
        private readonly treatmentsRepository: TreatmentsRepository,
    ) { }

    async findAll(query: any, user: User) {
        const ownerId = resolveOwnerIdFromUser(user, query.ownerId, 'treatments');

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
        const ownerId = resolveOwnerIdFromUser(user, null, 'treatment');
        const treatment = await this.treatmentsRepository.findOneWithRelations(id, ownerId);
        if (!treatment) {
            throw new NotFoundException(`Treatment with ID ${id} not found`);
        }
        return TreatmentsMapper.toResponse(treatment);
    }

    async create(createTreatmentDto: CreateTreatmentDto, user: User) {
        const treatment = this.treatmentsRepository.create({
            cattleId: createTreatmentDto.cattleId,
            type: createTreatmentDto.type,
            date: createTreatmentDto.date,
            medicamentId: createTreatmentDto.product,
            veterinarianId: createTreatmentDto.veterinarian,
            notes: createTreatmentDto.notes,
            administrationRoute: createTreatmentDto.administrationRoute,

            // Map dosage fields
            dosageQuantity: createTreatmentDto.dosage?.quantity,
            dosageUnit: createTreatmentDto.dosage?.unit,
            animalWeight: createTreatmentDto.dosage?.animalWeight,
            dosageNotes: createTreatmentDto.dosage?.notes,
        });

        await this.treatmentsRepository.save(treatment);
        return this.findOne(treatment.id, user);
    }

    async update(id: string, updateTreatmentDto: UpdateTreatmentDto, user: User) {
        const ownerId = resolveOwnerIdFromUser(user, null, 'treatment');
        const treatment = await this.treatmentsRepository.findOneWithRelations(id, ownerId);
        if (!treatment) {
            throw new NotFoundException(`Treatment with ID ${id} not found`);
        }

        // Map dosage fields
        if (updateTreatmentDto.dosage) {
            treatment.dosageQuantity = updateTreatmentDto.dosage.quantity;
            treatment.dosageUnit = updateTreatmentDto.dosage.unit;
            treatment.animalWeight = updateTreatmentDto.dosage.animalWeight;
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
        const ownerId = resolveOwnerIdFromUser(user, null, 'treatment');
        const treatment = await this.treatmentsRepository.findOneWithRelations(id, ownerId);
        if (!treatment) {
            throw new NotFoundException(`Treatment with ID ${id} not found`);
        }
        const response = TreatmentsMapper.toResponse(treatment);
        await this.treatmentsRepository.remove(treatment);
        return response;
    }

    async updateCattleTreatments(em: EntityManager, cattleId: string, currentTreatments: Treatment[], incomingTreatments: (UpdateTreatmentDto & { id?: string })[]) {
        if (!incomingTreatments) return;
        const incomingIds = incomingTreatments.filter(t => t.id).map(t => t.id);
        const toDelete = currentTreatments.filter(t => !incomingIds.includes(t.id));
        if (toDelete.length > 0) await em.remove(toDelete);

        for (const treatmentData of incomingTreatments) {
            const dosage: any = treatmentData.dosage || {};
            const treatmentPayload = {
                type: treatmentData.type,
                date: treatmentData.date,
                medicamentId: treatmentData.product,
                veterinarianId: treatmentData.veterinarian,
                notes: treatmentData.notes,
                dosageQuantity: dosage.quantity,
                dosageUnit: dosage.unit,
                animalWeight: dosage.animalWeight,
                dosageNotes: dosage.notes
            };

            if (treatmentData.id) {
                await em.update(Treatment, treatmentData.id, treatmentPayload);
            } else {
                await em.insert(Treatment, {
                    cattleId: cattleId,
                    type: treatmentData.type,
                    date: treatmentData.date,
                    medicamentId: treatmentData.product,
                    veterinarianId: treatmentData.veterinarian,
                    notes: treatmentData.notes,
                    dosageQuantity: dosage.quantity,
                    dosageUnit: dosage.unit,
                    animalWeight: dosage.animalWeight,
                    dosageNotes: dosage.notes
                });
            }
        }
    }
}

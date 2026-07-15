import { BaseMapper } from '../../../common/mappers/base.mapper';
import { Treatment } from './entities/treatment.entity';

export class TreatmentsMapper extends BaseMapper {
    static toResponse(treatment: Treatment) {
        if (!treatment) return null;

        return {
            id: treatment.id,
            cattleId: treatment.cattleId,
            type: treatment.type,
            date: treatment.date,
            product: treatment.medicament ? {
                id: treatment.medicament.id,
                name: treatment.medicament.name,
            } : treatment.medicamentId,
            dosage: {
                quantity: treatment.dosageQuantity,
                unit: treatment.dosageUnit,
                animalWeight: treatment.animalWeight,
                notes: treatment.dosageNotes,
            },
            administrationRoute: treatment.administrationRoute,
            veterinarian: treatment.veterinarian ? {
                id: treatment.veterinarian.id,
                name: treatment.veterinarian.name,
            } : treatment.veterinarianId,
            notes: treatment.notes,
            withdrawalEndDate: treatment.withdrawalEndDate,
            createdAt: treatment.createdAt,
            updatedAt: treatment.updatedAt,
        };
    }

    static toResponseList(entities: Treatment[]) {
        return this.mapList(entities, (e) => this.toResponse(e));
    }
}

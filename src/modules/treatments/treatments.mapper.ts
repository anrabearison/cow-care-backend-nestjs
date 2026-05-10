import { Treatment } from '../../entities/treatment.entity';

export class TreatmentsMapper {
    static toResponse(treatment: Treatment) {
        return {
            ...treatment,
            product: treatment.medicamentId,
            veterinarian: treatment.veterinarianId,
            dosage: {
                quantite: treatment.dosageQuantite,
                unite: treatment.dosageUnite,
                animal_poids: treatment.animalPoids,
                notes: treatment.dosageNotes
            }
        };
    }
}

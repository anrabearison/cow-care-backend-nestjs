import { Medicament } from '../../entities/medicament.entity';

export class MedicamentsMapper {
    static toResponse(medicament: Medicament) {
        if (!medicament) return null;
        
        return {
            id: medicament.id,
            name: medicament.name,
            type: medicament.type,
            fabricant: medicament.fabricant,
            notes: medicament.notes,
            dosage: {
                quantite: medicament.dosageQuantite,
                unite: medicament.dosageUnite,
                poids: medicament.dosagePoids,
                unitePoids: medicament.dosageUnitePoids,
                notes: medicament.dosageNotes
            },
            defaultRoute: medicament.defaultRoute,
            withdrawalPeriodMeat: medicament.withdrawalPeriodMeat,
            withdrawalPeriodMilk: medicament.withdrawalPeriodMilk,
            createdAt: medicament.createdAt,
            updatedAt: medicament.updatedAt
        };
    }

    static toResponseList(medicaments: Medicament[]) {
        return medicaments.map(m => this.toResponse(m));
    }
}

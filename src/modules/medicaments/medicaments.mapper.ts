import { BaseMapper } from '../../common/mappers/base.mapper';
import { Medicament } from '../../entities/medicament.entity';

export class MedicamentsMapper extends BaseMapper {
    static toResponse(medicament: Medicament) {
        if (!medicament) return null;

        return {
            id: medicament.id,
            name: medicament.name,
            type: medicament.type,
            dosage: {
                quantite: medicament.dosageQuantite,
                unite: medicament.dosageUnite,
                poids: medicament.dosagePoids,
                unitePoids: medicament.dosageUnitePoids,
                notes: medicament.dosageNotes,
                recommandeOld: medicament.dosageRecommandeOld,
            },
            defaultRoute: medicament.defaultRoute,
            withdrawalPeriod: {
                meat: medicament.withdrawalPeriodMeat,
                milk: medicament.withdrawalPeriodMilk,
            },
            fabricant: medicament.fabricant,
            notes: medicament.notes,
            createdAt: medicament.createdAt,
            updatedAt: medicament.updatedAt,
        };
    }

    static toResponseList(entities: Medicament[]) {
        return this.mapList(entities, (e) => this.toResponse(e));
    }
}

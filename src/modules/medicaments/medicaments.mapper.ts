import { BaseMapper } from '../../common/mappers/base.mapper';
import { Medicament } from './entities/medicament.entity';

export class MedicamentsMapper extends BaseMapper {
    static toResponse(medicament: Medicament) {
        if (!medicament) return null;

        return {
            id: medicament.id,
            name: medicament.name,
            type: medicament.type,
            dosage: {
                quantity: medicament.dosageQuantity,
                unit: medicament.dosageUnit,
                weight: medicament.dosageWeight,
                weightUnit: medicament.dosageWeightUnit,
            },
            withdrawalPeriod: {
                meat: medicament.withdrawalPeriodMeat,
                milk: medicament.withdrawalPeriodMilk,
            },
            manufacturer: medicament.manufacturer,
            notes: medicament.notes,
            createdAt: medicament.createdAt,
            updatedAt: medicament.updatedAt,
        };
    }

    static toResponseList(entities: Medicament[]) {
        return this.mapList(entities, (e) => this.toResponse(e));
    }
}

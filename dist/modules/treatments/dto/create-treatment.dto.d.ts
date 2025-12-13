import { TreatmentType, DosageUnit, AdministrationRoute } from '../../../entities/treatment.entity';
declare class TreatmentDosageDto {
    quantite: number;
    unite: DosageUnit;
    animal_poids?: number;
    notes?: string;
}
export declare class CreateTreatmentDto {
    cattleId: string;
    type: TreatmentType;
    date: Date;
    product: string;
    dosage: TreatmentDosageDto;
    administration_route?: AdministrationRoute;
    veterinarian: string;
    notes?: string;
}
export {};

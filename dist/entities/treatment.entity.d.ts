import { Cattle } from './cattle.entity';
import { Medicament } from './medicament.entity';
import { Veterinarian } from './veterinarian.entity';
export declare enum TreatmentType {
    ANTIBIOTIQUE = "ANTIBIOTIQUE",
    VACCIN = "VACCIN",
    VERMIFUGE = "VERMIFUGE",
    ANTI_INFLAMMATOIRE = "ANTI_INFLAMMATOIRE",
    VITAMINE = "VITAMINE",
    AUTRE = "AUTRE"
}
export declare enum DosageUnit {
    ML = "ML",
    L = "L",
    MG = "MG",
    G = "G",
    KG = "KG",
    COMPRIME = "COMPRIME",
    BOLUS = "BOLUS",
    DOSE = "DOSE",
    UI = "UI"
}
export declare enum AdministrationRoute {
    IM = "IM",
    SC = "SC",
    IV = "IV",
    ORAL = "ORAL",
    TOPICAL = "TOPICAL",
    INTRAMAMMARY = "INTRAMAMMARY",
    INHALATION = "INHALATION",
    OTHER = "OTHER"
}
export declare class Treatment {
    id: string;
    cattleId: string;
    cattle: Cattle;
    type: TreatmentType;
    date: Date;
    medicamentId: string;
    medicament: Medicament;
    dosageQuantite: number;
    dosageUnite: DosageUnit;
    animalPoids: number;
    dosageNotes: string;
    administrationRoute: AdministrationRoute;
    withdrawalEndDate: Date;
    dosageOld: string;
    veterinarianId: string;
    veterinarian: Veterinarian;
    notes: string;
    createdAt: Date;
    updatedAt: Date;
}

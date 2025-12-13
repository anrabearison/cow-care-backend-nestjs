export declare class CreateMedicamentDto {
    id: string;
    name: string;
    type: string;
    dosageQuantite?: number;
    dosageUnite?: string;
    dosagePoids?: number;
    dosageUnitePoids?: string;
    dosageNotes?: string;
    defaultRoute?: string;
    withdrawalPeriodMeat?: number;
    withdrawalPeriodMilk?: number;
    dosageRecommandeOld?: string;
    fabricant?: string;
    notes?: string;
}
export declare class UpdateMedicamentDto {
    name?: string;
    type?: string;
    dosageQuantite?: number;
    dosageUnite?: string;
    dosagePoids?: number;
    dosageUnitePoids?: string;
    dosageNotes?: string;
    defaultRoute?: string;
    withdrawalPeriodMeat?: number;
    withdrawalPeriodMilk?: number;
    dosageRecommandeOld?: string;
    fabricant?: string;
    notes?: string;
}

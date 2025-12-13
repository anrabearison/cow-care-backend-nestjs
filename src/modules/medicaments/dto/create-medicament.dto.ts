import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateMedicamentDto {
    @IsString()
    @IsNotEmpty()
    id: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    type: string;

    @IsNumber()
    @IsOptional()
    dosageQuantite?: number;

    @IsString()
    @IsOptional()
    dosageUnite?: string;

    @IsNumber()
    @IsOptional()
    dosagePoids?: number;

    @IsString()
    @IsOptional()
    dosageUnitePoids?: string;

    @IsString()
    @IsOptional()
    dosageNotes?: string;

    @IsString()
    @IsOptional()
    defaultRoute?: string;

    @IsNumber()
    @IsOptional()
    withdrawalPeriodMeat?: number;

    @IsNumber()
    @IsOptional()
    withdrawalPeriodMilk?: number;

    @IsString()
    @IsOptional()
    dosageRecommandeOld?: string;

    @IsString()
    @IsOptional()
    fabricant?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class UpdateMedicamentDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    type?: string;

    @IsNumber()
    @IsOptional()
    dosageQuantite?: number;

    @IsString()
    @IsOptional()
    dosageUnite?: string;

    @IsNumber()
    @IsOptional()
    dosagePoids?: number;

    @IsString()
    @IsOptional()
    dosageUnitePoids?: string;

    @IsString()
    @IsOptional()
    dosageNotes?: string;

    @IsString()
    @IsOptional()
    defaultRoute?: string;

    @IsNumber()
    @IsOptional()
    withdrawalPeriodMeat?: number;

    @IsNumber()
    @IsOptional()
    withdrawalPeriodMilk?: number;

    @IsString()
    @IsOptional()
    dosageRecommandeOld?: string;

    @IsString()
    @IsOptional()
    fabricant?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}

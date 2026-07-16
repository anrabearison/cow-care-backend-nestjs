import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateMedicamentDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    type?: string;

    @IsNumber()
    @IsOptional()
    dosageQuantity?: number;

    @IsString()
    @IsOptional()
    dosageUnit?: string;

    @IsNumber()
    @IsOptional()
    dosageWeight?: number;

    @IsString()
    @IsOptional()
    dosageWeightUnit?: string;

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
    manufacturer?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}

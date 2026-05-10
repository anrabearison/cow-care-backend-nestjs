import { IsString, IsNotEmpty, IsDate, IsOptional, IsEnum, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TreatmentType, DosageUnit, AdministrationRoute } from '../../../entities/treatment.entity';

class TreatmentDosageDto {
    @ApiProperty()
    @IsNumber()
    quantite: number;

    @ApiProperty({ enum: DosageUnit })
    @IsEnum(DosageUnit)
    unite: DosageUnit;

    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    animalPoids?: number;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    notes?: string;
}

export class CreateTreatmentDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    cattleId: string;

    @ApiProperty({ enum: TreatmentType })
    @IsEnum(TreatmentType)
    type: TreatmentType;

    @ApiProperty()
    @IsDate()
    @Type(() => Date)
    date: Date;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    product: string; // medicament_id

    @ApiProperty()
    @ValidateNested()
    @Type(() => TreatmentDosageDto)
    dosage: TreatmentDosageDto;

    @ApiProperty({ enum: AdministrationRoute, default: AdministrationRoute.IM })
    @IsEnum(AdministrationRoute)
    @IsOptional()
    administrationRoute?: AdministrationRoute;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    veterinarian: string; // veterinarian_id

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    notes?: string;
}

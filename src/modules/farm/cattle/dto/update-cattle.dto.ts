import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsOptional, IsArray, ValidateNested, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateCattleDto } from './create-cattle.dto';

class EventItemDto {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    id?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    type?: string;

    @ApiPropertyOptional()
    @IsOptional()
    date?: Date;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    details?: string;
}

class TreatmentItemDto {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    id?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    type?: string;

    @ApiPropertyOptional()
    @IsOptional()
    date?: Date;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    product?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    veterinarian?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    notes?: string;

    @ApiPropertyOptional()
    @IsOptional()
    dosage?: {
        quantity?: number;
        unit?: string;
        animalWeight?: number;
        notes?: string;
    };
}

export class UpdateCattleDto extends PartialType(CreateCattleDto) {
    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    status?: string;

    @ApiPropertyOptional()
    @IsInt()
    @IsOptional()
    nCarnet?: number;

    @ApiPropertyOptional({ type: [EventItemDto] })
    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => EventItemDto)
    events?: EventItemDto[];

    @ApiPropertyOptional({ type: [TreatmentItemDto] })
    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => TreatmentItemDto)
    treatments?: TreatmentItemDto[];
}

import { IsString, IsOptional } from 'class-validator';

export class UpdateVeterinarianDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    nom?: string;

    @IsString()
    @IsOptional()
    specialite?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    telephone?: string;

    @IsString()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    adresse?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}

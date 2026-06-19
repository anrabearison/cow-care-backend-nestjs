import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateVeterinarianDto {
    @IsString()
    @IsOptional()
    id?: string;

    // Frontend sends "name" or "nom"
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    nom?: string;

    @IsString()
    @IsOptional()
    specialite?: string;

    // Frontend sends "phone" or "telephone"
    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    telephone?: string;

    @IsString()
    @IsOptional()
    email?: string;

    // Frontend sends "address" or "adresse"
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

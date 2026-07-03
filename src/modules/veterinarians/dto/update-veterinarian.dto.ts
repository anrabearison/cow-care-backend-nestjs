import { IsString, IsOptional } from 'class-validator';

export class UpdateVeterinarianDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    specialty?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}

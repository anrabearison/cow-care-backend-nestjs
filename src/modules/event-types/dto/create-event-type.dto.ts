import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateEventTypeDto {
    @IsString()
    @IsNotEmpty()
    id: string;

    @IsString()
    @IsNotEmpty()
    nom: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    icone?: string;
}

export class UpdateEventTypeDto {
    @IsString()
    @IsOptional()
    nom?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    icone?: string;
}

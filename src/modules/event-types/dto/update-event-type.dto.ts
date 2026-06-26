import { IsString, IsOptional } from 'class-validator';

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

import { IsString, IsNumber, IsOptional } from 'class-validator';

export class UpdateHerdBookDto {
    @IsString()
    @IsOptional()
    reference?: string;

    @IsNumber()
    @IsOptional()
    year?: number;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    ownerId?: string;
}

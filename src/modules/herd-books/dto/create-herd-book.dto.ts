import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateHerdBookDto {
    @IsString()
    @IsNotEmpty()
    id: string;

    @IsString()
    @IsNotEmpty()
    reference: string;

    @IsNumber()
    @IsNotEmpty()
    year: number;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsNotEmpty()
    ownerId: string;
}

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

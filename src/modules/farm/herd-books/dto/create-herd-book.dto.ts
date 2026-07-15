import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateHerdBookDto {
    @IsString()
    @IsOptional()
    id?: string;

    @IsString()
    @IsNotEmpty()
    reference: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @IsNotEmpty()
    year: number;

    @IsString()
    @IsNotEmpty()
    ownerId: string;

}

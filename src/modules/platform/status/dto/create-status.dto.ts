import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateStatusDto {
    @IsString()
    @IsNotEmpty()
    id: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;
}

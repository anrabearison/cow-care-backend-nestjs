import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean } from 'class-validator';

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

    @IsString()
    @IsOptional()
    ownerId?: string;

}

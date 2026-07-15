import { IsString, IsOptional } from 'class-validator';

export class UpdateCharacterDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;
}

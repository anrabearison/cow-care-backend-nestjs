import { IsString, IsOptional } from 'class-validator';

export class UpdateStatusDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;
}

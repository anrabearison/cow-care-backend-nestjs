import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateEventTypeDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    icon?: string;
}

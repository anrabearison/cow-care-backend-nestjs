import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '../entities/cattle.entity';

export class RegisterBirthDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    nickname?: string;

    @ApiProperty({ enum: Gender })
    @IsEnum(Gender)
    gender: Gender;

    @ApiProperty()
    @IsDate()
    @Type(() => Date)
    birthDate: Date;

    @ApiPropertyOptional({ description: 'Date de naissance pour l\'événement de naissance' })
    @IsDate()
    @IsOptional()
    @Type(() => Date)
    birthEventDate?: Date;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    category?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    character?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    brand?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    distinctiveSign?: string;
}

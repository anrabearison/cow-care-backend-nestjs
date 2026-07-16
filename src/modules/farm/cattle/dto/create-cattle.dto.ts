import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDate, IsNumber, ValidateNested, IsArray, MaxLength, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '../entities/cattle.entity';

class CattleSourceDto {
    @ApiProperty()
    @IsString()
    @MaxLength(50)
    type: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    @MaxLength(100)
    supplier?: string;

    @ApiProperty({ required: false })
    @IsDate()
    @Type(() => Date)
    @IsOptional()
    purchaseDate?: Date;

    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    purchasePrice?: number;

    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    purchaseWeight?: number;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    @MaxLength(100)
    purchaseHealthStatus?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    @MaxLength(500)
    purchaseNotes?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    @MaxLength(50)
    motherId?: string;
}

export class CattlePhotoDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    url: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    @MaxLength(100)
    publicId?: string;

    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    position?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    isPrimary?: boolean;
}

export class CreateCattleDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    @Matches(/^[a-zA-Z0-9\s\-àâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ]+$/, { message: 'Le nom ne doit contenir que des lettres, chiffres et espaces' })
    name: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    @MaxLength(100)
    @Matches(/^[a-zA-Z0-9\s\-àâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ]*$/, { message: 'Le surnom ne doit contenir que des lettres, chiffres et espaces' })
    nickname?: string;

    @ApiProperty({ enum: Gender })
    @IsEnum(Gender)
    gender: Gender;

    @ApiProperty()
    @IsDate()
    @Type(() => Date)
    birthDate: Date;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    @MaxLength(50)
    character?: string; // character_id

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    @MaxLength(100)
    @Matches(/^[a-zA-Z0-9\s\-àâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ]*$/, { message: 'La marque ne doit contenir que des lettres, chiffres et espaces' })
    brand?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    @MaxLength(200)
    distinctiveSign?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    @MaxLength(500)
    photo?: string;

    @ApiProperty({ required: false, type: [CattlePhotoDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CattlePhotoDto)
    @IsOptional()
    photos?: CattlePhotoDto[];

    @ApiProperty()
    @ValidateNested()
    @Type(() => CattleSourceDto)
    source: CattleSourceDto;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    @MaxLength(50)
    motherId?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    @MaxLength(50)
    fatherId?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    @MaxLength(50)
    ownerId?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    @MaxLength(50)
    herdBookId?: string;

    @ApiProperty({ required: false, type: [Object] })
    @IsArray()
    @IsOptional()
    events?: any[];

    @ApiProperty({ required: false, type: [Object] })
    @IsArray()
    @IsOptional()
    treatments?: any[];
}

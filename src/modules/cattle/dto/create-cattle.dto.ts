import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDate, IsNumber, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Gender, SourceType } from '../entities/cattle.entity';

class CattleSourceDto {
    @ApiProperty()
    @IsString()
    type: string;
}

export class CreateCattleDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ required: false })
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

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    character?: string; // character_id

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    brand?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    distinctiveSign?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    photo?: string;

    @ApiProperty()
    @ValidateNested()
    @Type(() => CattleSourceDto)
    source: CattleSourceDto;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    motherId?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    fatherId?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    category?: string; // For backward compatibility

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    ownerId?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
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

import { IsString, IsNotEmpty, IsDate, IsOptional, MaxLength, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEventDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    cattleId: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    @MaxLength(50)
    eventTypeId?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    @MaxLength(100)
    type?: string;

    @ApiProperty()
    @IsDate()
    @Type(() => Date)
    date: Date;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    description: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    @MaxLength(1000)
    details?: string;
}

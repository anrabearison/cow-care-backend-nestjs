import { IsString, IsNotEmpty, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEventDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    cattleId: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    eventTypeId: string;

    @ApiProperty()
    @IsDate()
    @Type(() => Date)
    date: Date;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    details?: string;
}

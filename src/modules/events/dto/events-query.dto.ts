import { IsString, IsOptional, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class EventsQueryDto {
    @ApiPropertyOptional({ default: 1 })
    @IsInt()
    @Min(1)
    @IsOptional()
    @Type(() => Number)
    page?: number = 1;

    @ApiPropertyOptional({ default: 10 })
    @IsInt()
    @Min(1)
    @IsOptional()
    @Type(() => Number)
    per_page?: number = 10;

    @ApiPropertyOptional({ default: 'date' })
    @IsString()
    @IsOptional()
    sort?: string = 'date';

    @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC' })
    @IsEnum(['ASC', 'DESC'])
    @IsOptional()
    order?: 'ASC' | 'DESC' = 'DESC';

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    cattle_id?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    cattleId?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    event_type_id?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    type?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    q?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    date?: string;

    @ApiPropertyOptional()
    @IsOptional()
    id?: string | string[];

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    owner_id?: string;
}

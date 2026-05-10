import { IsString, IsOptional, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CattleQueryDto {
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

    @ApiPropertyOptional({ default: 'id' })
    @IsString()
    @IsOptional()
    sort?: string = 'id';

    @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'ASC' })
    @IsEnum(['ASC', 'DESC'])
    @IsOptional()
    order?: 'ASC' | 'DESC' = 'ASC';

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    q?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    gender?: string;

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
    source_type?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    owner_id?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    herd_book_id?: string;

    @ApiPropertyOptional()
    @IsOptional()
    id?: string | string[];
}

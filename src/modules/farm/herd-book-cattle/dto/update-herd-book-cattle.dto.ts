import { IsOptional, IsString, IsInt } from 'class-validator';

export class UpdateHerdBookCattleDto {
    @IsOptional()
    @IsInt()
    nCarnet?: number;

    @IsOptional()
    @IsString()
    categoryId?: string;

    @IsOptional()
    @IsString()
    statusId?: string;
}

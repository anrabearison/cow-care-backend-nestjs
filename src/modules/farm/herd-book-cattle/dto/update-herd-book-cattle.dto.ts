import { IsOptional, IsString } from 'class-validator';

export class UpdateHerdBookCattleDto {
    @IsOptional()
    @IsString()
    nCarnet?: string;

    @IsOptional()
    @IsString()
    categoryId?: string;

    @IsOptional()
    @IsString()
    statusId?: string;
}

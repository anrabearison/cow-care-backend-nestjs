import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateHerdBookCattleDto {
    @IsUUID()
    herdBookId: string;

    @IsUUID()
    cattleId: string;

    @IsOptional()
    @IsString()
    nCarnet?: string;

    @IsString()
    categoryId: string;

    @IsString()
    statusId: string = 'STAT001';
}

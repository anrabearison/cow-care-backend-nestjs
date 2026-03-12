import { IsString, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCattleDto } from '../../cattle/dto/create-cattle.dto';

export class CreateHerdBookCattleDto {
    @IsUUID()
    herdBookId: string;

    @IsOptional()
    @IsUUID()
    cattleId?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => CreateCattleDto)
    cattle?: CreateCattleDto;

    @IsOptional()
    @IsString()
    nCarnet?: string;

    @IsString()
    categoryId: string;

    @IsString()
    statusId: string = 'STAT001';
}

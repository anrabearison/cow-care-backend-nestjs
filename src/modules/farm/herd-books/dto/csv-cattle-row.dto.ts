import { IsString, IsNotEmpty, IsOptional, IsInt, IsIn, IsDateString } from 'class-validator';

export class CsvCattleRowDto {
  @IsInt()
  @IsNotEmpty()
  n_carnet: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  nickname?: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['M', 'F'])
  gender: string;

  @IsString()
  @IsNotEmpty()
  @IsDateString()
  birth_date: string;

  @IsString()
  @IsOptional()
  character?: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  distinctive_sign?: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['NE_DANS_TROUPEAU', 'ACHETE'])
  source_type: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  status: string;
}

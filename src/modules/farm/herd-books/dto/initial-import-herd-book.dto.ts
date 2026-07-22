import { IsString, IsNotEmpty, IsOptional, MaxLength, IsInt, Min, Max } from 'class-validator';

export class InitialImportHerdBookDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  reference: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;
}

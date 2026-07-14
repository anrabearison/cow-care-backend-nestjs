import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateVaccineDto {
  @ApiProperty({ example: 'Rabies Vaccine' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Prevents rabies infection', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'PharmaCorp', required: false })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiProperty({ example: 'Administer 2ml intramuscularly', required: false })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

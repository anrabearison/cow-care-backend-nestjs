import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateDiseaseDto {
  @ApiProperty({ example: 'Foot and Mouth Disease' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Viral disease affecting cloven-hoofed animals', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Fever, blisters, lameness', required: false })
  @IsOptional()
  @IsString()
  symptoms?: string;

  @ApiProperty({ example: 'Vaccination, quarantine', required: false })
  @IsOptional()
  @IsString()
  treatment?: string;

  @ApiProperty({ example: 'Regular vaccination, biosecurity measures', required: false })
  @IsOptional()
  @IsString()
  prevention?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

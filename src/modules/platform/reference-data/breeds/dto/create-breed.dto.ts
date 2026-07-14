import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateBreedDto {
  @ApiProperty({ example: 'Holstein' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Dairy cattle breed', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

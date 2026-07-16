import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSupplierDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    contactInfo?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    phone?: string;

    @ApiProperty({ required: false })
    @IsEmail()
    @IsOptional()
    email?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    address?: string;
}

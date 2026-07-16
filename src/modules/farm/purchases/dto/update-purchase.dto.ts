import { IsString, IsOptional, IsDateString, IsNumber, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePurchaseItemDto {
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    id?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    cattleId?: string;

    @ApiProperty({ required: false })
    @IsNumber()
    @Min(0)
    @IsOptional()
    price?: number;

    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    weightAtPurchase?: number;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    healthStatus?: string;
}

export class UpdatePurchaseDto {
    @ApiProperty({ required: false })
    @IsDateString()
    @IsOptional()
    purchaseDate?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    supplierId?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    invoiceNumber?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    healthStatus?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    notes?: string;

    @ApiProperty({ required: false, type: [UpdatePurchaseItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdatePurchaseItemDto)
    @IsOptional()
    items?: UpdatePurchaseItemDto[];
}

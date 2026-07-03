import { IsString, IsNotEmpty, IsOptional, IsDateString, IsNumber, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePurchaseItemDto {
    @ApiProperty({ description: 'ID of the cattle being purchased' })
    @IsString()
    @IsNotEmpty()
    cattleId: string;

    @ApiProperty({ description: 'Purchase price for this animal' })
    @IsNumber()
    @Min(0)
    price: number;

    @ApiProperty({ required: false, description: 'Weight of animal at purchase (kg)' })
    @IsNumber()
    @IsOptional()
    weightAtPurchase?: number;

    @ApiProperty({ required: false, description: 'Health status at purchase' })
    @IsString()
    @IsOptional()
    healthStatus?: string;
}

export class CreatePurchaseDto {
    @ApiProperty({ description: 'Owner ID' })
    @IsString()
    @IsNotEmpty()
    ownerId: string;

    @ApiProperty({ description: 'Date of purchase (YYYY-MM-DD)' })
    @IsDateString()
    purchaseDate: string;

    @ApiProperty({ required: false, description: 'Supplier ID (if known)' })
    @IsString()
    @IsOptional()
    supplierId?: string;

    @ApiProperty({ required: false, description: 'Invoice number' })
    @IsString()
    @IsOptional()
    invoiceNumber?: string;

    @ApiProperty({ required: false, description: 'General health status note' })
    @IsString()
    @IsOptional()
    healthStatus?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    notes?: string;

    @ApiProperty({ type: [CreatePurchaseItemDto], description: 'List of purchased cattle items' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreatePurchaseItemDto)
    items: CreatePurchaseItemDto[];
}

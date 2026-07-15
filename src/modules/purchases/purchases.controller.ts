import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SuppliersService } from './suppliers.service';

@ApiTags('Farm - Purchases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('farm/purchases')
export class PurchasesController {
    constructor(private readonly purchasesService: PurchasesService) {}

    // ─── Purchases ──────────────────────────────────────────────────────────────

    @Get()
    @ApiOperation({ summary: 'List all purchases for the current owner' })
    findAll(@Query() query: any, @Request() req: any) {
        return this.purchasesService.findAllPurchases(query, req.user);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a purchase by ID' })
    findOne(@Param('id') id: string, @Request() req: any) {
        return this.purchasesService.findOnePurchase(id, req.user);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new purchase' })
    @ApiResponse({ status: 201, description: 'Purchase created' })
    create(@Body() dto: CreatePurchaseDto, @Request() req: any) {
        return this.purchasesService.createPurchase(dto, req.user);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a purchase' })
    update(@Param('id') id: string, @Body() dto: UpdatePurchaseDto, @Request() req: any) {
        return this.purchasesService.updatePurchase(id, dto, req.user);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a purchase' })
    remove(@Param('id') id: string, @Request() req: any) {
        return this.purchasesService.removePurchase(id, req.user);
    }
}

@ApiTags('Farm - Suppliers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('farm/suppliers')
export class SuppliersController {
    constructor(private readonly suppliersService: SuppliersService) {}

    @Get()
    @ApiOperation({ summary: 'List all suppliers' })
    findAll(@Query() query: any, @Request() req: any) {
        return this.suppliersService.findAllSuppliers(query, req.user);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a supplier by ID' })
    findOne(@Param('id') id: string, @Request() req: any) {
        return this.suppliersService.findOneSupplier(id, req.user);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new supplier' })
    @ApiResponse({ status: 201, description: 'Supplier created' })
    create(@Body() dto: CreateSupplierDto, @Request() req: any) {
        return this.suppliersService.createSupplier(dto, req.user);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a supplier' })
    update(@Param('id') id: string, @Body() dto: UpdateSupplierDto, @Request() req: any) {
        return this.suppliersService.updateSupplier(id, dto, req.user);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a supplier' })
    remove(@Param('id') id: string, @Request() req: any) {
        return this.suppliersService.removeSupplier(id, req.user);
    }
}

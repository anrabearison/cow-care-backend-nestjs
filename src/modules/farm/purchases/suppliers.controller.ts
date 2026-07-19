import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../platform/users/entities/user.entity';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SkipCsrf } from '../../auth/decorators/skip-csrf.decorator';

@ApiTags('Suppliers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER_ADMIN)
@Controller('suppliers')
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

    @SkipCsrf()
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

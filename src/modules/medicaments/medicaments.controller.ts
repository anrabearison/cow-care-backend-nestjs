import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MedicamentsService } from './medicaments.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Farm - Medicaments')
@Controller('farm/medicaments')
@UseGuards(JwtAuthGuard)
export class MedicamentsController {
    constructor(private readonly medicamentsService: MedicamentsService) { }

    @Get()
    @ApiOperation({ summary: 'List all medicaments (read-only)' })
    async findAll(@Query() query) {
        return await this.medicamentsService.findAll(query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a medicament by ID (read-only)' })
    findOne(@Param('id') id: string) {
        return this.medicamentsService.findOne(id);
    }
}

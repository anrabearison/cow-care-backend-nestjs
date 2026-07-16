import { Controller, Get, Post, Body, Put, Param, Delete, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { MedicamentsService } from './medicaments.service';
import { CreateMedicamentDto } from './dto/create-medicament.dto';
import { UpdateMedicamentDto } from './dto/update-medicament.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkipCsrf } from '../../auth/decorators/skip-csrf.decorator';

@ApiTags('medicaments')
@Controller('medicaments')
export class MedicamentsController {
    constructor(private readonly medicamentsService: MedicamentsService) { }

    @Get()
    async findAll(@Query() query) {
        return await this.medicamentsService.findAll(query);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.medicamentsService.findOne(id);
    }

    @SkipCsrf()
    @Post()
    @Throttle({ default: { limit: 20, ttl: 3600000 } }) // 20 médicaments/heure par IP
    @ApiOperation({ summary: 'Create a new medicament' })
    @ApiResponse({ status: 429, description: 'Too many insertions, please try again later' })
    create(@Body() createMedicamentDto: CreateMedicamentDto) {
        return this.medicamentsService.create(createMedicamentDto);
    }

    @Put(':id')
    @Throttle({ default: { limit: 50, ttl: 3600000 } }) // 50 mises à jour/heure par IP
    @ApiOperation({ summary: 'Update a medicament' })
    @ApiResponse({ status: 429, description: 'Too many updates, please try again later' })
    update(@Param('id') id: string, @Body() updateMedicamentDto: UpdateMedicamentDto) {
        return this.medicamentsService.update(id, updateMedicamentDto);
    }

    @Delete(':id')
    @Throttle({ default: { limit: 10, ttl: 3600000 } }) // 10 suppressions/heure par IP
    @ApiOperation({ summary: 'Delete a medicament' })
    @ApiResponse({ status: 429, description: 'Too many deletions, please try again later' })
    remove(@Param('id') id: string) {
        return this.medicamentsService.remove(id);
    }
}

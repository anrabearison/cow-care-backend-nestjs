import { Controller, Get, Post, Body, Put, Param, Delete, Query } from '@nestjs/common';
import { MedicamentsService } from './medicaments.service';
import { CreateMedicamentDto } from './dto/create-medicament.dto';
import { UpdateMedicamentDto } from './dto/update-medicament.dto';

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

    @Post()
    create(@Body() createMedicamentDto: CreateMedicamentDto) {
        return this.medicamentsService.create(createMedicamentDto);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() updateMedicamentDto: UpdateMedicamentDto) {
        return this.medicamentsService.update(id, updateMedicamentDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.medicamentsService.remove(id);
    }
}

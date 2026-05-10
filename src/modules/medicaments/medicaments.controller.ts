import { Controller, Get, Post, Body, Put, Param, Delete, Res, Query } from '@nestjs/common';
import { MedicamentsService } from './medicaments.service';
import { CreateMedicamentDto, UpdateMedicamentDto } from './dto/create-medicament.dto';
import { Response } from 'express';

@Controller('medicaments')
export class MedicamentsController {
    constructor(private readonly medicamentsService: MedicamentsService) { }

    @Get()
    async findAll(@Query() query, @Res({ passthrough: true }) res: Response) {
        const result = await this.medicamentsService.findAll(query);

        res.set('X-Total-Count', result.total.toString());
        res.set('Access-Control-Expose-Headers', 'X-Total-Count');

        return result.data;
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

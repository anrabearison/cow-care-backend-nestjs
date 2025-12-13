import { Controller, Get, Post, Body, Put, Param, Delete, Res } from '@nestjs/common';
import { MedicamentsService } from './medicaments.service';
import { CreateMedicamentDto, UpdateMedicamentDto } from './dto/create-medicament.dto';
import { Response } from 'express';

@Controller('api/v1/medicaments')
export class MedicamentsController {
    constructor(private readonly medicamentsService: MedicamentsService) { }

    @Get()
    async findAll(@Res() res: Response) {
        const medicaments = await this.medicamentsService.findAll();
        res.set('X-Total-Count', medicaments.length.toString());
        res.set('Access-Control-Expose-Headers', 'X-Total-Count');
        return res.json(medicaments);
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

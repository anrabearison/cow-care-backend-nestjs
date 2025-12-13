import { Controller, Get, Post, Body, Put, Param, Delete, Res } from '@nestjs/common';
import { VeterinariansService } from './veterinarians.service';
import { CreateVeterinarianDto, UpdateVeterinarianDto } from './dto/create-veterinarian.dto';
import { Response } from 'express';

@Controller('api/v1/veterinarians')
export class VeterinariansController {
    constructor(private readonly veterinariansService: VeterinariansService) { }

    @Get()
    async findAll(@Res() res: Response) {
        const veterinarians = await this.veterinariansService.findAll();
        res.set('X-Total-Count', veterinarians.length.toString());
        res.set('Access-Control-Expose-Headers', 'X-Total-Count');
        return res.json(veterinarians);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.veterinariansService.findOne(id);
    }

    @Post()
    create(@Body() createVeterinarianDto: CreateVeterinarianDto) {
        return this.veterinariansService.create(createVeterinarianDto);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() updateVeterinarianDto: UpdateVeterinarianDto) {
        return this.veterinariansService.update(id, updateVeterinarianDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.veterinariansService.remove(id);
    }
}

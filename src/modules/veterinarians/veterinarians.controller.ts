import { Controller, Get, Post, Body, Put, Param, Delete, Res, Query } from '@nestjs/common';
import { VeterinariansService } from './veterinarians.service';
import { CreateVeterinarianDto, UpdateVeterinarianDto } from './dto/create-veterinarian.dto';
import { Response } from 'express';

@Controller('veterinarians')
export class VeterinariansController {
    constructor(private readonly veterinariansService: VeterinariansService) { }

    @Get()
    async findAll(@Query() query, @Res() res: Response) {
        const result = await this.veterinariansService.findAll(query);

        res.set('Content-Range', `veterinarians ${(result.page - 1) * result.perPage}-${(result.page - 1) * result.perPage + result.data.length}/${result.total}`);
        res.set('X-Total-Count', result.total.toString());
        res.set('Access-Control-Expose-Headers', 'Content-Range, X-Total-Count');

        res.json(result.data);
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

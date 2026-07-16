import { Controller, Get, Post, Body, Put, Param, Delete, Query } from '@nestjs/common';
import { VeterinariansService } from './veterinarians.service';
import { CreateVeterinarianDto } from './dto/create-veterinarian.dto';
import { UpdateVeterinarianDto } from './dto/update-veterinarian.dto';
import { SkipCsrf } from '../auth/decorators/skip-csrf.decorator';

@Controller('veterinarians')
export class VeterinariansController {
    constructor(private readonly veterinariansService: VeterinariansService) { }

    @Get()
    async findAll(@Query() query) {
        return await this.veterinariansService.findAll(query);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.veterinariansService.findOne(id);
    }

    @SkipCsrf()
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

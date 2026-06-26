import { Controller, Get, Post, Body, Put, Param, Delete, Query } from '@nestjs/common';
import { StatusService } from './status.service';
import { CreateStatusDto } from './dto/create-status.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Controller('status')
export class StatusController {
    constructor(private readonly statusService: StatusService) { }

    @Get()
    async findAll(@Query() query: any) {
        return await this.statusService.findAll(query || {});
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.statusService.findOne(id);
    }

    @Post()
    create(@Body() createStatusDto: CreateStatusDto) {
        return this.statusService.create(createStatusDto);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() updateStatusDto: UpdateStatusDto) {
        return this.statusService.update(id, updateStatusDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.statusService.remove(id);
    }
}

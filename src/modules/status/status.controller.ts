import { Controller, Get, Post, Body, Put, Param, Delete, Res } from '@nestjs/common';
import { StatusService } from './status.service';
import { CreateStatusDto, UpdateStatusDto } from './dto/create-status.dto';
import { Response } from 'express';

@Controller('api/v1/status')
export class StatusController {
    constructor(private readonly statusService: StatusService) { }

    @Get()
    async findAll(@Res() res: Response) {
        const status = await this.statusService.findAll();
        res.set('X-Total-Count', status.length.toString());
        res.set('Access-Control-Expose-Headers', 'X-Total-Count');
        return res.json(status);
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

import { Controller, Get, Post, Body, Put, Param, Delete, Res, Query } from '@nestjs/common';
import { EventTypesService } from './event-types.service';
import { CreateEventTypeDto, UpdateEventTypeDto } from './dto/create-event-type.dto';
import { Response } from 'express';

@Controller('event-types')
export class EventTypesController {
    constructor(private readonly eventTypesService: EventTypesService) { }

    @Get()
    async findAll(@Query() query: any, @Res({ passthrough: true }) res: Response) {
        const result = await this.eventTypesService.findAll(query || {});
        res.set('X-Total-Count', result.total.toString());
        res.set('Access-Control-Expose-Headers', 'X-Total-Count');
        return result.data;
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.eventTypesService.findOne(id);
    }

    @Post()
    create(@Body() createEventTypeDto: CreateEventTypeDto) {
        return this.eventTypesService.create(createEventTypeDto);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() updateEventTypeDto: UpdateEventTypeDto) {
        return this.eventTypesService.update(id, updateEventTypeDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.eventTypesService.remove(id);
    }
}

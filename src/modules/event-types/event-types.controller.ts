import { Controller, Get, Post, Body, Put, Param, Delete, Res } from '@nestjs/common';
import { EventTypesService } from './event-types.service';
import { CreateEventTypeDto, UpdateEventTypeDto } from './dto/create-event-type.dto';
import { Response } from 'express';

@Controller('event-types')
export class EventTypesController {
    constructor(private readonly eventTypesService: EventTypesService) { }

    @Get()
    async findAll(@Res() res: Response) {
        const eventTypes = await this.eventTypesService.findAll();
        res.set('X-Total-Count', eventTypes.length.toString());
        res.set('Access-Control-Expose-Headers', 'X-Total-Count');
        return res.json(eventTypes);
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

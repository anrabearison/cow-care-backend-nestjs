import { Controller, Get, Post, Body, Put, Param, Delete, Query } from '@nestjs/common';
import { EventTypesService } from './event-types.service';
import { CreateEventTypeDto } from './dto/create-event-type.dto';
import { UpdateEventTypeDto } from './dto/update-event-type.dto';

@Controller('farm/event-types')
export class EventTypesController {
    constructor(private readonly eventTypesService: EventTypesService) { }

    @Get()
    async findAll(@Query() query: any) {
        return await this.eventTypesService.findAll(query || {});
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

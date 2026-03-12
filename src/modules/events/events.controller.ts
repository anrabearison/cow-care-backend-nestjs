import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards, Res, Req } from '@nestjs/common';
import { Response } from 'express';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('events')
@ApiBearerAuth()
@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
    constructor(private readonly eventsService: EventsService) { }

    @Get()
    @ApiOperation({ summary: 'Get paginated list of events' })
    async findAll(@Query() query, @Res() res: Response, @Req() req) {
        const result = await this.eventsService.findAll(query, req.user);

        res.set('Content-Range', `events ${(result.page - 1) * result.per_page}-${(result.page - 1) * result.per_page + result.data.length}/${result.total}`);
        res.set('X-Total-Count', result.total.toString());
        res.set('Access-Control-Expose-Headers', 'Content-Range, X-Total-Count');

        res.json(result);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a specific event' })
    findOne(@Param('id') id: string, @Req() req) {
        return this.eventsService.findOne(id, req.user);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new event' })
    create(@Body() createEventDto: CreateEventDto, @Req() req) {
        return this.eventsService.create(createEventDto, req.user);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update an event' })
    update(@Param('id') id: string, @Body() updateEventDto: any, @Req() req) {
        return this.eventsService.update(id, updateEventDto, req.user);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete an event' })
    remove(@Param('id') id: string, @Req() req) {
        return this.eventsService.remove(id, req.user);
    }
}

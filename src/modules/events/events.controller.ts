import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards, Res, Req } from '@nestjs/common';
import { Response } from 'express';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { User } from '../../entities/user.entity';
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
    async findAll(@Query() query, @Res({ passthrough: true }) res: Response, @Req() req) {
        const result = await this.eventsService.findAll(query, req.user as User);

        res.set('X-Total-Count', result.total.toString());
        res.set('Access-Control-Expose-Headers', 'X-Total-Count');

        return result;
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a specific event' })
    findOne(@Param('id') id: string, @Req() req) {
        return this.eventsService.findOne(id, req.user as User);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new event' })
    create(@Body() createEventDto: CreateEventDto, @Req() req) {
        return this.eventsService.create(createEventDto, req.user as User);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update an event' })
    update(@Param('id') id: string, @Body() updateEventDto: any, @Req() req) {
        return this.eventsService.update(id, updateEventDto, req.user as User);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete an event' })
    remove(@Param('id') id: string, @Req() req) {
        return this.eventsService.remove(id, req.user as User);
    }
}

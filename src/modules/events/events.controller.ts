import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { User } from '../users/entities/user.entity';
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
    async findAll(@Query() query, @Req() req) {
        return await this.eventsService.findAll(query, req.user as User);
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
    update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto, @Req() req) {
        return this.eventsService.update(id, updateEventDto, req.user as User);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete an event' })
    remove(@Param('id') id: string, @Req() req) {
        return this.eventsService.remove(id, req.user as User);
    }
}

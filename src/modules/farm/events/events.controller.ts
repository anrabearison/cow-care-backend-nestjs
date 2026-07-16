import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { User } from '../../platform/users/entities/user.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../platform/users/entities/user.entity';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

@ApiTags('events')
@ApiBearerAuth()
@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER_ADMIN, UserRole.OWNER_USER)
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
    @Throttle({ default: { limit: 150, ttl: 3600000 } }) // 150 événements/heure par utilisateur
    @ApiOperation({ summary: 'Create a new event' })
    @ApiResponse({ status: 429, description: 'Too many insertions, please try again later' })
    create(@Body() createEventDto: CreateEventDto, @Req() req) {
        return this.eventsService.create(createEventDto, req.user as User);
    }

    @Put(':id')
    @Throttle({ default: { limit: 200, ttl: 3600000 } }) // 200 mises à jour/heure par utilisateur
    @ApiOperation({ summary: 'Update an event' })
    @ApiResponse({ status: 429, description: 'Too many updates, please try again later' })
    update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto, @Req() req) {
        return this.eventsService.update(id, updateEventDto, req.user as User);
    }

    @Delete(':id')
    @Throttle({ default: { limit: 50, ttl: 3600000 } }) // 50 suppressions/heure par utilisateur
    @ApiOperation({ summary: 'Delete an event' })
    @ApiResponse({ status: 429, description: 'Too many deletions, please try again later' })
    remove(@Param('id') id: string, @Req() req) {
        return this.eventsService.remove(id, req.user as User);
    }
}

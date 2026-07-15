import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EventTypesService } from './event-types.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Farm - Event Types')
@Controller('farm/event-types')
@UseGuards(JwtAuthGuard)
export class EventTypesController {
    constructor(private readonly eventTypesService: EventTypesService) { }

    @Get()
    @ApiOperation({ summary: 'List all event types (read-only)' })
    async findAll(@Query() query: any) {
        return await this.eventTypesService.findAll(query || {});
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get an event type by ID (read-only)' })
    findOne(@Param('id') id: string) {
        return this.eventTypesService.findOne(id);
    }
}

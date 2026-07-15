import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../rbac/guards/permissions.guard';
import { RequirePermissions } from '../../../rbac/decorators/require-permissions.decorator';
import { PlatformPermissions } from '../../../rbac/constants/permissions.constant';
import { EventTypesService } from './event-types.service';
import { CreateEventTypeDto } from '../../../event-types/dto/create-event-type.dto';
import { UpdateEventTypeDto } from '../../../event-types/dto/update-event-type.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Platform - Reference Data - Event Types')
@Controller('platform/reference-data/event-types')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EventTypesController {
  constructor(private readonly eventTypesService: EventTypesService) {}

  @Get()
  @RequirePermissions(PlatformPermissions.PLATFORM_REFERENCE_READ)
  async findAll(@Query() query: any) {
    return await this.eventTypesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(PlatformPermissions.PLATFORM_REFERENCE_READ)
  findOne(@Param('id') id: string) {
    return this.eventTypesService.findOne(id);
  }

  @Post()
  @RequirePermissions(PlatformPermissions.PLATFORM_REFERENCE_WRITE)
  @ApiOperation({ summary: 'Create a new event type' })
  create(@Body() createEventTypeDto: CreateEventTypeDto) {
    return this.eventTypesService.create(createEventTypeDto);
  }

  @Put(':id')
  @RequirePermissions(PlatformPermissions.PLATFORM_REFERENCE_WRITE)
  @ApiOperation({ summary: 'Update an event type' })
  update(@Param('id') id: string, @Body() updateEventTypeDto: UpdateEventTypeDto) {
    return this.eventTypesService.update(id, updateEventTypeDto);
  }

  @Delete(':id')
  @RequirePermissions(PlatformPermissions.PLATFORM_REFERENCE_WRITE)
  @ApiOperation({ summary: 'Delete an event type' })
  remove(@Param('id') id: string) {
    return this.eventTypesService.remove(id);
  }
}

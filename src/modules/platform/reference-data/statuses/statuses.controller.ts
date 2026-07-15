import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../rbac/guards/permissions.guard';
import { RequirePermissions } from '../../../rbac/decorators/require-permissions.decorator';
import { PlatformPermissions } from '../../../rbac/constants/permissions.constant';
import { StatusesService } from './statuses.service';
import { CreateStatusDto } from '../../../status/dto/create-status.dto';
import { UpdateStatusDto } from '../../../status/dto/update-status.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Platform - Reference Data - Statuses')
@Controller('platform/reference-data/statuses')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StatusesController {
  constructor(private readonly statusesService: StatusesService) {}

  @Get()
  @RequirePermissions(PlatformPermissions.PLATFORM_REFERENCE_READ)
  async findAll(@Query() query: any) {
    return await this.statusesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(PlatformPermissions.PLATFORM_REFERENCE_READ)
  findOne(@Param('id') id: string) {
    return this.statusesService.findOne(id);
  }

  @Post()
  @RequirePermissions(PlatformPermissions.PLATFORM_REFERENCE_WRITE)
  @ApiOperation({ summary: 'Create a new status' })
  create(@Body() createStatusDto: CreateStatusDto) {
    return this.statusesService.create(createStatusDto);
  }

  @Put(':id')
  @RequirePermissions(PlatformPermissions.PLATFORM_REFERENCE_WRITE)
  @ApiOperation({ summary: 'Update a status' })
  update(@Param('id') id: string, @Body() updateStatusDto: UpdateStatusDto) {
    return this.statusesService.update(id, updateStatusDto);
  }

  @Delete(':id')
  @RequirePermissions(PlatformPermissions.PLATFORM_REFERENCE_WRITE)
  @ApiOperation({ summary: 'Delete a status' })
  remove(@Param('id') id: string) {
    return this.statusesService.remove(id);
  }
}

import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../rbac/guards/permissions.guard';
import { RequirePermissions } from '../../../rbac/decorators/require-permissions.decorator';
import { PlatformPermissions } from '../../../rbac/constants/permissions.constant';
import { MedicamentsService } from './medicaments.service';
import { CreateMedicamentDto } from '../../../medicaments/dto/create-medicament.dto';
import { UpdateMedicamentDto } from '../../../medicaments/dto/update-medicament.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Platform - Reference Data - Medicaments')
@Controller('platform/reference-data/medicaments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MedicamentsController {
  constructor(private readonly medicamentsService: MedicamentsService) {}

  @Get()
  @RequirePermissions(PlatformPermissions.PLATFORM_REFERENCE_READ)
  async findAll(@Query() query: any) {
    return await this.medicamentsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(PlatformPermissions.PLATFORM_REFERENCE_READ)
  findOne(@Param('id') id: string) {
    return this.medicamentsService.findOne(id);
  }

  @Post()
  @RequirePermissions(PlatformPermissions.PLATFORM_REFERENCE_WRITE)
  @ApiOperation({ summary: 'Create a new medicament' })
  create(@Body() createMedicamentDto: CreateMedicamentDto) {
    return this.medicamentsService.create(createMedicamentDto);
  }

  @Put(':id')
  @RequirePermissions(PlatformPermissions.PLATFORM_REFERENCE_WRITE)
  @ApiOperation({ summary: 'Update a medicament' })
  update(@Param('id') id: string, @Body() updateMedicamentDto: UpdateMedicamentDto) {
    return this.medicamentsService.update(id, updateMedicamentDto);
  }

  @Delete(':id')
  @RequirePermissions(PlatformPermissions.PLATFORM_REFERENCE_WRITE)
  @ApiOperation({ summary: 'Delete a medicament' })
  remove(@Param('id') id: string) {
    return this.medicamentsService.remove(id);
  }
}

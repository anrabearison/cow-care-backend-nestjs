import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { ReferenceDataService } from './reference-data.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Platform - Reference Data')
@Controller('platform/reference-data')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReferenceDataController {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  @Get()
  async getAllReferenceData() {
    return this.referenceDataService.getAllReferenceData();
  }
}

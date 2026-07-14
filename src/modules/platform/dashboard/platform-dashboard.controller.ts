import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { PlatformDashboardService } from './platform-dashboard.service';

@Controller('platform/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlatformDashboardController {
  constructor(private readonly platformDashboardService: PlatformDashboardService) {}

  @Get()
  async getPlatformStats() {
    return this.platformDashboardService.getPlatformStats();
  }
}

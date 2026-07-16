import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../auth/guards/super-admin.guard';
import { PlatformDashboardService } from './platform-dashboard.service';
import { PlatformDashboardStatsDto } from './dto/platform-dashboard-stats.dto';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@ApiBearerAuth()
export class PlatformDashboardController {
    constructor(private readonly platformDashboardService: PlatformDashboardService) {}

    @Get('stats/platform')
    @ApiOperation({ summary: 'Get platform-wide statistics (SUPER_ADMIN only)' })
    @ApiResponse({ 
        status: 200, 
        description: 'Platform statistics retrieved successfully',
        type: PlatformDashboardStatsDto 
    })
    @ApiResponse({ 
        status: 403, 
        description: 'Forbidden - SUPER_ADMIN access required' 
    })
    async getPlatformStats() {
        return this.platformDashboardService.getPlatformStats();
    }
}

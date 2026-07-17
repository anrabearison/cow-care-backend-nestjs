import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OwnerGuard } from '../auth/guards/owner.guard';
import { DashboardService } from './dashboard.service';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, OwnerGuard)
@ApiBearerAuth()
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) {}

    @Get('stats')
    @ApiOperation({ summary: 'Get business dashboard statistics (OWNER_ADMIN and OWNER_USER only)' })
    @ApiResponse({ 
        status: 200, 
        description: 'Business statistics retrieved successfully',
        type: DashboardStatsDto 
    })
    @ApiResponse({ 
        status: 403, 
        description: 'Forbidden - OWNER access required' 
    })
    async getStats(@Request() req) {
        return this.dashboardService.getDashboardStats(req.user);
    }
}

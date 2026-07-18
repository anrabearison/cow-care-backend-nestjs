import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../platform/users/entities/user.entity';
import { DashboardService } from './dashboard.service';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER_ADMIN, UserRole.OWNER_USER)
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

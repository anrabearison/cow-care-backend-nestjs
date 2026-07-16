import { ApiProperty } from '@nestjs/swagger';

export class PlatformDashboardStatsDto {
    @ApiProperty({ description: 'Total number of owners on the platform', example: 8 })
    totalOwners: number;

    @ApiProperty({ description: 'Total number of users on the platform', example: 25 })
    totalUsers: number;

    @ApiProperty({ description: 'Total number of pending invitations', example: 3 })
    totalPendingInvitations: number;
}

import { ApiProperty } from '@nestjs/swagger';

export class DashboardStatsDto {
    @ApiProperty({ description: 'Total number of cattle', example: 150 })
    totalCattle: number;

    @ApiProperty({ description: 'Number of healthy cattle', example: 145 })
    healthyCattle: number;

    @ApiProperty({ description: 'Health percentage', example: 96.67 })
    healthPercentage: number;

    @ApiProperty({ description: 'Total number of events', example: 320 })
    totalEvents: number;

    @ApiProperty({ description: 'Total number of treatments', example: 85 })
    totalTreatments: number;

    @ApiProperty({ description: 'Total number of users', example: 25 })
    totalUsers: number;

    @ApiProperty({ description: 'Total number of owners', example: 8 })
    totalOwners: number;

    @ApiProperty({ description: 'Number of male cattle', example: 60 })
    males: number;

    @ApiProperty({ description: 'Number of female cattle', example: 90 })
    females: number;
}

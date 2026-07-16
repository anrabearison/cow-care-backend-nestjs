import { Test, TestingModule } from '@nestjs/testing';
import { PlatformDashboardController } from './platform-dashboard.controller';
import { PlatformDashboardService } from './platform-dashboard.service';
import { SuperAdminGuard } from '../../auth/guards/super-admin.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ForbiddenException } from '@nestjs/common';
import { PlatformDashboardStatsDto } from './dto/platform-dashboard-stats.dto';

describe('PlatformDashboardController', () => {
  let controller: PlatformDashboardController;
  let platformDashboardService: jest.Mocked<PlatformDashboardService>;

  beforeEach(async () => {
    platformDashboardService = {
      getPlatformStats: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlatformDashboardController],
      providers: [
        { provide: PlatformDashboardService, useValue: platformDashboardService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(SuperAdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PlatformDashboardController>(PlatformDashboardController);
  });

  describe('getPlatformStats', () => {
    const mockPlatformStats: PlatformDashboardStatsDto = {
      totalOwners: 8,
      totalUsers: 25,
      totalPendingInvitations: 3,
    };

    it('✓ should return platform statistics for SUPER_ADMIN', async () => {
      platformDashboardService.getPlatformStats.mockResolvedValue(mockPlatformStats);

      const result = await controller.getPlatformStats();

      expect(platformDashboardService.getPlatformStats).toHaveBeenCalled();
      expect(result).toEqual(mockPlatformStats);
      expect(result.totalOwners).toBe(8);
      expect(result.totalUsers).toBe(25);
      expect(result.totalPendingInvitations).toBe(3);
    });

    it('✓ should return zero counts when platform is empty', async () => {
      const emptyStats: PlatformDashboardStatsDto = {
        totalOwners: 0,
        totalUsers: 0,
        totalPendingInvitations: 0,
      };

      platformDashboardService.getPlatformStats.mockResolvedValue(emptyStats);

      const result = await controller.getPlatformStats();

      expect(result).toEqual(emptyStats);
    });
  });

  describe('Guards', () => {
    it('✓ should be protected by JwtAuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', PlatformDashboardController);
      expect(guards).toBeDefined();
    });

    it('✓ should be protected by SuperAdminGuard', () => {
      const guards = Reflect.getMetadata('__guards__', PlatformDashboardController);
      expect(guards).toBeDefined();
    });
  });
});

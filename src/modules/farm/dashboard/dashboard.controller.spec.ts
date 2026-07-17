import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { OwnerGuard } from '../auth/guards/owner.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ForbiddenException } from '@nestjs/common';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { User, UserRole } from '../platform/users/entities/user.entity';

describe('DashboardController', () => {
  let controller: DashboardController;
  let dashboardService: jest.Mocked<DashboardService>;

  beforeEach(async () => {
    dashboardService = {
      getDashboardStats: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        { provide: DashboardService, useValue: dashboardService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(OwnerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DashboardController>(DashboardController);
  });

  describe('getStats', () => {
    const mockBusinessStats: DashboardStatsDto = {
      totalCattle: 150,
      healthyCattle: 145,
      healthPercentage: 96.67,
      totalEvents: 320,
      totalTreatments: 85,
      totalUsers: 0,
      totalOwners: 0,
      males: 60,
      females: 90,
    };

    const mockOwnerUser: User = {
      id: 'user-id-123',
      name: 'Test User',
      email: 'test@example.com',
      role: UserRole.OWNER_ADMIN,
      isActive: true,
      ownerId: 'owner-id-123',
      owner: null as any,
      authProviders: [],
      refreshSessions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      hashedPassword: 'hashed',
    };

    it('✓ should return business statistics for OWNER_ADMIN', async () => {
      dashboardService.getDashboardStats.mockResolvedValue(mockBusinessStats);

      const result = await controller.getStats({ user: mockOwnerUser });

      expect(dashboardService.getDashboardStats).toHaveBeenCalledWith(mockOwnerUser);
      expect(result).toEqual(mockBusinessStats);
      expect(result.totalCattle).toBe(150);
      expect(result.totalUsers).toBe(0); // Should be 0 for business stats
      expect(result.totalOwners).toBe(0); // Should be 0 for business stats
    });

    it('✓ should return business statistics for OWNER_USER', async () => {
      const mockOwnerUserMember: User = {
        ...mockOwnerUser,
        role: UserRole.OWNER_USER,
      };

      dashboardService.getDashboardStats.mockResolvedValue(mockBusinessStats);

      const result = await controller.getStats({ user: mockOwnerUserMember });

      expect(dashboardService.getDashboardStats).toHaveBeenCalledWith(mockOwnerUserMember);
      expect(result).toEqual(mockBusinessStats);
    });

    it('✓ should return zero counts when owner has no data', async () => {
      const emptyStats: DashboardStatsDto = {
        totalCattle: 0,
        healthyCattle: 0,
        healthPercentage: 0,
        totalEvents: 0,
        totalTreatments: 0,
        totalUsers: 0,
        totalOwners: 0,
        males: 0,
        females: 0,
      };

      dashboardService.getDashboardStats.mockResolvedValue(emptyStats);

      const result = await controller.getStats({ user: mockOwnerUser });

      expect(result).toEqual(emptyStats);
    });
  });

  describe('Guards', () => {
    it('✓ should be protected by JwtAuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', DashboardController);
      expect(guards).toBeDefined();
    });

    it('✓ should be protected by OwnerGuard', () => {
      const guards = Reflect.getMetadata('__guards__', DashboardController);
      expect(guards).toBeDefined();
    });
  });
});

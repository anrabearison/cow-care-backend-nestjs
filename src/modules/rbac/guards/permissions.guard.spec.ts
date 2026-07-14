import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';
import { PermissionsService } from '../services/permissions.service';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: jest.Mocked<Reflector>;
  let permissionsService: jest.Mocked<PermissionsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: PermissionsService,
          useValue: {
            getUserPermissions: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<PermissionsGuard>(PermissionsGuard);
    reflector = module.get(Reflector);
    permissionsService = module.get(PermissionsService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow access when no permissions are required', async () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);

      const context = createMockExecutionContext();

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(permissionsService.getUserPermissions).not.toHaveBeenCalled();
    });

    it('should allow access when empty permissions array is required', async () => {
      reflector.getAllAndOverride.mockReturnValue([]);

      const context = createMockExecutionContext();

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(permissionsService.getUserPermissions).not.toHaveBeenCalled();
    });

    it('should allow access when user has all required permissions', async () => {
      reflector.getAllAndOverride.mockReturnValue(['FARM_CATTLE_READ', 'FARM_CATTLE_CREATE']);
      permissionsService.getUserPermissions.mockResolvedValue([
        'FARM_CATTLE_READ',
        'FARM_CATTLE_CREATE',
        'FARM_CATTLE_UPDATE',
      ]);

      const context = createMockExecutionContext();

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(permissionsService.getUserPermissions).toHaveBeenCalledWith('user-1');
    });

    it('should deny access when user lacks required permissions', async () => {
      reflector.getAllAndOverride.mockReturnValue(['FARM_CATTLE_READ', 'FARM_CATTLE_CREATE']);
      permissionsService.getUserPermissions.mockResolvedValue(['FARM_CATTLE_READ']);

      const context = createMockExecutionContext();

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      expect(permissionsService.getUserPermissions).toHaveBeenCalledWith('user-1');
    });

    it('should deny access when user is not authenticated', async () => {
      reflector.getAllAndOverride.mockReturnValue(['FARM_CATTLE_READ']);
      const context = createMockExecutionContext({ user: null });

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      expect(permissionsService.getUserPermissions).not.toHaveBeenCalled();
    });

    it('should deny access when user has no id', async () => {
      reflector.getAllAndOverride.mockReturnValue(['FARM_CATTLE_READ']);
      const context = createMockExecutionContext({ user: {} });

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      expect(permissionsService.getUserPermissions).not.toHaveBeenCalled();
    });
  });

  function createMockExecutionContext(requestUser: any = { id: 'user-1' }) {
    return {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: requestUser,
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;
  }
});

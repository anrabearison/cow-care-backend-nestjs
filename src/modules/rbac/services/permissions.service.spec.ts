import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PermissionsService } from './permissions.service';
import { Permission } from '../entities/permission.entity';
import { Role } from '../entities/role.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { UserRole } from '../entities/user-role.entity';
import { Repository } from 'typeorm';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let permissionRepository: jest.Mocked<Repository<Permission>>;
  let roleRepository: jest.Mocked<Repository<Role>>;
  let rolePermissionRepository: jest.Mocked<Repository<RolePermission>>;
  let userRoleRepository: jest.Mocked<Repository<UserRole>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        {
          provide: getRepositoryToken(Permission),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Role),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RolePermission),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserRole),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
    permissionRepository = module.get(getRepositoryToken(Permission));
    roleRepository = module.get(getRepositoryToken(Role));
    rolePermissionRepository = module.get(getRepositoryToken(RolePermission));
    userRoleRepository = module.get(getRepositoryToken(UserRole));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserPermissions', () => {
    it('should return empty array if user has no roles', async () => {
      userRoleRepository.find.mockResolvedValue([]);

      const permissions = await service.getUserPermissions('user-1');

      expect(permissions).toEqual([]);
      expect(userRoleRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        relations: ['role'],
      });
    });

    it('should return user permissions based on roles', async () => {
      const mockUserRoles = [
        { roleId: 'role-1' },
        { roleId: 'role-2' },
      ];
      const mockRolePermissions = [
        { permission: { code: 'FARM_CATTLE_READ', active: true } },
        { permission: { code: 'FARM_CATTLE_CREATE', active: true } },
      ];

      userRoleRepository.find.mockResolvedValue(mockUserRoles as any);
      rolePermissionRepository.createQueryBuilder = jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockRolePermissions as any),
      });

      const permissions = await service.getUserPermissions('user-1');

      expect(permissions).toEqual(['FARM_CATTLE_READ', 'FARM_CATTLE_CREATE']);
    });
  });

  describe('hasPermission', () => {
    it('should return true if user has permission', async () => {
      jest.spyOn(service, 'getUserPermissions').mockResolvedValue(['FARM_CATTLE_READ']);

      const result = await service.hasPermission('user-1', 'FARM_CATTLE_READ');

      expect(result).toBe(true);
    });

    it('should return false if user does not have permission', async () => {
      jest.spyOn(service, 'getUserPermissions').mockResolvedValue(['FARM_CATTLE_READ']);

      const result = await service.hasPermission('user-1', 'FARM_CATTLE_CREATE');

      expect(result).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true if user has all permissions', async () => {
      jest.spyOn(service, 'getUserPermissions').mockResolvedValue([
        'FARM_CATTLE_READ',
        'FARM_CATTLE_CREATE',
      ]);

      const result = await service.hasAllPermissions('user-1', [
        'FARM_CATTLE_READ',
        'FARM_CATTLE_CREATE',
      ]);

      expect(result).toBe(true);
    });

    it('should return false if user is missing some permissions', async () => {
      jest.spyOn(service, 'getUserPermissions').mockResolvedValue(['FARM_CATTLE_READ']);

      const result = await service.hasAllPermissions('user-1', [
        'FARM_CATTLE_READ',
        'FARM_CATTLE_CREATE',
      ]);

      expect(result).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true if user has any of the permissions', async () => {
      jest.spyOn(service, 'getUserPermissions').mockResolvedValue(['FARM_CATTLE_READ']);

      const result = await service.hasAnyPermission('user-1', [
        'FARM_CATTLE_READ',
        'FARM_CATTLE_CREATE',
      ]);

      expect(result).toBe(true);
    });

    it('should return false if user has none of the permissions', async () => {
      jest.spyOn(service, 'getUserPermissions').mockResolvedValue([]);

      const result = await service.hasAnyPermission('user-1', [
        'FARM_CATTLE_READ',
        'FARM_CATTLE_CREATE',
      ]);

      expect(result).toBe(false);
    });
  });

  describe('assignRoleToUser', () => {
    it('should create new user role if not exists', async () => {
      userRoleRepository.findOne.mockResolvedValue(null);
      userRoleRepository.create.mockReturnValue({ userId: 'user-1', roleId: 'role-1' } as any);
      userRoleRepository.save.mockResolvedValue({ id: 'ur-1' } as any);

      const result = await service.assignRoleToUser('user-1', 'role-1');

      expect(userRoleRepository.create).toHaveBeenCalledWith({ userId: 'user-1', roleId: 'role-1' });
      expect(userRoleRepository.save).toHaveBeenCalled();
    });

    it('should return existing user role if already exists', async () => {
      const existing = { id: 'ur-1', userId: 'user-1', roleId: 'role-1' };
      userRoleRepository.findOne.mockResolvedValue(existing as any);

      const result = await service.assignRoleToUser('user-1', 'role-1');

      expect(result).toEqual(existing);
      expect(userRoleRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('removeRoleFromUser', () => {
    it('should remove user role', async () => {
      userRoleRepository.delete.mockResolvedValue({ affected: 1 } as any);

      await service.removeRoleFromUser('user-1', 'role-1');

      expect(userRoleRepository.delete).toHaveBeenCalledWith({ userId: 'user-1', roleId: 'role-1' });
    });
  });
});

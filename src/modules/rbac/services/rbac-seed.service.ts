import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';
import { Role } from '../entities/role.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { PERMISSION_NAMES } from '../constants/permissions.constant';
import { DEFAULT_ROLES } from '../constants/roles.constant';

/**
 * RBAC Seed Service
 * 
 * Initializes default permissions, roles, and role-permission associations
 * This service is idempotent - can be run multiple times without creating duplicates
 */
@Injectable()
export class RbacSeedService {
  private readonly logger = new Logger(RbacSeedService.name);

  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
  ) {}

  /**
   * Seed all RBAC data
   */
  async seedAll(): Promise<void> {
    this.logger.log('Starting RBAC seed...');
    
    await this.seedPermissions();
    await this.seedRoles();
    await this.seedRolePermissions();
    
    this.logger.log('RBAC seed completed successfully');
  }

  /**
   * Seed permissions
   */
  private async seedPermissions(): Promise<void> {
    this.logger.log('Seeding permissions...');
    
    for (const [code, name] of Object.entries(PERMISSION_NAMES)) {
      const domain = code.startsWith('PLATFORM') ? 'PLATFORM' : 'FARM';
      
      let permission = await this.permissionRepository.findOne({
        where: { code },
      });

      if (!permission) {
        permission = this.permissionRepository.create({
          code,
          name,
          description: name,
          domain: domain as 'PLATFORM' | 'FARM',
          active: true,
        });
        await this.permissionRepository.save(permission);
        this.logger.debug(`Created permission: ${code}`);
      }
    }
    
    this.logger.log('Permissions seeded successfully');
  }

  /**
   * Seed roles
   */
  private async seedRoles(): Promise<void> {
    this.logger.log('Seeding roles...');
    
    for (const roleConfig of DEFAULT_ROLES) {
      let role = await this.roleRepository.findOne({
        where: { code: roleConfig.code },
      });

      if (!role) {
        role = this.roleRepository.create({
          code: roleConfig.code,
          name: roleConfig.name,
          description: roleConfig.description,
          domain: roleConfig.domain,
          active: true,
        });
        await this.roleRepository.save(role);
        this.logger.debug(`Created role: ${roleConfig.code}`);
      }
    }
    
    this.logger.log('Roles seeded successfully');
  }

  /**
   * Seed role-permission associations
   */
  private async seedRolePermissions(): Promise<void> {
    this.logger.log('Seeding role-permission associations...');
    
    for (const roleConfig of DEFAULT_ROLES) {
      const role = await this.roleRepository.findOne({
        where: { code: roleConfig.code },
      });

      if (!role) {
        this.logger.warn(`Role not found: ${roleConfig.code}, skipping permissions`);
        continue;
      }

      for (const permissionCode of roleConfig.permissions) {
        const permission = await this.permissionRepository.findOne({
          where: { code: permissionCode },
        });

        if (!permission) {
          this.logger.warn(`Permission not found: ${permissionCode}, skipping association`);
          continue;
        }

        let rolePermission = await this.rolePermissionRepository.findOne({
          where: { roleId: role.id, permissionId: permission.id },
        });

        if (!rolePermission) {
          rolePermission = this.rolePermissionRepository.create({
            roleId: role.id,
            permissionId: permission.id,
          });
          await this.rolePermissionRepository.save(rolePermission);
          this.logger.debug(`Associated permission ${permissionCode} to role ${roleConfig.code}`);
        }
      }
    }
    
    this.logger.log('Role-permission associations seeded successfully');
  }

  /**
   * Clear all RBAC data (useful for testing)
   */
  async clearAll(): Promise<void> {
    this.logger.warn('Clearing all RBAC data...');
    
    await this.rolePermissionRepository.delete({});
    await this.roleRepository.delete({});
    await this.permissionRepository.delete({});
    
    this.logger.warn('RBAC data cleared');
  }
}

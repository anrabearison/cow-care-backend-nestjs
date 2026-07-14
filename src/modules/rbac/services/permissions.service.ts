import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';
import { Role } from '../entities/role.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { UserRole } from '../entities/user-role.entity';

/**
 * PermissionsService
 * 
 * Central service for managing permissions and role-based access control
 */
@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
  ) {}

  /**
   * Get all permissions for a user based on their roles
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    const userRoles = await this.userRoleRepository.find({
      where: { userId },
      relations: ['role'],
    });

    if (userRoles.length === 0) {
      return [];
    }

    const roleIds = userRoles.map(ur => ur.roleId);

    const rolePermissions = await this.rolePermissionRepository
      .createQueryBuilder('rp')
      .leftJoinAndSelect('rp.permission', 'permission')
      .where('rp.roleId IN (:...roleIds)', { roleIds })
      .andWhere('permission.active = :active', { active: true })
      .getMany();

    return rolePermissions.map(rp => rp.permission.code);
  }

  /**
   * Check if a user has a specific permission
   */
  async hasPermission(userId: string, permissionCode: string): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return userPermissions.includes(permissionCode);
  }

  /**
   * Check if a user has all specified permissions
   */
  async hasAllPermissions(userId: string, permissionCodes: string[]): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return permissionCodes.every(code => userPermissions.includes(code));
  }

  /**
   * Check if a user has any of the specified permissions
   */
  async hasAnyPermission(userId: string, permissionCodes: string[]): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return permissionCodes.some(code => userPermissions.includes(code));
  }

  /**
   * Get all permissions in the system
   */
  async getAllPermissions(): Promise<Permission[]> {
    return this.permissionRepository.find({
      order: { domain: 'ASC', code: 'ASC' },
    });
  }

  /**
   * Get permissions by domain
   */
  async getPermissionsByDomain(domain: 'PLATFORM' | 'FARM'): Promise<Permission[]> {
    return this.permissionRepository.find({
      where: { domain },
      order: { code: 'ASC' },
    });
  }

  /**
   * Get all roles
   */
  async getAllRoles(): Promise<Role[]> {
    return this.roleRepository.find({
      order: { domain: 'ASC', code: 'ASC' },
    });
  }

  /**
   * Get roles by domain
   */
  async getRolesByDomain(domain: 'PLATFORM' | 'FARM'): Promise<Role[]> {
    return this.roleRepository.find({
      where: { domain },
      order: { code: 'ASC' },
    });
  }

  /**
   * Get permissions for a specific role
   */
  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const rolePermissions = await this.rolePermissionRepository.find({
      where: { roleId },
      relations: ['permission'],
    });

    return rolePermissions.map(rp => rp.permission);
  }

  /**
   * Assign a role to a user
   */
  async assignRoleToUser(userId: string, roleId: string): Promise<UserRole> {
    // Check if assignment already exists
    const existing = await this.userRoleRepository.findOne({
      where: { userId, roleId },
    });

    if (existing) {
      return existing;
    }

    const userRole = this.userRoleRepository.create({ userId, roleId });
    return this.userRoleRepository.save(userRole);
  }

  /**
   * Remove a role from a user
   */
  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    await this.userRoleRepository.delete({ userId, roleId });
  }

  /**
   * Assign a permission to a role
   */
  async assignPermissionToRole(roleId: string, permissionId: string): Promise<RolePermission> {
    // Check if assignment already exists
    const existing = await this.rolePermissionRepository.findOne({
      where: { roleId, permissionId },
    });

    if (existing) {
      return existing;
    }

    const rolePermission = this.rolePermissionRepository.create({ roleId, permissionId });
    return this.rolePermissionRepository.save(rolePermission);
  }

  /**
   * Remove a permission from a role
   */
  async removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    await this.rolePermissionRepository.delete({ roleId, permissionId });
  }
}

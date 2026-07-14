import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { PermissionsService } from '../services/permissions.service';

/**
 * PermissionsGuard
 * 
 * Checks if the current user has all required permissions for a route
 * 
 * Usage:
 * @UseGuards(JwtAuthGuard, PermissionsGuard)
 * @RequirePermissions('FARM_CATTLE_READ', 'FARM_CATTLE_CREATE')
 * @Get()
 * async findAll() { ... }
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required permissions from decorator metadata
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      REQUIRE_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no permissions are required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Get user from request
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get user permissions
    const userPermissions = await this.permissionsService.getUserPermissions(user.id);

    // Check if userPermissions is valid
    if (!userPermissions) {
      throw new ForbiddenException('Unable to retrieve user permissions');
    }

    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every(permission =>
      userPermissions.includes(permission),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}

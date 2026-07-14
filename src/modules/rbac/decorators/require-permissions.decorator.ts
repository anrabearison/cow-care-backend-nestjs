import { SetMetadata } from '@nestjs/common';

export const REQUIRE_PERMISSIONS_KEY = 'requirePermissions';

/**
 * Decorator to specify required permissions for a route or controller
 * 
 * Usage:
 * @RequirePermissions('FARM_CATTLE_READ', 'FARM_CATTLE_CREATE')
 * @Get()
 * async findAll() { ... }
 * 
 * @RequirePermissions('PLATFORM_USERS_READ')
 * @Controller('users')
 * export class UsersController { ... }
 */
export const RequirePermissions = (...permissions: string[]) => 
  SetMetadata(REQUIRE_PERMISSIONS_KEY, permissions);

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { Role } from './entities/role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { UserRole } from './entities/user-role.entity';
import { PermissionsService } from './services/permissions.service';
import { RbacSeedService } from './services/rbac-seed.service';
import { PermissionsGuard } from './guards/permissions.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Permission,
      Role,
      RolePermission,
      UserRole,
    ]),
  ],
  providers: [
    PermissionsService,
    RbacSeedService,
    PermissionsGuard,
  ],
  exports: [
    PermissionsService,
    RbacSeedService,
    PermissionsGuard,
  ],
})
export class RbacModule {}

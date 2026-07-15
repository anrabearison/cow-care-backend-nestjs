import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../../platform/users/entities/user.entity';

@Injectable()
export class SuperAdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const { user } = context.switchToHttp().getRequest();
        
        if (!user) {
            return false;
        }

        return user.role === UserRole.SUPER_ADMIN;
    }
}

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../../platform/users/entities/user.entity';

@Injectable()
export class OwnerGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const { user } = context.switchToHttp().getRequest();
        
        if (!user) {
            return false;
        }

        // Only OWNER_ADMIN and OWNER_USER can access
        return user.role === UserRole.OWNER_ADMIN || user.role === UserRole.OWNER_USER;
    }
}

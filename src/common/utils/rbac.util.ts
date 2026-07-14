import { ForbiddenException } from '@nestjs/common';
import { User, UserRole } from '../../modules/users/entities/user.entity';

/**
 * Resolves the effective ownerId from the authenticated user and an optional
 * query parameter.
 *
 * - SUPER_ADMIN: can target any owner (or null to see all)
 * - Other roles:  must belong to an owner; query param is ignored
 *
 * @param user             - The authenticated user from the JWT
 * @param requestedOwnerId - Optional ownerId passed via query string
 * @param errorContext     - Human-readable resource name for error messages
 */
export function resolveOwnerIdFromUser(
    user: User,
    requestedOwnerId?: string,
    errorContext = 'resources',
): string | null {
    if (user.role === UserRole.SUPER_ADMIN) {
        return requestedOwnerId ?? null;
    }
    if (!user.ownerId) {
        throw new ForbiddenException(`User must belong to an owner to access ${errorContext}`);
    }
    return user.ownerId;
}

/**
 * Resolves the effective organizationId from the authenticated user and an optional
 * query parameter.
 *
 * - SUPER_ADMIN: can target any organization (or null to see all)
 * - Other roles: use their organizationId if available; null during migration period
 *
 * @param user                 - The authenticated user from the JWT
 * @param requestedOrgId       - Optional organizationId passed via query string
 * @param errorContext         - Human-readable resource name for error messages
 */
export function resolveOrganizationIdFromUser(
    user: User,
    requestedOrgId?: string,
    errorContext = 'resources',
): string | null {
    if (user.role === UserRole.SUPER_ADMIN) {
        return requestedOrgId ?? null;
    }
    // During migration, allow users without organization to proceed
    // This will be enforced in future PRs
    return user.organizationId ?? null;
}

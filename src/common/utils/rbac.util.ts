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
 * Business modules require a valid organizationId. Users without organizationId
 * (including SUPER_ADMIN) cannot access business data.
 *
 * @param user                 - The authenticated user from the JWT
 * @param requestedOrgId       - Optional organizationId passed via query string (ignored)
 * @param errorContext         - Human-readable resource name for error messages
 * @throws ForbiddenException  - If user has no organizationId
 */
export function resolveOrganizationIdFromUser(
    user: User,
    requestedOrgId?: string,
    errorContext = 'resources',
): string {
    // User must have their own organizationId to access business data
    // SUPER_ADMIN with organizationId = null cannot access business modules
    if (!user.organizationId) {
        throw new ForbiddenException(`User must belong to an organization to access ${errorContext}`);
    }
    
    return user.organizationId;
}

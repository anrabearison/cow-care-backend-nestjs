import { ForbiddenException } from '@nestjs/common';
import { User, UserRole } from '../../modules/users/entities/user.entity';
import { resolveOrganizationIdFromUser } from './rbac.util';

describe('resolveOrganizationIdFromUser', () => {
    describe('SUPER_ADMIN without organization', () => {
        it('should throw ForbiddenException when organizationId is null', () => {
            const superAdmin: User = {
                id: 'user-1',
                name: 'Super Admin',
                email: 'super@admin.com',
                role: UserRole.SUPER_ADMIN,
                ownerId: null,
                organizationId: null,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any;

            expect(() => resolveOrganizationIdFromUser(superAdmin, null, 'cattle'))
                .toThrow(ForbiddenException);
            expect(() => resolveOrganizationIdFromUser(superAdmin, null, 'cattle'))
                .toThrow('User must belong to an organization to access cattle');
        });

        it('should throw ForbiddenException even with requestedOrgId when user has no organization', () => {
            const superAdmin: User = {
                id: 'user-1',
                name: 'Super Admin',
                email: 'super@admin.com',
                role: UserRole.SUPER_ADMIN,
                ownerId: null,
                organizationId: null,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any;

            expect(() => resolveOrganizationIdFromUser(superAdmin, 'org-123', 'cattle'))
                .toThrow(ForbiddenException);
        });
    });

    describe('User with organization', () => {
        it('should return organizationId when user has one', () => {
            const user: User = {
                id: 'user-1',
                name: 'Regular User',
                email: 'user@example.com',
                role: UserRole.OWNER_ADMIN,
                ownerId: 'owner-1',
                organizationId: 'org-1',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any;

            const result = resolveOrganizationIdFromUser(user, null, 'cattle');
            expect(result).toBe('org-1');
        });

        it('should throw ForbiddenException when user has no organization', () => {
            const user: User = {
                id: 'user-1',
                name: 'Regular User',
                email: 'user@example.com',
                role: UserRole.OWNER_ADMIN,
                ownerId: 'owner-1',
                organizationId: null,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any;

            expect(() => resolveOrganizationIdFromUser(user, 'org-123', 'cattle'))
                .toThrow(ForbiddenException);
        });

        it('should ignore requestedOrgId and use user organizationId', () => {
            const user: User = {
                id: 'user-1',
                name: 'Regular User',
                email: 'user@example.com',
                role: UserRole.OWNER_ADMIN,
                ownerId: 'owner-1',
                organizationId: 'org-1',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any;

            const result = resolveOrganizationIdFromUser(user, 'org-123', 'cattle');
            expect(result).toBe('org-1');
        });
    });

    describe('Different user roles with organization', () => {
        it('should work for OWNER_ADMIN with organization', () => {
            const user: User = {
                id: 'user-1',
                name: 'Owner Admin',
                email: 'admin@example.com',
                role: UserRole.OWNER_ADMIN,
                ownerId: 'owner-1',
                organizationId: 'org-1',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any;

            const result = resolveOrganizationIdFromUser(user, null, 'purchases');
            expect(result).toBe('org-1');
        });

        it('should work for OWNER_USER with organization', () => {
            const user: User = {
                id: 'user-1',
                name: 'Owner User',
                email: 'user@example.com',
                role: UserRole.OWNER_USER,
                ownerId: 'owner-1',
                organizationId: 'org-1',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any;

            const result = resolveOrganizationIdFromUser(user, null, 'veterinarians');
            expect(result).toBe('org-1');
        });
    });
});

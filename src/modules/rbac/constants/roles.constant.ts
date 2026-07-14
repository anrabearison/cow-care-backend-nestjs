import { PlatformPermissions } from './permissions.constant';
import { FarmPermissions } from './permissions.constant';

/**
 * Default Roles and their Permissions
 * 
 * Platform Roles:
 * - SUPER_ADMIN: Full platform access, no farm access
 * - SUPPORT: Read-only platform access for support
 * - AUDITOR: Read-only audit access
 * 
 * Farm Roles:
 * - OWNER: Full farm access for organization owner
 * - FARM_ADMIN: Full farm management access
 * - VETERINARIAN: Veterinary operations access
 * - EMPLOYEE: Basic farm operations access
 * - VIEWER: Read-only farm access
 */

export enum RoleCode {
  // Platform roles
  SUPER_ADMIN = 'SUPER_ADMIN',
  SUPPORT = 'SUPPORT',
  AUDITOR = 'AUDITOR',

  // Farm roles
  OWNER = 'OWNER',
  FARM_ADMIN = 'FARM_ADMIN',
  VETERINARIAN = 'VETERINARIAN',
  EMPLOYEE = 'EMPLOYEE',
  VIEWER = 'VIEWER',
}

export const DEFAULT_ROLES = [
  {
    code: RoleCode.SUPER_ADMIN,
    name: 'Super Administrator',
    description: 'Full platform administration access',
    domain: 'PLATFORM' as const,
    permissions: [
      // Users
      PlatformPermissions.PLATFORM_USERS_READ,
      PlatformPermissions.PLATFORM_USERS_CREATE,
      PlatformPermissions.PLATFORM_USERS_UPDATE,
      PlatformPermissions.PLATFORM_USERS_DELETE,
      // Organizations
      PlatformPermissions.PLATFORM_ORGANIZATIONS_READ,
      PlatformPermissions.PLATFORM_ORGANIZATIONS_CREATE,
      PlatformPermissions.PLATFORM_ORGANIZATIONS_UPDATE,
      PlatformPermissions.PLATFORM_ORGANIZATIONS_DELETE,
      // Settings
      PlatformPermissions.PLATFORM_SETTINGS_READ,
      PlatformPermissions.PLATFORM_SETTINGS_UPDATE,
      // Audit
      PlatformPermissions.PLATFORM_AUDIT_READ,
      // Reference data
      PlatformPermissions.PLATFORM_REFERENCE_READ,
      PlatformPermissions.PLATFORM_REFERENCE_WRITE,
      // Dashboard
      PlatformPermissions.PLATFORM_DASHBOARD_READ,
      // Invitations
      PlatformPermissions.PLATFORM_INVITATIONS_READ,
      PlatformPermissions.PLATFORM_INVITATIONS_CREATE,
      PlatformPermissions.PLATFORM_INVITATIONS_DELETE,
    ],
  },
  {
    code: RoleCode.SUPPORT,
    name: 'Support Agent',
    description: 'Read-only platform access for support',
    domain: 'PLATFORM' as const,
    permissions: [
      PlatformPermissions.PLATFORM_USERS_READ,
      PlatformPermissions.PLATFORM_ORGANIZATIONS_READ,
      PlatformPermissions.PLATFORM_SETTINGS_READ,
      PlatformPermissions.PLATFORM_REFERENCE_READ,
      PlatformPermissions.PLATFORM_DASHBOARD_READ,
      PlatformPermissions.PLATFORM_INVITATIONS_READ,
    ],
  },
  {
    code: RoleCode.AUDITOR,
    name: 'Auditor',
    description: 'Read-only audit access',
    domain: 'PLATFORM' as const,
    permissions: [
      PlatformPermissions.PLATFORM_AUDIT_READ,
      PlatformPermissions.PLATFORM_ORGANIZATIONS_READ,
      PlatformPermissions.PLATFORM_USERS_READ,
    ],
  },
  {
    code: RoleCode.OWNER,
    name: 'Organization Owner',
    description: 'Full farm access for organization owner',
    domain: 'FARM' as const,
    permissions: [
      // Dashboard
      FarmPermissions.FARM_DASHBOARD_READ,
      // Cattle
      FarmPermissions.FARM_CATTLE_READ,
      FarmPermissions.FARM_CATTLE_CREATE,
      FarmPermissions.FARM_CATTLE_UPDATE,
      FarmPermissions.FARM_CATTLE_DELETE,
      // Events
      FarmPermissions.FARM_EVENTS_READ,
      FarmPermissions.FARM_EVENTS_CREATE,
      FarmPermissions.FARM_EVENTS_UPDATE,
      FarmPermissions.FARM_EVENTS_DELETE,
      // Treatments
      FarmPermissions.FARM_TREATMENTS_READ,
      FarmPermissions.FARM_TREATMENTS_CREATE,
      FarmPermissions.FARM_TREATMENTS_UPDATE,
      FarmPermissions.FARM_TREATMENTS_DELETE,
      // Purchases
      FarmPermissions.FARM_PURCHASES_READ,
      FarmPermissions.FARM_PURCHASES_CREATE,
      FarmPermissions.FARM_PURCHASES_UPDATE,
      FarmPermissions.FARM_PURCHASES_DELETE,
      // Herd books
      FarmPermissions.FARM_HERDBOOK_READ,
      FarmPermissions.FARM_HERDBOOK_CREATE,
      FarmPermissions.FARM_HERDBOOK_UPDATE,
      FarmPermissions.FARM_HERDBOOK_DELETE,
      // Suppliers
      FarmPermissions.FARM_SUPPLIERS_READ,
      FarmPermissions.FARM_SUPPLIERS_CREATE,
      FarmPermissions.FARM_SUPPLIERS_UPDATE,
      FarmPermissions.FARM_SUPPLIERS_DELETE,
      // Veterinarians
      FarmPermissions.FARM_VETERINARIANS_READ,
      FarmPermissions.FARM_VETERINARIANS_CREATE,
      FarmPermissions.FARM_VETERINARIANS_UPDATE,
      FarmPermissions.FARM_VETERINARIANS_DELETE,
    ],
  },
  {
    code: RoleCode.FARM_ADMIN,
    name: 'Farm Administrator',
    description: 'Full farm management access',
    domain: 'FARM' as const,
    permissions: [
      // Dashboard
      FarmPermissions.FARM_DASHBOARD_READ,
      // Cattle
      FarmPermissions.FARM_CATTLE_READ,
      FarmPermissions.FARM_CATTLE_CREATE,
      FarmPermissions.FARM_CATTLE_UPDATE,
      FarmPermissions.FARM_CATTLE_DELETE,
      // Events
      FarmPermissions.FARM_EVENTS_READ,
      FarmPermissions.FARM_EVENTS_CREATE,
      FarmPermissions.FARM_EVENTS_UPDATE,
      FarmPermissions.FARM_EVENTS_DELETE,
      // Treatments
      FarmPermissions.FARM_TREATMENTS_READ,
      FarmPermissions.FARM_TREATMENTS_CREATE,
      FarmPermissions.FARM_TREATMENTS_UPDATE,
      FarmPermissions.FARM_TREATMENTS_DELETE,
      // Purchases
      FarmPermissions.FARM_PURCHASES_READ,
      FarmPermissions.FARM_PURCHASES_CREATE,
      FarmPermissions.FARM_PURCHASES_UPDATE,
      FarmPermissions.FARM_PURCHASES_DELETE,
      // Herd books
      FarmPermissions.FARM_HERDBOOK_READ,
      FarmPermissions.FARM_HERDBOOK_CREATE,
      FarmPermissions.FARM_HERDBOOK_UPDATE,
      FarmPermissions.FARM_HERDBOOK_DELETE,
      // Suppliers
      FarmPermissions.FARM_SUPPLIERS_READ,
      FarmPermissions.FARM_SUPPLIERS_CREATE,
      FarmPermissions.FARM_SUPPLIERS_UPDATE,
      FarmPermissions.FARM_SUPPLIERS_DELETE,
      // Veterinarians
      FarmPermissions.FARM_VETERINARIANS_READ,
      FarmPermissions.FARM_VETERINARIANS_CREATE,
      FarmPermissions.FARM_VETERINARIANS_UPDATE,
      FarmPermissions.FARM_VETERINARIANS_DELETE,
    ],
  },
  {
    code: RoleCode.VETERINARIAN,
    name: 'Veterinarian',
    description: 'Veterinary operations access',
    domain: 'FARM' as const,
    permissions: [
      // Dashboard
      FarmPermissions.FARM_DASHBOARD_READ,
      // Cattle (read only)
      FarmPermissions.FARM_CATTLE_READ,
      // Events
      FarmPermissions.FARM_EVENTS_READ,
      FarmPermissions.FARM_EVENTS_CREATE,
      FarmPermissions.FARM_EVENTS_UPDATE,
      // Treatments
      FarmPermissions.FARM_TREATMENTS_READ,
      FarmPermissions.FARM_TREATMENTS_CREATE,
      FarmPermissions.FARM_TREATMENTS_UPDATE,
      // Purchases (read only)
      FarmPermissions.FARM_PURCHASES_READ,
      // Herd books (read only)
      FarmPermissions.FARM_HERDBOOK_READ,
    ],
  },
  {
    code: RoleCode.EMPLOYEE,
    name: 'Farm Employee',
    description: 'Basic farm operations access',
    domain: 'FARM' as const,
    permissions: [
      // Dashboard
      FarmPermissions.FARM_DASHBOARD_READ,
      // Cattle
      FarmPermissions.FARM_CATTLE_READ,
      FarmPermissions.FARM_CATTLE_CREATE,
      FarmPermissions.FARM_CATTLE_UPDATE,
      // Events
      FarmPermissions.FARM_EVENTS_READ,
      FarmPermissions.FARM_EVENTS_CREATE,
      FarmPermissions.FARM_EVENTS_UPDATE,
      // Treatments
      FarmPermissions.FARM_TREATMENTS_READ,
      FarmPermissions.FARM_TREATMENTS_CREATE,
      FarmPermissions.FARM_TREATMENTS_UPDATE,
      // Purchases (read only)
      FarmPermissions.FARM_PURCHASES_READ,
      // Herd books (read only)
      FarmPermissions.FARM_HERDBOOK_READ,
    ],
  },
  {
    code: RoleCode.VIEWER,
    name: 'Farm Viewer',
    description: 'Read-only farm access',
    domain: 'FARM' as const,
    permissions: [
      // Dashboard
      FarmPermissions.FARM_DASHBOARD_READ,
      // Cattle (read only)
      FarmPermissions.FARM_CATTLE_READ,
      // Events (read only)
      FarmPermissions.FARM_EVENTS_READ,
      // Treatments (read only)
      FarmPermissions.FARM_TREATMENTS_READ,
      // Purchases (read only)
      FarmPermissions.FARM_PURCHASES_READ,
      // Herd books (read only)
      FarmPermissions.FARM_HERDBOOK_READ,
      // Suppliers (read only)
      FarmPermissions.FARM_SUPPLIERS_READ,
      // Veterinarians (read only)
      FarmPermissions.FARM_VETERINARIANS_READ,
    ],
  },
];

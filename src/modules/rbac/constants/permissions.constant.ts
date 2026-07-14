/**
 * Centralized RBAC Permissions
 * 
 * This file defines all permissions in the system, separated by domain.
 * 
 * Platform permissions are for platform administration (SUPER_ADMIN, SUPPORT, AUDITOR)
 * Farm permissions are for farm operations (OWNER, FARM_ADMIN, VETERINARIAN, EMPLOYEE, VIEWER)
 */

export enum PermissionDomain {
  PLATFORM = 'PLATFORM',
  FARM = 'FARM',
}

export enum PlatformPermissions {
  // Users management
  PLATFORM_USERS_READ = 'PLATFORM_USERS_READ',
  PLATFORM_USERS_CREATE = 'PLATFORM_USERS_CREATE',
  PLATFORM_USERS_UPDATE = 'PLATFORM_USERS_UPDATE',
  PLATFORM_USERS_DELETE = 'PLATFORM_USERS_DELETE',

  // Organizations management
  PLATFORM_ORGANIZATIONS_READ = 'PLATFORM_ORGANIZATIONS_READ',
  PLATFORM_ORGANIZATIONS_CREATE = 'PLATFORM_ORGANIZATIONS_CREATE',
  PLATFORM_ORGANIZATIONS_UPDATE = 'PLATFORM_ORGANIZATIONS_UPDATE',
  PLATFORM_ORGANIZATIONS_DELETE = 'PLATFORM_ORGANIZATIONS_DELETE',

  // Settings management
  PLATFORM_SETTINGS_READ = 'PLATFORM_SETTINGS_READ',
  PLATFORM_SETTINGS_UPDATE = 'PLATFORM_SETTINGS_UPDATE',

  // Audit and monitoring
  PLATFORM_AUDIT_READ = 'PLATFORM_AUDIT_READ',

  // Reference data management
  PLATFORM_REFERENCE_READ = 'PLATFORM_REFERENCE_READ',
  PLATFORM_REFERENCE_WRITE = 'PLATFORM_REFERENCE_WRITE',

  // Platform dashboard
  PLATFORM_DASHBOARD_READ = 'PLATFORM_DASHBOARD_READ',

  // Invitations management
  PLATFORM_INVITATIONS_READ = 'PLATFORM_INVITATIONS_READ',
  PLATFORM_INVITATIONS_CREATE = 'PLATFORM_INVITATIONS_CREATE',
  PLATFORM_INVITATIONS_DELETE = 'PLATFORM_INVITATIONS_DELETE',
}

export enum FarmPermissions {
  // Dashboard
  FARM_DASHBOARD_READ = 'FARM_DASHBOARD_READ',

  // Cattle management
  FARM_CATTLE_READ = 'FARM_CATTLE_READ',
  FARM_CATTLE_CREATE = 'FARM_CATTLE_CREATE',
  FARM_CATTLE_UPDATE = 'FARM_CATTLE_UPDATE',
  FARM_CATTLE_DELETE = 'FARM_CATTLE_DELETE',

  // Events management
  FARM_EVENTS_READ = 'FARM_EVENTS_READ',
  FARM_EVENTS_CREATE = 'FARM_EVENTS_CREATE',
  FARM_EVENTS_UPDATE = 'FARM_EVENTS_UPDATE',
  FARM_EVENTS_DELETE = 'FARM_EVENTS_DELETE',

  // Treatments management
  FARM_TREATMENTS_READ = 'FARM_TREATMENTS_READ',
  FARM_TREATMENTS_CREATE = 'FARM_TREATMENTS_CREATE',
  FARM_TREATMENTS_UPDATE = 'FARM_TREATMENTS_UPDATE',
  FARM_TREATMENTS_DELETE = 'FARM_TREATMENTS_DELETE',

  // Purchases management
  FARM_PURCHASES_READ = 'FARM_PURCHASES_READ',
  FARM_PURCHASES_CREATE = 'FARM_PURCHASES_CREATE',
  FARM_PURCHASES_UPDATE = 'FARM_PURCHASES_UPDATE',
  FARM_PURCHASES_DELETE = 'FARM_PURCHASES_DELETE',

  // Herd books management
  FARM_HERDBOOK_READ = 'FARM_HERDBOOK_READ',
  FARM_HERDBOOK_CREATE = 'FARM_HERDBOOK_CREATE',
  FARM_HERDBOOK_UPDATE = 'FARM_HERDBOOK_UPDATE',
  FARM_HERDBOOK_DELETE = 'FARM_HERDBOOK_DELETE',

  // Suppliers management
  FARM_SUPPLIERS_READ = 'FARM_SUPPLIERS_READ',
  FARM_SUPPLIERS_CREATE = 'FARM_SUPPLIERS_CREATE',
  FARM_SUPPLIERS_UPDATE = 'FARM_SUPPLIERS_UPDATE',
  FARM_SUPPLIERS_DELETE = 'FARM_SUPPLIERS_DELETE',

  // Veterinarians management
  FARM_VETERINARIANS_READ = 'FARM_VETERINARIANS_READ',
  FARM_VETERINARIANS_CREATE = 'FARM_VETERINARIANS_CREATE',
  FARM_VETERINARIANS_UPDATE = 'FARM_VETERINARIANS_UPDATE',
  FARM_VETERINARIANS_DELETE = 'FARM_VETERINARIANS_DELETE',
}

export const ALL_PERMISSIONS = {
  PLATFORM: Object.values(PlatformPermissions),
  FARM: Object.values(FarmPermissions),
};

export const PERMISSION_NAMES: Record<string, string> = {
  // Platform permissions
  [PlatformPermissions.PLATFORM_USERS_READ]: 'Read platform users',
  [PlatformPermissions.PLATFORM_USERS_CREATE]: 'Create platform users',
  [PlatformPermissions.PLATFORM_USERS_UPDATE]: 'Update platform users',
  [PlatformPermissions.PLATFORM_USERS_DELETE]: 'Delete platform users',
  [PlatformPermissions.PLATFORM_ORGANIZATIONS_READ]: 'Read organizations',
  [PlatformPermissions.PLATFORM_ORGANIZATIONS_CREATE]: 'Create organizations',
  [PlatformPermissions.PLATFORM_ORGANIZATIONS_UPDATE]: 'Update organizations',
  [PlatformPermissions.PLATFORM_ORGANIZATIONS_DELETE]: 'Delete organizations',
  [PlatformPermissions.PLATFORM_SETTINGS_READ]: 'Read platform settings',
  [PlatformPermissions.PLATFORM_SETTINGS_UPDATE]: 'Update platform settings',
  [PlatformPermissions.PLATFORM_AUDIT_READ]: 'Read audit logs',
  [PlatformPermissions.PLATFORM_REFERENCE_READ]: 'Read reference data',
  [PlatformPermissions.PLATFORM_REFERENCE_WRITE]: 'Write reference data',
  [PlatformPermissions.PLATFORM_DASHBOARD_READ]: 'Read platform dashboard',
  [PlatformPermissions.PLATFORM_INVITATIONS_READ]: 'Read invitations',
  [PlatformPermissions.PLATFORM_INVITATIONS_CREATE]: 'Create invitations',
  [PlatformPermissions.PLATFORM_INVITATIONS_DELETE]: 'Delete invitations',

  // Farm permissions
  [FarmPermissions.FARM_DASHBOARD_READ]: 'Read farm dashboard',
  [FarmPermissions.FARM_CATTLE_READ]: 'Read cattle',
  [FarmPermissions.FARM_CATTLE_CREATE]: 'Create cattle',
  [FarmPermissions.FARM_CATTLE_UPDATE]: 'Update cattle',
  [FarmPermissions.FARM_CATTLE_DELETE]: 'Delete cattle',
  [FarmPermissions.FARM_EVENTS_READ]: 'Read events',
  [FarmPermissions.FARM_EVENTS_CREATE]: 'Create events',
  [FarmPermissions.FARM_EVENTS_UPDATE]: 'Update events',
  [FarmPermissions.FARM_EVENTS_DELETE]: 'Delete events',
  [FarmPermissions.FARM_TREATMENTS_READ]: 'Read treatments',
  [FarmPermissions.FARM_TREATMENTS_CREATE]: 'Create treatments',
  [FarmPermissions.FARM_TREATMENTS_UPDATE]: 'Update treatments',
  [FarmPermissions.FARM_TREATMENTS_DELETE]: 'Delete treatments',
  [FarmPermissions.FARM_PURCHASES_READ]: 'Read purchases',
  [FarmPermissions.FARM_PURCHASES_CREATE]: 'Create purchases',
  [FarmPermissions.FARM_PURCHASES_UPDATE]: 'Update purchases',
  [FarmPermissions.FARM_PURCHASES_DELETE]: 'Delete purchases',
  [FarmPermissions.FARM_HERDBOOK_READ]: 'Read herd books',
  [FarmPermissions.FARM_HERDBOOK_CREATE]: 'Create herd books',
  [FarmPermissions.FARM_HERDBOOK_UPDATE]: 'Update herd books',
  [FarmPermissions.FARM_HERDBOOK_DELETE]: 'Delete herd books',
  [FarmPermissions.FARM_SUPPLIERS_READ]: 'Read suppliers',
  [FarmPermissions.FARM_SUPPLIERS_CREATE]: 'Create suppliers',
  [FarmPermissions.FARM_SUPPLIERS_UPDATE]: 'Update suppliers',
  [FarmPermissions.FARM_SUPPLIERS_DELETE]: 'Delete suppliers',
  [FarmPermissions.FARM_VETERINARIANS_READ]: 'Read veterinarians',
  [FarmPermissions.FARM_VETERINARIANS_CREATE]: 'Create veterinarians',
  [FarmPermissions.FARM_VETERINARIANS_UPDATE]: 'Update veterinarians',
  [FarmPermissions.FARM_VETERINARIANS_DELETE]: 'Delete veterinarians',
};

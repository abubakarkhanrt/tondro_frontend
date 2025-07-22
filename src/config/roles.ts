/**
 * ──────────────────────────────────────────────────
 * File: src/config/roles.ts
 * Description: Defines all user roles and their associated permissions, based on a centralized configuration.
 * Author: Muhammad Abubakar Khan
 * Created: 29-07-2024
 * Last Updated: 29-07-2024
 * ──────────────────────────────────────────────────
 */

// ────────────────────────────────────────
// Permissions Definition
// ────────────────────────────────────────

export const PERMISSIONS = {
  DASHBOARD_READ: 'dashboard:read',
  // From CSV
  ORGANIZATION_CREATE: 'organization:create',
  ORGANIZATION_READ: 'organization:read',
  ORGANIZATION_UPDATE: 'organization:update',
  ORGANIZATION_DELETE: 'organization:delete',
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  SUBSCRIPTION_CREATE: 'subscription:create',
  SUBSCRIPTION_READ: 'subscription:read',
  SUBSCRIPTION_UPDATE: 'subscription:update',
  SUBSCRIPTION_DELETE: 'subscription:delete',
  PRODUCT_CREATE: 'product:create',
  PRODUCT_READ: 'product:read',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',
  DOMAIN_CREATE: 'domain:create',
  DOMAIN_READ: 'domain:read',
  DOMAIN_UPDATE: 'domain:update',
  DOMAIN_DELETE: 'domain:delete',
  AUDIT_READ: 'audit:read',
  TRANSCRIPT_UPLOAD: 'transcript:upload',
  JOB_READ: 'job:read',
} as const;

// This creates a TypeScript type that can only be one of the permission strings.
type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ────────────────────────────────────────
// Roles & Permission Mappings
// ────────────────────────────────────────

const ROLES: Record<string, Permission[]> = {
  // Role ID 1 from CSV
  GLOBAL_ADMIN: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.ORGANIZATION_CREATE,
    PERMISSIONS.ORGANIZATION_READ,
    PERMISSIONS.ORGANIZATION_UPDATE,
    PERMISSIONS.ORGANIZATION_DELETE,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.SUBSCRIPTION_CREATE,
    PERMISSIONS.SUBSCRIPTION_READ,
    PERMISSIONS.SUBSCRIPTION_UPDATE,
    PERMISSIONS.SUBSCRIPTION_DELETE,
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.PRODUCT_UPDATE,
    PERMISSIONS.PRODUCT_DELETE,
    PERMISSIONS.DOMAIN_CREATE,
    PERMISSIONS.DOMAIN_READ,
    PERMISSIONS.DOMAIN_UPDATE,
    PERMISSIONS.DOMAIN_DELETE,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.TRANSCRIPT_UPLOAD,
    PERMISSIONS.JOB_READ,
  ],
  // Role ID 2 from CSV
  TENANT_ADMIN: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.ORGANIZATION_READ,
    PERMISSIONS.ORGANIZATION_UPDATE,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.SUBSCRIPTION_CREATE,
    PERMISSIONS.SUBSCRIPTION_READ,
    PERMISSIONS.SUBSCRIPTION_UPDATE,
    PERMISSIONS.SUBSCRIPTION_DELETE,
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.DOMAIN_CREATE,
    PERMISSIONS.DOMAIN_READ,
    PERMISSIONS.DOMAIN_UPDATE,
    PERMISSIONS.DOMAIN_DELETE,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.JOB_READ,
  ],
};

// ────────────────────────────────────────
// Helper Functions
// ────────────────────────────────────────

/**
 * Gets the permissions for a given role name.
 * @param role - The name of the role (e.g., 'GLOBAL_ADMIN').
 * @returns An array of permission strings. Returns empty array if role is not found.
 */
export const getPermissionsForRole = (role: string): Permission[] => {
  return ROLES[role.toUpperCase()] || [];
};

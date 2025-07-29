/**
 * ──────────────────────────────────────────────────
 * File: src/enums/user.ts
 * Description: Enums related to User properties.
 * Author: Muhammad Abubakar Khan
 * Created: 20-07-2024
 * Last Updated: 20-07-2024
 * ──────────────────────────────────────────────────
 */

export enum UserRole {
  GlobalAdmin = 'global_admin',
  TenantAdmin = 'tenant_admin',
}

export enum UserStatus {
  Active = 'active',
  Inactive = 'inactive',
  Invited = 'invited',
}

/**
 * ──────────────────────────────────────────────────
 * File: client/src/types/index.ts
 * Description: TypeScript type definitions for TondroAI CRM
 * Author: Muhammad Abubakar Khan
 * Created: 18-06-2025
 * Last Updated: 20-06-2025
 * ──────────────────────────────────────────────────
 */

// ────────────────────────────────────────
// API Response Types
// ────────────────────────────────────────

export interface ApiResponse<T = any> {
  data: T;
  total?: number;
  page?: number;
  page_size?: number;
  items?: T[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// ────────────────────────────────────────
// Organization Types
// ────────────────────────────────────────

export interface Domain {
  id: string | number;
  organization_id: string | number;
  domain_name: string;
  name?: string; // For backward compatibility
  parent_domain_id?: string | number | null;
  is_primary: boolean | number;
  status: 'active' | 'inactive' | 'pending';
  ssl_certificate?: string | null;
  dns_settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateDomainRequest {
  organization_id: string;
  name: string;
  parent_domain_id?: string;
  is_primary?: boolean;
}

export interface UpdateDomainRequest {
  name?: string;
  is_primary?: boolean | number;
  status?: 'active' | 'inactive' | 'pending';
}

export interface DomainResponse {
  total: number;
  page: number;
  limit: number;
  domains: Domain[];
}

export interface OrganizationDomainsResponse {
  organization_id: string;
  total_domains: number;
  domains: Domain[];
}

export interface Organization {
  organizationId: string;
  tenantName: string;
  organizationDomain: string;
  status: 'Active' | 'Suspended' | 'Trial' | 'Inactive';
  subscriptionTier: string;
  subscriptions: Subscription[];
  contractAnniversaryDate: string;
  totalUsers: number;
  totalJobs: number;
  usageAgainstLimit: string;
  createdAt: string;
  domains?: Domain[];
}

export interface OrganizationsResponse {
  total: number;
  page: number;
  limit: number;
  organizations: Organization[];
}

// New interface for initial subscription in organization creation
export interface InitialSubscription {
  product_id: string;
  tier: string;
  usage_limit?: number;
  auto_renewal?: boolean;
}

// New interface for product subscription request during organization creation
export interface ProductSubscriptionRequest {
  product_id: string;
  tier_name: string;
  auto_renewal?: boolean;
  ends_at: string; // Contract anniversary date in YYYY-MM-DD format
}

export interface CreateOrganizationRequest {
  tenantName: string;
  organizationDomain: string; // Primary domain (e.g., 'company.com')
  initialAdminEmail: string; // Email for initial admin user
  initialSubscriptions: ProductSubscriptionRequest[]; // Initial product subscriptions
  initialStatus?: 'Active' | 'Inactive' | 'Suspended' | 'Trial'; // Default: "Active"
}

export interface CreateOrganizationResponse {
  organizationId: string;
  tenantName: string;
  adminUserId: string;
  status: string;
}

export interface UpdateOrganizationRequest {
  tenantName?: string;
  organizationDomain?: string;
  status?: 'Active' | 'Suspended' | 'Trial' | 'Inactive';
  contractAnniversaryDate?: string;
}

export interface OrganizationMetrics {
  total_users?: number;
  users_count?: number;
  user_count?: number;
  active_subscriptions?: number;
  subscriptions_count?: number;
  subscription_count?: number;
  error?: string;
}

// ────────────────────────────────────────
// User Roles Types
// ────────────────────────────────────────

export interface UserRoles {
  roles: string[];
}

// ────────────────────────────────────────
// User Types
// ────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'user' | 'viewer' | 'tenant_admin' | 'tenant_support' | 'tenant_user';
  status: 'Active' | 'Inactive' | 'Pending';
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'user' | 'viewer' | 'tenant_admin' | 'tenant_support' | 'tenant_user';
  organization_id: string;
}

export interface UpdateUserRequest {
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: 'admin' | 'user' | 'viewer' | 'tenant_admin' | 'tenant_support' | 'tenant_user';
  status?: 'Active' | 'Inactive' | 'Pending';
  organization_id?: string;
}

// ────────────────────────────────────────
// Subscription Types
// ────────────────────────────────────────

export interface Subscription {
  id: string;
  organization_id: number;
  product_id: string;
  status: 'active' | 'inactive' | 'trial' | 'expired' | 'cancelled' | 'suspended';
  tier_name: string;
  current_usage: number;
  auto_renewal: boolean;
  starts_at: string;
  ends_at: string | null;
  billing_period_start: string;
  billing_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSubscriptionRequest {
  organization_id: number;
  product_id: string;
  tier_name: string;
  auto_renewal: boolean;
  starts_at?: string;
  ends_at?: string | null;
}

export interface UpdateSubscriptionRequest {
  status?: 'active' | 'inactive' | 'trial' | 'expired' | 'cancelled' | 'suspended';
  tier_name?: string;
  auto_renewal?: boolean;
  ends_at?: string | null;
}

export interface SubscriptionStatusRequest {
  status: 'active' | 'inactive' | 'trial' | 'expired' | 'cancelled' | 'suspended';
  reason?: string;
}

export interface UsageEventRequest {
  event_type: string;
  quantity: number;
  metadata?: Record<string, any>;
}

export interface UsageResponse {
  id: string;
  subscription_id: string;
  event_type: string;
  quantity: number;
  metadata: Record<string, any>;
  created_at: string;
}

export interface UsageSummaryResponse {
  total_usage: number;
  usage_percentage?: number;
  events_count: number;
  period_days: number;
}

export interface UsageLimitsResponse {
  within_limits: boolean;
  current_usage: number;
  proposed_usage: number;
  remaining_quota?: number;
}

export interface PaginatedSubscriptionsResponse {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  items: Subscription[];
}

// ────────────────────────────────────────
// Product Types
// ────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  status: 'Active' | 'Inactive';
  created_at: string;
  updated_at: string;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price?: number;
  currency?: string;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  currency?: string;
  status?: 'Active' | 'Inactive';
}

// ────────────────────────────────────────
// Usage Event Types
// ────────────────────────────────────────

export interface UsageEvent {
  id: string;
  organization_id: string;
  user_id: string;
  event_type: string;
  event_data: Record<string, any>;
  timestamp: string;
  created_at: string;
}

export interface CreateUsageEventRequest {
  organization_id: string;
  user_id: string;
  event_type: string;
  event_data: Record<string, any>;
}

// ────────────────────────────────────────
// Audit Log Types
// ────────────────────────────────────────

export interface AuditLog {
  id: string;
  organization_id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: Record<string, any>;
  ip_address: string;
  user_agent: string;
  timestamp: string;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  performed_by: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  created_at: string;
}

// ────────────────────────────────────────
// Filter and Pagination Types
// ────────────────────────────────────────

export interface FilterParams {
  status?: string;
  domain?: string;
  search?: string;
  organization_id?: string;
  user_id?: string;
  product_id?: string;
  event_type?: string;
  action?: string;
  resource_type?: string;
  start_date?: string;
  end_date?: string;
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
  limit?: number;
}

export interface ApiParams extends FilterParams, PaginationParams {}

// ────────────────────────────────────────
// Component Props Types
// ────────────────────────────────────────

export interface DialogProps {
  open: boolean;
  onClose: () => void;
}

export interface CreateDialogProps<T> extends DialogProps {
  onSubmit: (data: T) => Promise<void>;
}

export interface EditDialogProps<T> extends DialogProps {
  item: T;
  onSubmit: (data: Partial<T>) => Promise<void>;
}

export interface ViewDialogProps<T> extends DialogProps {
  item: T;
  onUpdate?: () => void;
}

export interface TableProps<T> {
  data: T[];
  loading: boolean;
  error: string;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  onPageChange: (event: any, newPage: number) => void;
  onPageSizeChange: (event: any) => void;
  onDelete: (id: string) => void;
  onEdit: (item: T) => void;
  onView: (item: T) => void;
}

// ────────────────────────────────────────
// Authentication Types
// ────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  token_type?: string;
  expires_in: number;
  user?: User;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

// ────────────────────────────────────────
// Error Types
// ────────────────────────────────────────

export interface ApiError {
  message: string;
  detail?: string;
  status?: number;
}

// ────────────────────────────────────────
// Utility Types
// ────────────────────────────────────────

export type StatusType = 'Active' | 'Inactive' | 'Pending' | 'Cancelled' | 'Expired';
export type RoleType = 'admin' | 'user' | 'viewer';
export type SeverityType = 'success' | 'error' | 'warning' | 'info';

export interface SnackbarState {
  open: boolean;
  message: string;
  severity: SeverityType;
}

// ────────────────────────────────────────
// Error Messages
// ────────────────────────────────────────

export const ERROR_MESSAGES = {
  // Domain validation errors
  'Organization domain cannot be empty': 'Please provide a valid domain name for the organization',
  'Domain name cannot be empty': 'Domain name is required',
  'Domain already exists': 'This domain is already associated with another organization',
  
  // Subdomain errors
  'Subdomain already exists': 'This subdomain name is already in use',
  'Parent domain not found': 'The parent domain does not exist',
  
  // Organization creation errors
  'Failed to create tenant organization': 'Organization creation failed. Please check your input and try again.'
};

// ──────────────────────────────────────────────────
// End of File: client/src/types/index.ts
// ────────────────────────────────────────────────── 
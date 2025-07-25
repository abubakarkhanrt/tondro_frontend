/**
 * ──────────────────────────────────────────────────
 * File: src/types/index.ts
 * Description: Shared TypeScript types and interfaces for the application.
 * Author: Muhammad Abubakar Khan
 * Created: 18-07-2024
 * Last Updated: 18-07-2024
 * ──────────────────────────────────────────────────
 */

// ────────────────────────────────────────
// API Response Types
// ────────────────────────────────────────

export interface ApiResponse<T = unknown> {
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
  dns_settings?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  user_id?: number | null; // Add this field
}

export interface CreateDomainRequest {
  organization_id: string;
  domain_name: string;
  parent_domain_id?: string;
  is_primary?: boolean;
  user_id?: number | undefined; // Allow undefined
}

export interface UpdateDomainRequest {
  domain_name?: string;
  is_primary?: boolean | number;
  status?: 'active' | 'inactive' | 'pending';
  user_id?: number | undefined; // Add user_id for consistency with CreateDomainRequest
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

// New interface for the updated API response format
export interface OrganizationDomainsArrayResponse extends Array<Domain> {}

export interface Organization {
  // New format fields (required)
  id: number; // Changed from optional to required
  name: string; // Changed from optional to required
  domain: string | null; // Changed from optional to required
  status: 'active' | 'inactive' | 'pending'; // Changed from optional to required
  subscription_count: number;
  user_count: number;
  created_at: string;
  user_id: number;
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
  max_limit?: number;
  auto_renewal?: boolean;
}

// New interface for product subscription request during organization creation
export interface ProductSubscriptionRequest {
  product_id: string;
  tier_name: string;
  auto_renewal?: boolean;
  starts_at: string; // Start date in YYYY-MM-DD format
  ends_at: string; // End date in YYYY-MM-DD format (calculated as start_date + 1 year)
}

export interface CreateOrganizationRequest {
  name: string; // Changed from tenantName
  domain: string; // Changed from organizationDomain
  initialAdminEmail: string;
  initialStatus?: 'Active' | 'Inactive' | 'Pending';
  initial_admin_password?: string;
}

export interface CreateOrganizationApiRequest {
  name: string; // Changed from tenantName
  domain: string; // Changed from organizationDomain
  initial_admin_email: string;
  status?: 'active' | 'inactive' | 'pending';
  initial_admin_password?: string;
  created_by?: number;
}

export interface CreateOrganizationResponse {
  id: number;
  name: string;
  domain: string;
  status: string;
  settings: Record<string, unknown>;
  subscription_count: number;
  user_count: number;
  created_at: string;
  updated_at: string;
}

export interface UpdateOrganizationRequest {
  name?: string;
  domain?: string;
  status?: 'Active' | 'Pending' | 'Inactive';
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

// New interface for the updated organization format
export interface OrganizationV2 {
  id: number;
  name: string;
  domain: string | null;
  status: 'active' | 'inactive' | 'pending';
  subscription_count: number;
  user_count: number;
  created_at: string;
}

export interface OrganizationsV2Response {
  items: OrganizationV2[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
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
  id: number; // Changed from string to number
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: 'global_admin' | 'tenant_admin';
  status: 'active' | 'inactive' | 'pending' | 'invited';
  organization_id: number;
  domain_id?: number;
  created_at: string;
  updated_at: string;
  mfa_enabled?: boolean;
  mfa_setup_complete?: boolean;
}

export interface CreateUserRequest {
  email: string;
  first_name: string;
  last_name: string;
  role: 'global_admin' | 'tenant_admin';
  organization_id: number;
  domain_id?: number; // Made optional since we handle it separately
  password?: string;
}

export interface UpdateUserRequest {
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: 'global_admin' | 'tenant_admin';
  status?: 'active' | 'inactive' | 'pending' | 'invited';
  organization_id?: number;
}

// ────────────────────────────────────────
// Subscription Types
// ────────────────────────────────────────

export interface Subscription {
  id: string;
  organization_id: number;
  product_id: string;
  status:
    | 'active'
    | 'inactive'
    | 'trial'
    | 'expired'
    | 'cancelled'
    | 'suspended';
  // Support both old and new field names for backward compatibility
  tier_name?: string;
  tier?: string;
  current_usage: number;
  // Support both old and new field names for backward compatibility
  max_limit?: number;
  usage_limit?: number;
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
  tier: string;
  auto_renewal: boolean;
  starts_at?: string;
  ends_at?: string | null;
}

export interface UpdateSubscriptionRequest {
  status?:
    | 'active'
    | 'inactive'
    | 'trial'
    | 'expired'
    | 'cancelled'
    | 'suspended';
  tier?: string;
  auto_renewal?: boolean;
  ends_at?: string | null;
}

export interface SubscriptionStatusRequest {
  status:
    | 'active'
    | 'inactive'
    | 'trial'
    | 'expired'
    | 'cancelled'
    | 'suspended';
  reason?: string;
}

export interface UsageEventRequest {
  event_type: string;
  quantity: number;
  metadata?: Record<string, unknown>;
}

export interface UsageResponse {
  id: string;
  subscription_id: string;
  event_type: string;
  quantity: number;
  metadata: Record<string, unknown>;
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
  id: string | number;
  name: string;
  display_name?: string; // Optional for backward compatibility
  product_type?: string; // Optional for backward compatibility
  description: string | null;
  is_active?: boolean; // Optional for backward compatibility
  features?: any[]; // Optional for backward compatibility
  settings?: Record<string, any>; // Optional for backward compatibility
  // Keep existing fields for backward compatibility
  price?: number;
  currency?: string;
  status?: 'Active' | 'Inactive';
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
// Product Tier Types
// ────────────────────────────────────────

export interface ProductTier {
  id: string;
  product_id: string;
  tier_name: string;
  display_name: string;
  max_limit: number;
  price: number;
  currency: string;
  status: 'Active' | 'Inactive';
  created_at: string;
  updated_at: string;
}

export interface ProductTiersResponse {
  total: number;
  page: number;
  limit: number;
  tiers: ProductTier[];
}

export interface ProductTierResponse {
  tier: ProductTier;
}

// ────────────────────────────────────────
// Usage Event Types
// ────────────────────────────────────────

export interface UsageEvent {
  id: string;
  organization_id: string;
  user_id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  timestamp: string;
  created_at: string;
}

export interface CreateUsageEventRequest {
  organization_id: string;
  user_id: string;
  event_type: string;
  event_data: Record<string, unknown>;
}

// ────────────────────────────────────────
// Audit Log Types
// ────────────────────────────────────────

export interface AuditLog {
  id: string | number;
  entity_type: string;
  entity_id: string;
  action: string;
  performed_by: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  performed_by: string;
  changes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
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
// Dialog and UI Types
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
  onPageChange: (event: React.ChangeEvent<unknown>, newPage: number) => void;
  onPageSizeChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
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
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
  mfa_required: boolean;
  mfa_enrollment_required: boolean;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

// ────────────────────────────────────────
// Error and Status Types
// ────────────────────────────────────────

export interface ApiError {
  message: string;
  detail?: string;
  status?: number;
}

export interface ErrorResponse {
  error: string;
  message?: string;
  status?: number;
}

export type StatusType =
  | 'Active'
  | 'Inactive'
  | 'Pending'
  | 'Cancelled'
  | 'Expired';

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
  'Organization domain cannot be empty':
    'Please provide a valid domain name for the organization',
  'Domain name cannot be empty': 'Domain name is required',
  'Domain already exists':
    'This domain is already associated with another organization',

  // Subdomain errors
  'Subdomain already exists': 'This subdomain name is already in use',
  'Parent domain not found': 'The parent domain does not exist',

  // Organization creation errors
  'Failed to create tenant organization':
    'Organization creation failed. Please check your input and try again.',
};

// ────────────────────────────────────────
// Summary Data Types
// ────────────────────────────────────────

export interface SummaryData {
  organizations: OrganizationsResponse | ErrorResponse | null;
  users: PaginatedResponse<User> | ErrorResponse | null;
  subscriptions: PaginatedSubscriptionsResponse | ErrorResponse | null;
  products: Product[] | ErrorResponse | null;
  root: { status: string } | ErrorResponse | null;
  health: { status: string } | ErrorResponse | null;
  status: { status: string } | ErrorResponse | null;
}

export interface SummaryDataResponse {
  organizations: OrganizationsResponse | ErrorResponse | null;
  users: PaginatedResponse<User> | ErrorResponse | null;
  subscriptions: PaginatedSubscriptionsResponse | ErrorResponse | null;
  products: Product[] | ErrorResponse | null;
  root: { status: string } | ErrorResponse | null;
  health: { status: string } | ErrorResponse | null;
  status: { status: string } | ErrorResponse | null;
}

// ────────────────────────────────────────
// Component Props Types
// ────────────────────────────────────────

export interface SummaryCardProps {
  title: string;
  data: SummaryData[keyof SummaryData];
  loading: boolean;
  color: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error';
  path: string;
  icon: string;
}

// ──────────────────────────────────────────────────
// End of File: client/src/types/index.ts
// ──────────────────────────────────────────────────

// Add new interface for the products API response
export interface ProductsResponse {
  success: boolean;
  message: string;
  products: Product[];
  total: number;
}

// Add legacy response type for backward compatibility
export interface ProductsLegacyResponse extends Array<Product> {}

// ────────────────────────────────────────
// Transcript Analysis Types
// ────────────────────────────────────────

export interface JobSubmissionResponse {
  job_id: string;
  status: string;
}

export interface JobStatusResponse {
  job_id: string;
  status: 'processing' | 'completed' | 'failed';
  result?: {
    pass_1_extraction: any;
    pass_2_correction: any;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface JobDetailedResponse extends JobStatusResponse {
  // Additional fields for detailed view
  processing_metadata?: {
    processing_time_seconds?: number;
    file_info?: {
      filename: string;
      file_size: number;
      file_type: string;
    };
  };
}

// Type for the new /jobs_diagnostics endpoint response
export interface JobDiagnosticsResponse {
  id: number;
  overall_status: string;
  documents: {
    id: string;
    document_type: string;
    status: 'processing' | 'completed' | 'failed';
    result?: {
      pass_1_extraction: any;
      pass_2_correction: any;
    };
    error?: {
      code: string;
      message: string;
    };
  }[];
  created_timestamp: string;
  processing_duration_seconds: number;
}

// Interfaces for the /jobs endpoint
export interface JobDocument {
  id: string;
  document_type: string;
  original_filename: string;
  status: 'completed' | 'processing' | 'failed';
}

export interface Job {
  job_id: string;
  status: string;
  filename: string;
  upload_timestamp: string;
  file_path: string | null;
  extracted_data: any | null;
  processing_metadata: any | null;
  processing_duration_seconds: number;
}

export type JobsApiResponse = Job[];

// ────────────────────────────────────────
// Re-export transcripts types from transcriptsApi.ts for consistency
// ────────────────────────────────────────
export type {
  JobDiagnosticsResponse as TranscriptsJobDiagnosticsResponse,
  JobDocument as TranscriptsJobDocument,
  Job as TranscriptsJob,
  JobsApiResponse as TranscriptsJobsApiResponse,
} from '../services/transcriptsApi';

// ──────────────────────────────────────────────────
// End of File: client/src/types/index.ts
// ──────────────────────────────────────────────────

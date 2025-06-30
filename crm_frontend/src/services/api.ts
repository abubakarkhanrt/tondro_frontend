/**
 * ──────────────────────────────────────────────────
 * File: client/src/services/api.ts
 * Description: Axios configuration and API helper functions for TondroAI CRM
 * Author: Muhammad Abubakar Khan
 * Created: 18-06-2025
 * Last Updated: 30-06-2025
 * ──────────────────────────────────────────────────
 */

import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
} from 'axios';
import { ENV_CONFIG } from '../config/env';
import {
  type Organization,
  type OrganizationsResponse,
  type CreateOrganizationRequest,
  type UpdateOrganizationRequest,
  type OrganizationMetrics,
  type User,
  type CreateUserRequest,
  type UpdateUserRequest,
  type Subscription,
  type CreateSubscriptionRequest,
  type UpdateSubscriptionRequest,
  type Product,
  type CreateProductRequest,
  type UpdateProductRequest,
  type AuditLog,
  type ApiParams,
  type PaginatedResponse,
  type LoginRequest,
  type LoginResponse,
  type CreateOrganizationResponse,
  type Domain,
  type CreateDomainRequest,
  type UpdateDomainRequest,
  type DomainResponse,
  type OrganizationDomainsResponse,
  type PaginatedSubscriptionsResponse,
  type SubscriptionStatusRequest,
  type UsageEventRequest,
  type UsageResponse,
  type UsageSummaryResponse,
  type UsageLimitsResponse,
} from '../types';

// ────────────────────────────────────────
// API Configuration
// ────────────────────────────────────────

const api: AxiosInstance = axios.create({
  baseURL: ENV_CONFIG.API_BASE_URL,
  timeout: ENV_CONFIG.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ────────────────────────────────────────
// Request Interceptor
// ────────────────────────────────────────

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Don't add Authorization header for login endpoint
    if (config.url === '/crm/auth/login') {
      return config;
    }

    const accessToken = localStorage.getItem('access_token');
    const tokenType = localStorage.getItem('token_type') || 'bearer';

    // Use the new token format if available, fallback to old format for backward compatibility
    const token = accessToken || localStorage.getItem(ENV_CONFIG.JWT_STORAGE_KEY);

    // Only use valid tokens, fallback to test token if needed
    const validToken =
      token && token !== 'undefined' && token !== 'null'
        ? token
        : 'valid_test_token';

    if (config.headers) {
      config.headers.Authorization = `${tokenType} ${validToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ────────────────────────────────────────
// Response Interceptor
// ────────────────────────────────────────

api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // Don't redirect on cancelled requests
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    if (error.response && error.response.status === 401) {
      // Clear all token formats for backward compatibility
      localStorage.removeItem('access_token');
      localStorage.removeItem('token_type');
      localStorage.removeItem('user');
      localStorage.removeItem(ENV_CONFIG.JWT_STORAGE_KEY);
      localStorage.removeItem(ENV_CONFIG.USER_EMAIL_STORAGE_KEY);

      // Dispatch events to notify components
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('logout'));

      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ────────────────────────────────────────
// API Helper Functions
// ────────────────────────────────────────

export const apiHelpers = {
  // Create a new AbortController for each request
  createAbortController: (): AbortController => new AbortController(),

  // ────────────────────────────────────────
  // Organizations
  // ────────────────────────────────────────

  getOrganizations: async (
    params: ApiParams = {},
    signal?: AbortSignal
  ): Promise<AxiosResponse<OrganizationsResponse>> => {
    // Handle status filter and search filter proactively to avoid 500 errors
    if (params.status || params.search) {
      try {
        // First try with all filters
        const response = await api.get('/crm/organizations', {
          params,
          signal,
        });
        return response;
      } catch (error: any) {
        // If filters fail with 500 error, fall back to frontend filtering
        if (error.response?.status === 500) {
          console.log('Filters failed, falling back to frontend filtering...');
          try {
            // Remove filters and fetch all organizations
            const { status, search, ...paramsWithoutFilters } = params;
            const response = await api.get('/crm/organizations', {
              params: paramsWithoutFilters,
              signal,
            });
            const data: OrganizationsResponse = response.data;

            // Filter organizations on the frontend
            let filteredOrganizations = data.organizations;

            // Apply status filter if provided
            if (status) {
              filteredOrganizations = filteredOrganizations.filter(
                (org) => org.status.toLowerCase() === status.toLowerCase()
              );
            }

            // Apply search filter if provided
            if (search) {
              const searchLower = search.toLowerCase();
              filteredOrganizations = filteredOrganizations.filter(
                (org) =>
                  org.tenantName.toLowerCase().includes(searchLower) ||
                  org.organizationDomain.toLowerCase().includes(searchLower)
              );
            }

            // Update the response with filtered data
            const filteredData: OrganizationsResponse = {
              ...data,
              organizations: filteredOrganizations,
              total: filteredOrganizations.length,
            };

            return {
              ...response,
              data: filteredData,
            };
          } catch (fallbackError) {
            console.log('Frontend filtering also failed:', fallbackError);
            throw error; // Re-throw original error
          }
        }
        throw error;
      }
    }

    // If no filters, proceed normally
    try {
      return await api.get('/crm/organizations', { params, signal });
    } catch (error: any) {
      // Temporary fallback: try with old API structure if new one fails
      if (error.response?.status === 500) {
        console.log('New organizations API failed, trying old structure...');
        try {
          // Try with old parameter names
          const oldParams = {
            page: params.page,
            page_size: params.limit || params.page_size,
          };
          const oldResponse = await api.get('/crm/organizations', {
            params: oldParams,
            signal,
          });

          // Transform old response to new format
          const oldData = oldResponse.data;
          const transformedData: OrganizationsResponse = {
            total: oldData.total || 0,
            page: oldData.page || 1,
            limit: oldData.page_size || 10,
            organizations: (oldData.items || []).map((org: any) => ({
              organizationId: org.id,
              tenantName: org.name,
              organizationDomain: org.domain,
              status: org.status,
              subscriptionTier: 'Tier 1', // Default value
              contractAnniversaryDate: new Date().toISOString().split('T')[0], // Default value
              totalUsers: 0, // Default value
              totalJobs: 0, // Default value
              usageAgainstLimit: '0%', // Default value
              createdAt: org.created_at,
            })),
          };

          return {
            ...oldResponse,
            data: transformedData,
          };
        } catch (fallbackError) {
          console.log('Old API structure also failed:', fallbackError);
          throw error; // Re-throw original error
        }
      }
      throw error;
    }
  },

  createOrganization: (
    data: CreateOrganizationRequest,
    signal?: AbortSignal
  ): Promise<AxiosResponse<CreateOrganizationResponse>> =>
    api.post('/crm/organizations', data, { signal }),

  getOrganization: (
    id: string,
    signal?: AbortSignal
  ): Promise<AxiosResponse<Organization>> =>
    api.get(`/crm/organizations/${id}`, { signal }),

  updateOrganization: (
    id: string,
    data: UpdateOrganizationRequest,
    signal?: AbortSignal
  ): Promise<AxiosResponse<Organization>> =>
    api.patch(`/crm/organizations/${id}`, data, { signal }),

  deleteOrganization: (
    id: string,
    force: boolean = false,
    signal?: AbortSignal
  ): Promise<AxiosResponse<void>> =>
    api.delete(`/crm/organizations/${id}?force=${force}`, { signal }),

  updateOrganizationStatus: (
    id: string,
    status: string,
    signal?: AbortSignal
  ): Promise<AxiosResponse<Organization>> =>
    api.put(`/crm/organizations/${id}/status`, { status }, { signal }),

  getOrganizationMetrics: (
    id: string,
    signal?: AbortSignal
  ): Promise<AxiosResponse<OrganizationMetrics>> =>
    api.get(`/crm/organizations/${id}/metrics`, { signal }),

  getOrganizationUsers: (
    id: string,
    signal?: AbortSignal
  ): Promise<AxiosResponse<PaginatedResponse<User>>> =>
    api.get(`/crm/organizations/${id}/users`, { signal }),

  getOrganizationSubscriptions: (
    id: string,
    activeOnly: boolean = false,
    signal?: AbortSignal
  ): Promise<AxiosResponse<PaginatedResponse<Subscription>>> =>
    api.get(
      `/crm/organizations/${id}/subscriptions?active_only=${activeOnly}`,
      { signal }
    ),

  // ────────────────────────────────────────
  // Domain Management
  // ────────────────────────────────────────

  getDomains: (
    params: ApiParams = {},
    signal?: AbortSignal
  ): Promise<AxiosResponse<DomainResponse>> =>
    api.get('/crm/domains', { params, signal }),

  createDomain: (
    data: CreateDomainRequest,
    signal?: AbortSignal
  ): Promise<AxiosResponse<Domain>> =>
    api.post('/crm/domains', data, { signal }),

  getDomain: (
    id: string,
    signal?: AbortSignal
  ): Promise<AxiosResponse<Domain>> =>
    api.get(`/crm/domains/${id}`, { signal }),

  updateDomain: (
    id: string,
    data: UpdateDomainRequest,
    signal?: AbortSignal
  ): Promise<AxiosResponse<Domain>> =>
    api.patch(`/crm/domains/${id}`, data, { signal }),

  deleteDomain: (
    id: string,
    signal?: AbortSignal
  ): Promise<AxiosResponse<void>> =>
    api.delete(`/crm/domains/${id}`, { signal }),

  createSubdomain: (
    parentId: string,
    data: CreateDomainRequest,
    signal?: AbortSignal
  ): Promise<AxiosResponse<Domain>> =>
    api.post(`/crm/domains/${parentId}/subdomains`, data, { signal }),

  getOrganizationDomains: (
    organizationId: string,
    signal?: AbortSignal
  ): Promise<AxiosResponse<OrganizationDomainsResponse>> =>
    api.get(`/crm/organizations/${organizationId}/domains`, { signal }),

  // ────────────────────────────────────────
  // User Domain Selection (NEW)
  // ────────────────────────────────────────
  
  getUserDomains: (organizationId: string, signal?: AbortSignal): Promise<AxiosResponse<OrganizationDomainsResponse>> => 
    api.get(`/crm/users/domains/${organizationId}`, { signal }),

  // ────────────────────────────────────────
  // Users
  // ────────────────────────────────────────

  getUsers: (
    params: ApiParams = {},
    signal?: AbortSignal
  ): Promise<AxiosResponse<PaginatedResponse<User>>> =>
    api.get('/crm/users', { params, signal }),

  createUser: (
    data: CreateUserRequest,
    signal?: AbortSignal
  ): Promise<AxiosResponse<User>> => api.post('/crm/users', data, { signal }),

  getUser: (id: string, signal?: AbortSignal): Promise<AxiosResponse<User>> =>
    api.get(`/crm/users/${id}`, { signal }),

  updateUser: (
    id: string,
    data: UpdateUserRequest,
    signal?: AbortSignal
  ): Promise<AxiosResponse<User>> =>
    api.patch(`/crm/users/${id}`, data, { signal }),
    
  deleteUser: (id: string, reason?: string, signal?: AbortSignal): Promise<AxiosResponse<void>> => 
    api.delete(`/crm/users/${id}`, { 
      data: reason ? { reason } : undefined,
      signal 
    }),
    
  updateUserRole: (id: string, role: string, signal?: AbortSignal): Promise<AxiosResponse<User>> => 
    api.put(`/crm/users/${id}/role`, { role }, { signal }),

  updateUserStatus: (
    id: string,
    status: string,
    signal?: AbortSignal
  ): Promise<AxiosResponse<User>> =>
    api.put(`/crm/users/${id}/status`, { status }, { signal }),

  recordUserLogin: (
    id: string,
    signal?: AbortSignal
  ): Promise<AxiosResponse<void>> =>
    api.post(`/crm/users/${id}/login`, {}, { signal }),

  // ────────────────────────────────────────
  // Subscriptions
  // ────────────────────────────────────────

  getSubscriptions: (
    params: ApiParams = {},
    signal?: AbortSignal
  ): Promise<AxiosResponse<PaginatedSubscriptionsResponse>> =>
    api.get('/crm/subscriptions', { params, signal }),

  createSubscription: (
    data: CreateSubscriptionRequest,
    signal?: AbortSignal
  ): Promise<AxiosResponse<Subscription>> =>
    api.post('/crm/subscriptions', data, { signal }),

  getSubscription: (
    id: string,
    signal?: AbortSignal
  ): Promise<AxiosResponse<Subscription>> =>
    api.get(`/crm/subscriptions/${id}`, { signal }),

  updateSubscription: (
    id: string,
    data: UpdateSubscriptionRequest,
    signal?: AbortSignal
  ): Promise<AxiosResponse<Subscription>> =>
    api.patch(`/crm/subscriptions/${id}`, data, { signal }),

  deleteSubscription: (
    id: string,
    reason?: string,
    signal?: AbortSignal
  ): Promise<AxiosResponse<void>> =>
    api.delete(`/crm/subscriptions/${id}${reason ? `?reason=${reason}` : ''}`, {
      signal,
    }),

  updateSubscriptionStatus: (
    id: string,
    data: SubscriptionStatusRequest,
    signal?: AbortSignal
  ): Promise<AxiosResponse<Subscription>> =>
    api.put(`/crm/subscriptions/${id}/status`, data, { signal }),

  recordUsage: (
    id: string,
    data: UsageEventRequest,
    signal?: AbortSignal
  ): Promise<AxiosResponse<UsageResponse>> =>
    api.post(`/crm/subscriptions/${id}/usage`, data, { signal }),

  getUsageSummary: (
    id: string,
    periodDays: number = 30,
    signal?: AbortSignal
  ): Promise<AxiosResponse<UsageSummaryResponse>> =>
    api.get(
      `/crm/subscriptions/${id}/usage/summary?period_days=${periodDays}`,
      { signal }
    ),

  checkUsageLimits: (
    id: string,
    data: UsageEventRequest,
    signal?: AbortSignal
  ): Promise<AxiosResponse<UsageLimitsResponse>> =>
    api.post(`/crm/subscriptions/${id}/usage/check`, data, { signal }),

  // ────────────────────────────────────────
  // Products
  // ────────────────────────────────────────

  getProducts: (signal?: AbortSignal): Promise<AxiosResponse<Product[]>> =>
    api.get('/crm/products', { signal }),

  createProduct: (
    data: CreateProductRequest,
    signal?: AbortSignal
  ): Promise<AxiosResponse<Product>> =>
    api.post('/crm/products', data, { signal }),

  updateProduct: (
    id: string,
    data: UpdateProductRequest,
    signal?: AbortSignal
  ): Promise<AxiosResponse<Product>> =>
    api.patch(`/crm/products/${id}`, data, { signal }),

  // ────────────────────────────────────────
  // Product Tiers
  // ────────────────────────────────────────

  getProductTiers: (
    signal?: AbortSignal
  ): Promise<AxiosResponse<{ tiers: any[]; total: number; page: number; limit: number }>> =>
    api.get('/crm/product-tiers', { signal }),

  getProductTier: (
    productId: string,
    tierName: string,
    signal?: AbortSignal
  ): Promise<AxiosResponse<{ tier: any }>> =>
    api.get(`/crm/product-tiers/${productId}/${tierName}`, { signal }),

  // ────────────────────────────────────────
  // Audit Log
  // ────────────────────────────────────────

  getAuditLogs: (
    params: ApiParams = {},
    signal?: AbortSignal
  ): Promise<AxiosResponse<PaginatedResponse<AuditLog>>> =>
    api.get('/crm/audit-logs', { params, signal }),

  getAuditLog: (
    id: string,
    signal?: AbortSignal
  ): Promise<AxiosResponse<AuditLog>> =>
    api.get(`/crm/audit-logs/${id}`, { signal }),

  // ────────────────────────────────────────
  // Authentication
  // ────────────────────────────────────────

  login: (
    credentials: LoginRequest,
    signal?: AbortSignal
  ): Promise<AxiosResponse<LoginResponse>> => {
    console.log('📡 API Login Request:', {
      url: '/crm/auth/login',
      credentials: { ...credentials, password: '***' }
    });
    return api.post('/crm/auth/login', credentials, { signal });
  },

  // ────────────────────────────────────────
  // Health checks
  // ────────────────────────────────────────

  getHealth: (signal?: AbortSignal): Promise<AxiosResponse<any>> =>
    axios.get('http://localhost:8081/health', { signal }),

  getStatus: (signal?: AbortSignal): Promise<AxiosResponse<any>> =>
    api.get('/crm/status', { signal }),

  getRoot: (signal?: AbortSignal): Promise<AxiosResponse<any>> =>
    axios.get('http://localhost:8081/', { signal }),

  // ────────────────────────────────────────
  // User Roles
  // ────────────────────────────────────────

  getUserRoles: (
    signal?: AbortSignal
  ): Promise<AxiosResponse<{ roles: string[] }>> =>
    api.get('/crm/users/user-roles', { signal }),

  // ────────────────────────────────────────
  // Transcript Analysis
  // ────────────────────────────────────────

  analyzeTranscript: (
    formData: FormData,
    signal?: AbortSignal
  ): Promise<AxiosResponse<{
    success: boolean;
    data?: {
      job_id: string;
      file_info: {
        filename: string;
        file_size: number;
        file_type: string;
        uploaded_at: string;
        processing_started_at: string;
        processing_completed_at: string;
        total_processing_time_seconds: number;
      };
      analysis_results: {
        first_pass: any;
        final_pass: any;
      };
      processing_metadata: {
        first_pass_confidence: number;
        final_pass_confidence: number;
        improvement_score: number;
        processing_warnings: string[];
        extraction_quality_score: number;
      };
    };
    error?: {
      code: string;
      message: string;
      details?: Record<string, any>;
    };
  }>> => {
    // Override Content-Type for multipart form data
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      signal,
    };
    return api.post('/crm/cv/analyze', formData, config);
  },
};

// Also export for backward compatibility
export default apiHelpers;

// ──────────────────────────────────────────────────
// End of File: client/src/services/api.ts
// ──────────────────────────────────────────────────

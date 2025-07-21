/**
 * ──────────────────────────────────────────────────
 * File: client/src/services/api.ts
 * Description: Axios configuration and API helper functions for TondroAI CRM
 * Author: Muhammad Abubakar Khan
 * Created: 18-06-2025
 * Last Updated: 14-07-2025
 * ──────────────────────────────────────────────────
 */

import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
  type GenericAbortSignal,
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
  type CreateOrganizationResponse,
  type Domain,
  type CreateDomainRequest,
  type UpdateDomainRequest,
  type DomainResponse,
  type OrganizationDomainsArrayResponse,
  type PaginatedSubscriptionsResponse,
  type SubscriptionStatusRequest,
  type UsageEventRequest,
  type UsageResponse,
  type UsageSummaryResponse,
  type UsageLimitsResponse,
  type ProductsResponse,
  type JobDiagnosticsResponse,
  type JobsApiResponse,
} from '../types';
import { apiAuthHelpers } from './authApi';

// ────────────────────────────────────────
// API Endpoint Constants
// ────────────────────────────────────────

// Use environment-based CRM base path
const CRM_BASE = ENV_CONFIG.API_BASE_PATH;

// Helper functions to build CRM endpoints
const buildCrmEndpoint = (path: string): string => `${CRM_BASE}${path}`;
const buildCrmEndpointWithId =
  (path: string) =>
  (id: string): string =>
    `${CRM_BASE}${path}/${id}`;

const API_ENDPOINTS = {
  // Base paths
  CRM: CRM_BASE,

  // Organizations
  ORGANIZATIONS: {
    BASE: buildCrmEndpoint('/organizations'),
    BY_ID: buildCrmEndpointWithId('/organizations'),
    STATUS: (id: string): string =>
      buildCrmEndpoint(`/organizations/${id}/status`),
    METRICS: (id: string): string =>
      buildCrmEndpoint(`/organizations/${id}/metrics`),
    USERS: (id: string): string =>
      buildCrmEndpoint(`/organizations/${id}/users`),
    SUBSCRIPTIONS: (id: string, activeOnly: boolean = false): string =>
      buildCrmEndpoint(
        `/organizations/${id}/subscriptions?active_only=${activeOnly}`
      ),
    DOMAINS: (id: string): string =>
      buildCrmEndpoint(`/organizations/${id}/domains`),
  },

  // Domains
  DOMAINS: {
    BASE: buildCrmEndpoint('/domains'),
    BY_ID: buildCrmEndpointWithId('/domains'),
    SUBDOMAINS: (parentId: string): string =>
      buildCrmEndpoint(`/domains/${parentId}/subdomains`),
  },

  // Users
  USERS: {
    BASE: buildCrmEndpoint('/users'),
    BY_ID: buildCrmEndpointWithId('/users'),
    ROLE: (id: string): string => buildCrmEndpoint(`/users/${id}/role`),
    STATUS: (id: string): string => buildCrmEndpoint(`/users/${id}/status`),
    LOGIN: (id: string): string => buildCrmEndpoint(`/users/${id}/login`),
    USER_ROLES: buildCrmEndpoint('/users'),
    DOMAINS: (organizationId: number): string =>
      buildCrmEndpoint(`/users/domains/${organizationId}`),
  },

  // Subscriptions
  SUBSCRIPTIONS: {
    BASE: buildCrmEndpoint('/subscriptions'),
    BY_ID: buildCrmEndpointWithId('/subscriptions'),
    STATUS: (id: string): string =>
      buildCrmEndpoint(`/subscriptions/${id}/status`),
    USAGE: (id: string): string =>
      buildCrmEndpoint(`/subscriptions/${id}/usage`),
    USAGE_SUMMARY: (id: string, periodDays: number = 30): string =>
      buildCrmEndpoint(
        `/subscriptions/${id}/usage/summary?period_days=${periodDays}`
      ),
    USAGE_CHECK: (id: string): string =>
      buildCrmEndpoint(`/subscriptions/${id}/usage/check`),
  },

  // Products
  PRODUCTS: {
    BASE: buildCrmEndpoint('/products'),
    BY_ID: buildCrmEndpointWithId('/products'),
  },

  // Product Tiers
  PRODUCT_TIERS: {
    BASE: buildCrmEndpoint('/product-tiers'),
    BY_PRODUCT: (productId: string): string =>
      buildCrmEndpoint(`/products/${productId}/tiers`),
    BY_PRODUCT_AND_TIER: (productId: string, tierName: string): string =>
      buildCrmEndpoint(`/product-tiers/${productId}/${tierName}`),
  },

  // Audit Logs
  AUDIT_LOGS: {
    BASE: buildCrmEndpoint('/audit-logs'),
    BY_ID: buildCrmEndpointWithId('/audit-logs'),
  },

  // Status & Health
  STATUS: {
    CRM_STATUS: buildCrmEndpoint('/status'),
    HEALTH: '/health',
    ROOT: '/',
  },

  // Transcript Analysis (uses transcriptsApi instance)
  TRANSCRIPTS: {
    SUBMIT_JOB: '/api/transcripts/jobs',
    GET_JOB_STATUS: (jobId: number): string =>
      `/api/transcripts/jobs_diagnostics?ids=${jobId}`,
    LIST_JOBS: '/api/transcripts/jobs_diagnostics',
  },
} as const;

// ────────────────────────────────────────
// API Configuration
// ────────────────────────────────────────

// Main CRM API instance
const api: AxiosInstance = axios.create({
  baseURL: ENV_CONFIG.API_BASE_URL || '',
  timeout: ENV_CONFIG.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Transcripts API instance (separate service)
const transcriptsApi: AxiosInstance = axios.create({
  baseURL: '', // Use relative URLs since we're now proxying through Next.js
  timeout: ENV_CONFIG.TRANSCRIPTS_API_TIMEOUT,
});

// ────────────────────────────────────────
// Request Interceptors
// ────────────────────────────────────────

// Main CRM API interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = localStorage.getItem('access_token');
    const tokenType = localStorage.getItem('token_type') || 'bearer';

    // Use the new token format if available, fallback to old format for backward compatibility
    const token =
      accessToken || localStorage.getItem(ENV_CONFIG.JWT_STORAGE_KEY);

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
  error => {
    return Promise.reject(error);
  }
);

// Transcripts API interceptor
transcriptsApi.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = localStorage.getItem('access_token');
    const tokenType = localStorage.getItem('token_type') || 'bearer';

    const token =
      accessToken || localStorage.getItem(ENV_CONFIG.JWT_STORAGE_KEY);

    // Use a valid token; you might want to adjust the fallback behavior
    const validToken =
      token && token !== 'undefined' && token !== 'null'
        ? token
        : 'valid_test_token'; // Or handle error if no token

    if (config.headers) {
      config.headers.Authorization = `${tokenType} ${validToken}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// ────────────────────────────────────────
// Response Interceptors
// ────────────────────────────────────────

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Main CRM API response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async error => {
    const originalRequest = error.config;

    // Don't redirect on cancelled requests
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    // Add CRM API error context for debugging
    if (ENV_CONFIG.IS_DEVELOPMENT) {
      const errorInfo = {
        message: 'CRM API Error',
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        method: error.config?.method,
        data: error.response?.data,
      };
      console.error('CRM API Error:', errorInfo);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return axios(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          handleAppLogout();
        }
        const { data } = await apiAuthHelpers.refresh(refreshToken || '');
        const { access_token, refresh_token } = data;

        // Update local storage and original request
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        api.defaults.headers.common['Authorization'] = 'Bearer ' + access_token;
        originalRequest.headers['Authorization'] = 'Bearer ' + access_token;

        processQueue(null, access_token);
        return axios(originalRequest);
      } catch (refreshError: any) {
        processQueue(refreshError, null);

        handleAppLogout();

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const handleAppLogout = (navigateToLogin: boolean = true): void => {
  // Clear all token formats for backward compatibility
  localStorage.clear();

  // Redirect to login
  if (navigateToLogin) {
    window.location.href = '/login';
  }
};

// Transcripts API response interceptor (simpler, no auth redirects)
transcriptsApi.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  error => {
    // Don't redirect on cancelled requests
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    // Enhanced transcripts API error handling
    const errorInfo = {
      message: 'Transcripts API Error',
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data,
    };

    // Log transcripts API errors for debugging
    if (ENV_CONFIG.IS_DEVELOPMENT) {
      console.error('Transcripts API Error:', errorInfo);
    }

    // Add transcripts-specific error context
    error.transcriptsApiError = true;
    error.errorInfo = errorInfo;

    return Promise.reject(error);
  }
);

// ────────────────────────────────────────
// API Helper Functions
// ────────────────────────────────────────

// Utility function to check if an error is from transcripts API
export const isTranscriptsApiError = (error: any): boolean => {
  return error && error.transcriptsApiError === true;
};

// Utility function to get transcripts API error info
export const getTranscriptsApiErrorInfo = (error: any) => {
  return error?.errorInfo || null;
};

// Utility function to validate and log API responses
export const validateApiResponse = (
  response: any,
  apiType: 'crm' | 'transcripts' = 'crm'
) => {
  if (ENV_CONFIG.IS_DEVELOPMENT && ENV_CONFIG.ENABLE_DEBUG_LOGGING) {
    console.log(`${apiType.toUpperCase()} API Response Validation:`, {
      hasData: !!response?.data,
      dataType: typeof response?.data,
      isArray: Array.isArray(response?.data),
      keys: response?.data ? Object.keys(response?.data) : [],
    });
  }
  return response;
};

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
        const response = await api.get(API_ENDPOINTS.ORGANIZATIONS.BASE, {
          params,
          signal: signal as GenericAbortSignal,
        });

        // Check if response is in new format and transform if needed
        const data = response.data;
        if (data.items && Array.isArray(data.items)) {
          // New format detected - transform to expected format
          const transformedData: OrganizationsResponse = {
            total: data.total || 0,
            page: data.page || 1,
            limit: data.page_size || 10,
            organizations: data.items.map((org: any) => ({
              organizationId: String(org.id),
              tenantName: org.name,
              organizationDomain: org.domain || '',
              status:
                org.status === 'active'
                  ? 'Active'
                  : org.status === 'inactive'
                    ? 'Inactive'
                    : org.status === 'pending'
                      ? 'Pending'
                      : 'Inactive',
              subscriptionTier: 'Tier 1', // Default value
              contractAnniversaryDate: new Date().toISOString().split('T')[0], // Default value
              totalUsers: org.user_count || 0,
              totalJobs: 0, // Default value
              usageAgainstLimit: '0%', // Default value
              createdAt: org.created_at,
              // Keep new format fields for backward compatibility
              id: org.id,
              name: org.name,
              domain: org.domain,
              subscription_count: org.subscription_count,
              user_count: org.user_count,
              created_at: org.created_at,
            })),
          };
          return { ...response, data: transformedData };
        }

        return response;
      } catch (error: unknown) {
        // If filters fail with 500 error, fall back to frontend filtering
        if (
          error &&
          typeof error === 'object' &&
          'response' in error &&
          error.response &&
          typeof error.response === 'object' &&
          'status' in error.response &&
          error.response.status === 500
        ) {
          console.log('Filters failed, falling back to frontend filtering...');
          try {
            // Remove filters and fetch all organizations
            const { status, search, ...paramsWithoutFilters } = params;
            const response = await api.get(API_ENDPOINTS.ORGANIZATIONS.BASE, {
              params: paramsWithoutFilters,
              signal: signal as GenericAbortSignal,
            });
            const data: OrganizationsResponse = response.data;

            // Filter organizations on the frontend
            let filteredOrganizations = data.organizations;

            // Apply status filter if provided
            if (status) {
              filteredOrganizations = filteredOrganizations.filter(
                org => org.status.toLowerCase() === status.toLowerCase()
              );
            }

            // Apply search filter if provided
            if (search) {
              const searchLower = search.toLowerCase();
              filteredOrganizations = filteredOrganizations.filter(
                org =>
                  org.name?.toLowerCase().includes(searchLower) ||
                  org.domain?.toLowerCase().includes(searchLower)
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
      const response = await api.get(API_ENDPOINTS.ORGANIZATIONS.BASE, {
        params,
        signal: signal as GenericAbortSignal,
      });

      // Check if response is in new format and transform if needed
      const data = response.data;
      if (data.items && Array.isArray(data.items)) {
        // New format detected - transform to expected format
        const transformedData: OrganizationsResponse = {
          total: data.total || 0,
          page: data.page || 1,
          limit: data.page_size || 10,
          organizations: data.items.map((org: any) => ({
            organizationId: String(org.id),
            tenantName: org.name,
            organizationDomain: org.domain || '',
            status:
              org.status === 'active'
                ? 'Active'
                : org.status === 'inactive'
                  ? 'Inactive'
                  : org.status === 'pending'
                    ? 'Pending'
                    : 'Inactive',
            subscriptionTier: 'Tier 1', // Default value
            contractAnniversaryDate: new Date().toISOString().split('T')[0], // Default value
            totalUsers: org.user_count || 0,
            totalJobs: 0, // Default value
            usageAgainstLimit: '0%', // Default value
            createdAt: org.created_at,
            // Keep new format fields for backward compatibility
            id: org.id,
            name: org.name,
            domain: org.domain,
            subscription_count: org.subscription_count,
            user_count: org.user_count,
            created_at: org.created_at,
          })),
        };
        return { ...response, data: transformedData };
      }

      return response;
    } catch (error: unknown) {
      // Temporary fallback: try with old API structure if new one fails
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'status' in error.response &&
        error.response.status === 500
      ) {
        try {
          // Try with old parameter names
          const oldParams = {
            page: params.page,
            page_size: params.limit || params.page_size,
          };
          const oldResponse = await api.get(API_ENDPOINTS.ORGANIZATIONS.BASE, {
            params: oldParams,
            signal: signal as GenericAbortSignal,
          });

          // Transform old response to new format
          const oldData = oldResponse.data;
          const transformedData: OrganizationsResponse = {
            total: oldData.total || 0,
            page: oldData.page || 1,
            limit: oldData.page_size || 10,
            organizations: (oldData.items || []).map((org: unknown) => {
              if (
                org &&
                typeof org === 'object' &&
                'id' in org &&
                'name' in org &&
                'domain' in org &&
                'status' in org &&
                'created_at' in org
              ) {
                return {
                  organizationId: String(org.id),
                  tenantName: String(org.name),
                  organizationDomain: String(org.domain),
                  status: String(org.status) as
                    | 'Active'
                    | 'Suspended'
                    | 'Trial'
                    | 'Inactive',
                  subscriptionTier: 'Tier 1', // Default value
                  contractAnniversaryDate: new Date()
                    .toISOString()
                    .split('T')[0], // Default value
                  totalUsers: 0, // Default value
                  totalJobs: 0, // Default value
                  usageAgainstLimit: '0%', // Default value
                  createdAt: String(org.created_at),
                };
              }
              return {
                organizationId: '',
                tenantName: '',
                organizationDomain: '',
                status: 'Inactive' as const,
                subscriptionTier: 'Tier 1',
                contractAnniversaryDate: new Date().toISOString().split('T')[0],
                totalUsers: 0,
                totalJobs: 0,
                usageAgainstLimit: '0%',
                createdAt: new Date().toISOString(),
              };
            }),
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
    data: CreateOrganizationRequest & { created_by?: number },
    signal?: AbortSignal
  ): Promise<AxiosResponse<CreateOrganizationResponse>> => {
    // Transform camelCase field names to snake_case for the API
    const transformedData: any = {
      name: data.name,
      domain: data.domain,
      initial_admin_email: data.initialAdminEmail,
      initial_status: data.initialStatus,
    };

    // Add created_by if provided
    if (data.created_by !== undefined) {
      transformedData.created_by = data.created_by;
    }

    return api.post(API_ENDPOINTS.ORGANIZATIONS.BASE, transformedData, {
      signal: signal as GenericAbortSignal,
    });
  },

  getOrganization: (
    id: number,
    signal?: AbortSignal
  ): Promise<AxiosResponse<Organization>> =>
    api.get(API_ENDPOINTS.ORGANIZATIONS.BY_ID(String(id)), {
      signal: signal as GenericAbortSignal,
    }),

  updateOrganization: (
    id: number,
    data: UpdateOrganizationRequest,
    signal?: AbortSignal
  ): Promise<AxiosResponse<Organization>> =>
    api.patch(API_ENDPOINTS.ORGANIZATIONS.BY_ID(String(id)), data, {
      signal: signal as GenericAbortSignal,
    }),

  deleteOrganization: (
    id: number,
    force: boolean = false,
    signal?: AbortSignal
  ): Promise<AxiosResponse<void>> =>
    api.delete(
      `${API_ENDPOINTS.ORGANIZATIONS.BY_ID(String(id))}?force=${force}`,
      {
        signal: signal as GenericAbortSignal,
      }
    ),

  updateOrganizationStatus: (
    id: number,
    status: string,
    signal?: AbortSignal
  ): Promise<AxiosResponse<Organization>> =>
    api.put(
      API_ENDPOINTS.ORGANIZATIONS.STATUS(String(id)),
      { status },
      { signal: signal as GenericAbortSignal }
    ),

  getOrganizationMetrics: (
    id: number,
    signal?: AbortSignal
  ): Promise<AxiosResponse<OrganizationMetrics>> =>
    api.get(API_ENDPOINTS.ORGANIZATIONS.METRICS(String(id)), {
      signal: signal as GenericAbortSignal,
    }),

  getOrganizationUsers: (
    id: number,
    signal?: AbortSignal
  ): Promise<AxiosResponse<PaginatedResponse<User>>> =>
    api.get(API_ENDPOINTS.ORGANIZATIONS.USERS(String(id)), {
      signal: signal as GenericAbortSignal,
    }),

  getOrganizationSubscriptions: (
    id: string,
    activeOnly: boolean = false,
    signal?: AbortSignal
  ): Promise<AxiosResponse<PaginatedResponse<Subscription>>> =>
    api.get(API_ENDPOINTS.ORGANIZATIONS.SUBSCRIPTIONS(id, activeOnly), {
      signal: signal as GenericAbortSignal,
    }),

  // ────────────────────────────────────────
  // Domain Management
  // ────────────────────────────────────────

  getDomains: (
    params: ApiParams = {},
    signal?: AbortSignal
  ): Promise<AxiosResponse<DomainResponse>> =>
    api.get(API_ENDPOINTS.DOMAINS.BASE, {
      params,
      signal: signal as GenericAbortSignal,
    }),

  createDomain: (
    data: CreateDomainRequest,
    signal?: AbortSignal
  ): Promise<AxiosResponse<Domain>> =>
    api.post(API_ENDPOINTS.DOMAINS.BASE, data, {
      signal: signal as GenericAbortSignal,
    }),

  getDomain: (
    id: string,
    signal?: AbortSignal
  ): Promise<AxiosResponse<Domain>> =>
    api.get(API_ENDPOINTS.DOMAINS.BY_ID(id), {
      signal: signal as GenericAbortSignal,
    }),

  updateDomain: (
    id: string,
    data: UpdateDomainRequest,
    signal?: AbortSignal
  ): Promise<AxiosResponse<Domain>> =>
    api.patch(API_ENDPOINTS.DOMAINS.BY_ID(id), data, {
      signal: signal as GenericAbortSignal,
    }),

  deleteDomain: (
    id: string,
    signal?: AbortSignal
  ): Promise<AxiosResponse<void>> =>
    api.delete(API_ENDPOINTS.DOMAINS.BY_ID(id), {
      signal: signal as GenericAbortSignal,
    }),

  createSubdomain: (
    parentId: string,
    data: CreateDomainRequest,
    signal?: AbortSignal
  ): Promise<AxiosResponse<Domain>> =>
    api.post(API_ENDPOINTS.DOMAINS.SUBDOMAINS(parentId), data, {
      signal: signal as GenericAbortSignal,
    }),

  getOrganizationDomains: (
    organizationId: string,
    signal?: AbortSignal
  ): Promise<AxiosResponse<OrganizationDomainsArrayResponse>> =>
    api.get(API_ENDPOINTS.DOMAINS.BASE, {
      params: { organization_id: organizationId },
      signal: signal as GenericAbortSignal,
    }),

  // ────────────────────────────────────────
  // User Domain Selection
  // ────────────────────────────────────────

  getUserDomains: (
    organizationId: number,
    signal?: AbortSignal
  ): Promise<AxiosResponse<OrganizationDomainsArrayResponse>> =>
    api.get(API_ENDPOINTS.USERS.DOMAINS(organizationId), {
      signal: signal as GenericAbortSignal,
    }),

  // ────────────────────────────────────────
  // Users
  // ────────────────────────────────────────

  getUsers: (
    params: ApiParams = {},
    signal?: AbortSignal
  ): Promise<AxiosResponse<PaginatedResponse<User>>> =>
    api.get(API_ENDPOINTS.USERS.BASE, {
      params,
      signal: signal as GenericAbortSignal,
    }),

  createUser: (
    data: CreateUserRequest,
    signal?: AbortSignal
  ): Promise<AxiosResponse<User>> =>
    api.post(API_ENDPOINTS.USERS.BASE, data, {
      signal: signal as GenericAbortSignal,
    }),

  getUser: (id: number, signal?: AbortSignal): Promise<AxiosResponse<User>> =>
    api.get(API_ENDPOINTS.USERS.BY_ID(String(id)), {
      signal: signal as GenericAbortSignal,
    }),

  updateUser: (
    id: number, // Changed from string to number
    data: UpdateUserRequest,
    signal?: AbortSignal
  ): Promise<AxiosResponse<User>> =>
    api.patch(API_ENDPOINTS.USERS.BY_ID(String(id)), data, {
      signal: signal as GenericAbortSignal,
    }),

  deleteUser: (
    id: number,
    reason?: string,
    signal?: AbortSignal
  ): Promise<AxiosResponse<void>> =>
    api.delete(API_ENDPOINTS.USERS.BY_ID(String(id)), {
      data: reason ? { reason } : undefined,
      signal: signal as GenericAbortSignal,
    }),

  updateUserRole: (
    id: number,
    role: string,
    signal?: AbortSignal
  ): Promise<AxiosResponse<User>> =>
    api.put(
      API_ENDPOINTS.USERS.ROLE(String(id)),
      { role },
      { signal: signal as GenericAbortSignal }
    ),

  updateUserStatus: (
    id: number,
    status: string,
    signal?: AbortSignal
  ): Promise<AxiosResponse<User>> =>
    api.put(
      API_ENDPOINTS.USERS.STATUS(String(id)),
      { status },
      { signal: signal as GenericAbortSignal }
    ),

  recordUserLogin: (
    id: number,
    signal?: AbortSignal
  ): Promise<AxiosResponse<void>> =>
    api.post(
      API_ENDPOINTS.USERS.LOGIN(String(id)),
      {},
      { signal: signal as GenericAbortSignal }
    ),

  // ────────────────────────────────────────
  // Subscriptions
  // ────────────────────────────────────────

  getSubscriptions: (
    params: ApiParams = {},
    signal?: AbortSignal
  ): Promise<AxiosResponse<PaginatedSubscriptionsResponse>> =>
    api.get(API_ENDPOINTS.SUBSCRIPTIONS.BASE, {
      params,
      signal: signal as GenericAbortSignal,
    }),

  createSubscription: (
    data: CreateSubscriptionRequest,
    signal?: AbortSignal
  ): Promise<AxiosResponse<Subscription>> =>
    api.post(API_ENDPOINTS.SUBSCRIPTIONS.BASE, data, {
      signal: signal as GenericAbortSignal,
    }),

  getSubscription: (
    id: string,
    signal?: AbortSignal
  ): Promise<AxiosResponse<Subscription>> =>
    api.get(API_ENDPOINTS.SUBSCRIPTIONS.BY_ID(id), {
      signal: signal as GenericAbortSignal,
    }),

  updateSubscription: (
    id: string,
    data: UpdateSubscriptionRequest,
    signal?: AbortSignal
  ): Promise<AxiosResponse<Subscription>> =>
    api.patch(API_ENDPOINTS.SUBSCRIPTIONS.BY_ID(id), data, {
      signal: signal as GenericAbortSignal,
    }),

  deleteSubscription: (
    id: string,
    reason?: string,
    signal?: AbortSignal
  ): Promise<AxiosResponse<void>> =>
    api.delete(
      `${API_ENDPOINTS.SUBSCRIPTIONS.BY_ID(id)}${reason ? `?reason=${reason}` : ''}`,
      {
        signal: signal as GenericAbortSignal,
      }
    ),

  updateSubscriptionStatus: (
    id: string,
    data: SubscriptionStatusRequest,
    signal?: AbortSignal
  ): Promise<AxiosResponse<Subscription>> =>
    api.put(API_ENDPOINTS.SUBSCRIPTIONS.STATUS(id), data, {
      signal: signal as GenericAbortSignal,
    }),

  recordUsage: (
    id: string,
    data: UsageEventRequest,
    signal?: AbortSignal
  ): Promise<AxiosResponse<UsageResponse>> =>
    api.post(API_ENDPOINTS.SUBSCRIPTIONS.USAGE(id), data, {
      signal: signal as GenericAbortSignal,
    }),

  getUsageSummary: (
    id: string,
    periodDays: number = 30,
    signal?: AbortSignal
  ): Promise<AxiosResponse<UsageSummaryResponse>> =>
    api.get(API_ENDPOINTS.SUBSCRIPTIONS.USAGE_SUMMARY(id, periodDays), {
      signal: signal as GenericAbortSignal,
    }),

  checkUsageLimits: (
    id: string,
    data: UsageEventRequest,
    signal?: AbortSignal
  ): Promise<AxiosResponse<UsageLimitsResponse>> =>
    api.post(API_ENDPOINTS.SUBSCRIPTIONS.USAGE_CHECK(id), data, {
      signal: signal as GenericAbortSignal,
    }),

  // ────────────────────────────────────────
  // Products
  // ────────────────────────────────────────

  getProducts: (
    signal?: AbortSignal
  ): Promise<AxiosResponse<Product[] | ProductsResponse>> =>
    api.get(API_ENDPOINTS.PRODUCTS.BASE, {
      signal: signal as GenericAbortSignal,
    }),

  createProduct: (
    data: CreateProductRequest,
    signal?: AbortSignal
  ): Promise<AxiosResponse<Product>> =>
    api.post(API_ENDPOINTS.PRODUCTS.BASE, data, {
      signal: signal as GenericAbortSignal,
    }),

  updateProduct: (
    id: number,
    data: UpdateProductRequest,
    signal?: AbortSignal
  ): Promise<AxiosResponse<Product>> =>
    api.put(API_ENDPOINTS.PRODUCTS.BY_ID(String(id)), data, {
      signal: signal as GenericAbortSignal,
    }),

  // ────────────────────────────────────────
  // Product Tiers
  // ────────────────────────────────────────

  getProductTiers: (
    signal?: AbortSignal
  ): Promise<
    AxiosResponse<{ tiers: any[]; total: number; page: number; limit: number }>
  > =>
    api.get(API_ENDPOINTS.PRODUCT_TIERS.BASE, {
      signal: signal as GenericAbortSignal,
    }),

  getProductTiersByProduct: (
    productId: string,
    signal?: AbortSignal
  ): Promise<
    AxiosResponse<{ tiers: any[]; total: number; page: number; limit: number }>
  > =>
    api.get(API_ENDPOINTS.PRODUCT_TIERS.BY_PRODUCT(productId), {
      signal: signal as GenericAbortSignal,
    }),

  getProductTier: (
    productId: string,
    tierName: string,
    signal?: AbortSignal
  ): Promise<AxiosResponse<{ tier: any }>> =>
    api.get(
      API_ENDPOINTS.PRODUCT_TIERS.BY_PRODUCT_AND_TIER(productId, tierName),
      {
        signal: signal as GenericAbortSignal,
      }
    ),

  // ────────────────────────────────────────
  // Audit Log
  // ────────────────────────────────────────

  getAuditLogs: (
    params: ApiParams = {},
    signal?: AbortSignal
  ): Promise<AxiosResponse<PaginatedResponse<AuditLog>>> =>
    api.get(API_ENDPOINTS.AUDIT_LOGS.BASE, {
      params,
      signal: signal as GenericAbortSignal,
    }),

  getAuditLog: (
    id: string,
    signal?: AbortSignal
  ): Promise<AxiosResponse<AuditLog>> =>
    api.get(API_ENDPOINTS.AUDIT_LOGS.BY_ID(id), {
      signal: signal as GenericAbortSignal,
    }),

  // ────────────────────────────────────────
  // Health checks
  // ────────────────────────────────────────

  getHealth: (signal?: AbortSignal): Promise<AxiosResponse<any>> =>
    api.get(API_ENDPOINTS.STATUS.HEALTH, {
      signal: signal as GenericAbortSignal,
    }),

  getStatus: (signal?: AbortSignal): Promise<AxiosResponse<any>> =>
    api.get(API_ENDPOINTS.STATUS.CRM_STATUS, {
      signal: signal as GenericAbortSignal,
    }),

  getRoot: (signal?: AbortSignal): Promise<AxiosResponse<any>> =>
    axios.get(API_ENDPOINTS.STATUS.ROOT, {
      signal: signal as GenericAbortSignal,
    }),

  // ────────────────────────────────────────
  // User Roles (with environment-based static roles)
  // ────────────────────────────────────────

  getUserRoles: (
    signal?: AbortSignal
  ): Promise<AxiosResponse<{ roles: string[] }>> => {
    // Use environment configuration to decide whether to use static roles
    if (ENV_CONFIG.USE_STATIC_ROLES) {
      const staticRoles = ['global_admin', 'tenant_admin'];

      const mockResponse: AxiosResponse<{ roles: string[] }> = {
        data: { roles: staticRoles },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      return Promise.resolve(mockResponse);
    }

    // Otherwise, make the actual API call
    return api.get(API_ENDPOINTS.USERS.USER_ROLES, {
      signal: signal as GenericAbortSignal,
    });
  },

  // ────────────────────────────────────────
  // Transcript Analysis (uses transcriptsApi instance)
  // ────────────────────────────────────────

  submitTranscriptJob: (
    formData: FormData,
    signal?: AbortSignal
  ): Promise<
    AxiosResponse<{
      job_id: number;
      document_id: string;
      status: string;
    }>
  > => {
    const config = {
      signal: signal as GenericAbortSignal,
    };

    return transcriptsApi
      .post(API_ENDPOINTS.TRANSCRIPTS.SUBMIT_JOB, formData, config)
      .catch(error => {
        if (error.transcriptsApiError) {
          console.error(
            'Transcripts API Job Submission Error:',
            error.errorInfo
          );
          if (error.response?.status === 413) {
            throw new Error(
              'File too large. Please select a smaller file (max 10MB).'
            );
          } else if (error.response?.status === 415) {
            throw new Error(
              'Unsupported file type. Please select a PDF, JPG, JPEG, or PNG file.'
            );
          } else if (error.response?.status === 503) {
            throw new Error(
              'Transcripts service is temporarily unavailable. Please try again later.'
            );
          } else if (error.response?.status >= 500) {
            throw new Error(
              'Transcripts service error. Please try again later.'
            );
          } else if (error.response?.status >= 400) {
            throw new Error(
              'Invalid request. Please check your file and try again.'
            );
          } else if (!error.response) {
            throw new Error(
              'Unable to connect to transcripts service. Please check your connection.'
            );
          }
        }
        throw error;
      });
  },

  getJobStatus: (
    jobId: number,
    signal?: AbortSignal
  ): Promise<AxiosResponse<JobDiagnosticsResponse>> => {
    return transcriptsApi.get(API_ENDPOINTS.TRANSCRIPTS.GET_JOB_STATUS(jobId), {
      signal: signal as GenericAbortSignal,
    });
  },

  // --- Jobs List --- //
  getJobsList: (): Promise<AxiosResponse<JobsApiResponse>> => {
    // This now correctly uses the transcriptsApi instance
    return transcriptsApi.get(API_ENDPOINTS.TRANSCRIPTS.LIST_JOBS);
  },
};

// Also export for backward compatibility
export default apiHelpers;

// ──────────────────────────────────────────────────
// End of File: client/src/services/api.ts
// ──────────────────────────────────────────────────

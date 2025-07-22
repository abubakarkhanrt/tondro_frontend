/**
 * ──────────────────────────────────────────────────
 * File: src/services/authApi.ts
 * Description: Axios configuration and API helper functions for Authentication
 * Author: Muhammad Abubakar Khan
 * Created: 05-07-2025
 * Last Updated: 05-07-2025
 * ──────────────────────────────────────────────────
 */

import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type GenericAbortSignal,
} from 'axios';
import { ENV_CONFIG } from '../config/env';
import { type LoginRequest, type LoginResponse } from '../types';

// ────────────────────────────────────────
// Auth API Instance (dedicated backend via proxy)
// ────────────────────────────────────────
const authApi: AxiosInstance = axios.create({
  baseURL: ENV_CONFIG.AUTH_API_BASE_URL || '', // Proxy to dedicated auth backend
  timeout: ENV_CONFIG.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Crucial for sending cookies automatically
});

export const apiAuthHelpers = {
  login: (
    credentials: LoginRequest,
    signal?: AbortSignal,
    headers?: Record<string, string>
  ): Promise<AxiosResponse<LoginResponse>> =>
    authApi.post('auth/jwt/login', credentials, {
      signal: signal as GenericAbortSignal,
      ...(headers ? { headers } : {}),
    }),

  logout: (signal?: AbortSignal, headers?: Record<string, string>) =>
    authApi.post(
      'auth/jwt/logout',
      {},
      { signal: signal as GenericAbortSignal, ...(headers ? { headers } : {}) }
    ),

  refresh: (refreshToken: string, signal?: AbortSignal) =>
    authApi.post(
      'auth/jwt/refresh',
      { refresh_token: refreshToken },
      { signal: signal as GenericAbortSignal }
    ),

  getCurrentUser: (signal?: AbortSignal) =>
    authApi.get('auth/jwt/me', { signal: signal as GenericAbortSignal }),

  getCsrfToken: (signal?: AbortSignal) =>
    authApi.get('auth/jwt/csrf-token', {
      signal: signal as GenericAbortSignal,
    }),

  setupMfa: (
    userId: number,
    signal?: AbortSignal,
    headers?: Record<string, string>
  ): Promise<
    AxiosResponse<{ secret_key: string; otp_uri: string; message: string }>
  > =>
    authApi.post(
      `auth/jwt/mfa/setup?user_id=${userId}`,
      {},
      { signal: signal as GenericAbortSignal, ...(headers ? { headers } : {}) }
    ),

  verifyEnrollment: (
    data: {
      user_id: number;
      totp_code: string;
      device_id?: string;
    },
    signal?: AbortSignal,
    headers?: Record<string, string>
  ): Promise<AxiosResponse<LoginResponse>> =>
    authApi.post('auth/jwt/mfa/verify-enrollment', data, {
      signal: signal as GenericAbortSignal,
      ...(headers ? { headers } : {}),
    }),

  verifyMFA: (
    data: {
      user_id: number;
      totp_code: string;
      device_id?: string;
    },
    signal?: AbortSignal,
    headers?: Record<string, string>
  ): Promise<AxiosResponse<LoginResponse>> =>
    authApi.post('auth/jwt/mfa/verify', data, {
      signal: signal as GenericAbortSignal,
      ...(headers ? { headers } : {}),
    }),
};

// ──────────────────────────────────────────────────
// End of File: src/services/authApi.ts
// ──────────────────────────────────────────────────

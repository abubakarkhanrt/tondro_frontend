/**
 * ──────────────────────────────────────────────────
 * File: src/services/apiErrorUtils.ts
 * Description: Shared utilities for API error handling, including token refresh logic.
 * Author: Muhammad Abubakar Khan
 * Created: 18-07-2025
 * Last Updated: 18-07-2025
 * ──────────────────────────────────────────────────
 */

import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';
import { apiAuthHelpers } from './authApi';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

// ────────────────────────────────────────
// State for Token Refresh
// ────────────────────────────────────────

let isRefreshing = false;
let failedQueue: {
  resolve: (value: string) => void;
  reject: (reason?: any) => void;
}[] = [];

// ────────────────────────────────────────
// Queue Processing
// ────────────────────────────────────────

const processQueue = (
  error: AxiosError | null,
  token: string | null = null
) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });
  failedQueue = [];
};

// ────────────────────────────────────────
// Logout Handler
// ────────────────────────────────────────

export const handleAppLogout = (navigateToLogin: boolean): void => {
  // Clear all token formats for backward compatibility
  localStorage.clear();

  // Redirect to login
  if (navigateToLogin) {
    window.location.href = '/login';
  }
};

// ────────────────────────────────────────
// Auth Response Interceptor
// ────────────────────────────────────────

export const addApiResponseInterceptor = (axiosInstance: AxiosInstance) => {
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    async (error: unknown) => {
      // Don't handle cancelled requests
      if (axios.isCancel(error)) {
        return Promise.reject(error);
      }

      // Handle only Axios errors
      if (axios.isAxiosError(error)) {
        console.error(`API URL: ${error.config?.url} Error: ${error}`);
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // Handle only 401 Unauthorized errors that are not retries
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (isRefreshing) {
            return new Promise(function (resolve, reject) {
              failedQueue.push({ resolve, reject });
            })
              .then(token => {
                originalRequest.headers['Authorization'] = 'Bearer ' + token;
                return axiosInstance(originalRequest);
              })
              .catch(err => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (!refreshToken || refreshToken === 'undefined') {
              handleAppLogout(true);
              return Promise.reject(
                new Error('No refresh token, logging out.')
              );
            }

            const { data } = await apiAuthHelpers.refresh(refreshToken);
            const { access_token, refresh_token } = data;

            // Update local storage and original request
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);
            axiosInstance.defaults.headers.common['Authorization'] =
              'Bearer ' + access_token;
            originalRequest.headers['Authorization'] = 'Bearer ' + access_token;

            processQueue(null, access_token);
            return axiosInstance(originalRequest);
          } catch (refreshError: unknown) {
            processQueue(refreshError as AxiosError, null);
            handleAppLogout(true);
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        } else if (error.response?.status === 409) {
          return Promise.reject(
            new Error('Conflict: ' + getApiErrorMessage(error))
          );
        }

        return Promise.reject(error);
      }
    }
  );
};

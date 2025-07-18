/**
 * ──────────────────────────────────────────────────
 * File: src/services/transcriptsApi.ts
 * Description: Axios configuration and API helper functions for Transcripts service
 * Author: Muhammad Abubakar Khan
 * Created: 17-07-2025
 * Last Updated: 18-07-2025
 * ──────────────────────────────────────────────────
 */

import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
  type GenericAbortSignal,
} from 'axios';
import { ENV_CONFIG } from '../config/env';

// ────────────────────────────────────────
// Types and Interfaces
// ────────────────────────────────────────

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
// API Endpoints Configuration
// ────────────────────────────────────────

const API_ENDPOINTS = {
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

// Transcripts API instance (separate service)
const transcriptsApi: AxiosInstance = axios.create({
  baseURL: '', // Use relative URLs since we're now proxying through Next.js
  timeout: ENV_CONFIG.TRANSCRIPTS_API_TIMEOUT,
});

// ────────────────────────────────────────
// Request Interceptors
// ────────────────────────────────────────

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

// Transcripts API response interceptor (simpler, no auth redirects)
transcriptsApi.interceptors.response.use(
  (response: AxiosResponse) => {
    // Add debugging information for successful responses in development
    if (ENV_CONFIG.IS_DEVELOPMENT && ENV_CONFIG.ENABLE_DEBUG_LOGGING) {
      console.log('Transcripts API Response:', {
        url: response.config.url,
        method: response.config.method,
        status: response.status,
        statusText: response.statusText,
      });
    }
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
// Utility Functions
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
export const validateApiResponse = (response: any) => {
  if (ENV_CONFIG.IS_DEVELOPMENT && ENV_CONFIG.ENABLE_DEBUG_LOGGING) {
    console.log('Transcripts API Response Validation:', {
      hasData: !!response?.data,
      dataType: typeof response?.data,
      isArray: Array.isArray(response?.data),
      keys: response?.data ? Object.keys(response?.data) : [],
    });
  }
  return response;
};

// ────────────────────────────────────────
// API Helper Functions
// ────────────────────────────────────────

export const transcriptsApiHelpers = {
  // Create a new AbortController for each request
  createAbortController: (): AbortController => new AbortController(),

  // ────────────────────────────────────────
  // Transcript Analysis
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
export default transcriptsApiHelpers;

// ──────────────────────────────────────────────────
// End of File: src/services/transcriptsApi.ts
// ──────────────────────────────────────────────────

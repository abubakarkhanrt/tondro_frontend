/**
 * ──────────────────────────────────────────────────
 * File: src/config/env.ts
 * Description: Environment configuration for TondroAI CRM
 * Author: Muhammad Abubakar Khan
 * Created: 18-06-2025
 * Last Updated: 21-07-2025
 * ──────────────────────────────────────────────────
 */

// ────────────────────────────────────────
// Environment Configuration
// ────────────────────────────────────────

export const ENV_CONFIG = {
  // API Configuration
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_PATH, // proxy url
  API_TIMEOUT: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000', 10),
  API_BASE_PATH: 'api/crm',

  // Transcripts API Configuration (direct backend calls)
  // Replace transcripts proxy URL with direct backend URL
  TRANSCRIPTS_BACKEND_URL: process.env.NEXT_PUBLIC_TRANSCRIPTS_API_BASE_URL,
  TRANSCRIPTS_API_TIMEOUT: parseInt(
    process.env.NEXT_PUBLIC_TRANSCRIPTS_API_TIMEOUT || '60000',
    10
  ), // Longer timeout for file processing

  // Add frontend origin for CORS
  FRONTEND_ORIGIN: process.env.NEXT_PUBLIC_FRONTEND_ORIGIN,

  // Remove or rename old config
  // TRANSCRIPTS_API_BASE_URL: process.env.NEXT_PUBLIC_TRANSCRIPTS_API_BASE_URL,

  // Auth API Configuration (dedicated auth backend)
  AUTH_API_BASE_URL: process.env.NEXT_PUBLIC_AUTH_API_BASE_PATH,
  ORIGIN: process.env.NEXT_PUBLIC_ORIGIN,

  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_DEVELOPMENT: (process.env.NODE_ENV || 'development') === 'development',
  IS_PRODUCTION: (process.env.NODE_ENV || 'development') === 'production',

  // Debug Configuration
  DEBUG:
    (process.env.NEXT_PUBLIC_DEBUG ||
      process.env.REACT_APP_DEBUG ||
      'false') === 'true',

  // Authentication
  JWT_STORAGE_KEY: 'access_token',
  USER_EMAIL_STORAGE_KEY: 'user_email',

  // Default Values
  DEFAULT_PAGE_SIZE: 10,
  DEFAULT_TIMEOUT: 100000,
} as const;

// ────────────────────────────────────────
// Type Definitions
// ────────────────────────────────────────

export type EnvConfig = typeof ENV_CONFIG;

// ────────────────────────────────────────
// Validation
// ────────────────────────────────────────

export const validateEnvironment = (): void => {
  // Only validate in development mode
  if (ENV_CONFIG.IS_DEVELOPMENT) {
    console.log('Environment Configuration:', {
      API_BASE_URL: ENV_CONFIG.API_BASE_URL,
      TRANSCRIPTS_BACKEND_URL: ENV_CONFIG.TRANSCRIPTS_BACKEND_URL,
      NODE_ENV: ENV_CONFIG.NODE_ENV,
      DEBUG: ENV_CONFIG.DEBUG,
    });
  }
};

// ────────────────────────────────────────
// Development Helpers
// ────────────────────────────────────────

export const logEnvironment = (): void => {
  if (ENV_CONFIG.IS_DEVELOPMENT && ENV_CONFIG.DEBUG) {
    console.log('Environment Configuration:', {
      API_BASE_URL: ENV_CONFIG.API_BASE_URL,
      TRANSCRIPTS_BACKEND_URL: ENV_CONFIG.TRANSCRIPTS_BACKEND_URL,
      NODE_ENV: ENV_CONFIG.NODE_ENV,
      DEBUG: ENV_CONFIG.DEBUG,
    });
  }
};

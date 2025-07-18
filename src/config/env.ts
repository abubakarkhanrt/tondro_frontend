/**
 * ──────────────────────────────────────────────────
 * File: src/config/env.ts
 * Description: Environment configuration for TondroAI CRM
 * Author: Muhammad Abubakar Khan
 * Created: 18-06-2025
 * Last Updated: 08-07-2025
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

  // Transcripts API Configuration (separate service)
  TRANSCRIPTS_API_BASE_URL: process.env.NEXT_PUBLIC_TRANSCRIPTS_API_BASE_URL,
  TRANSCRIPTS_API_TIMEOUT: parseInt(
    process.env.NEXT_PUBLIC_TRANSCRIPTS_API_TIMEOUT || '60000',
    10
  ), // Longer timeout for file processing

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

  // Feature Flags
  ENABLE_AUDIT_LOG:
    (process.env.NEXT_PUBLIC_ENABLE_AUDIT_LOG ||
      process.env.REACT_APP_ENABLE_AUDIT_LOG ||
      'true') !== 'false',
  ENABLE_DOMAIN_MANAGEMENT:
    (process.env.NEXT_PUBLIC_ENABLE_DOMAIN_MANAGEMENT ||
      process.env.REACT_APP_ENABLE_DOMAIN_MANAGEMENT ||
      'true') !== 'false',
  USE_STATIC_ROLES: process.env.NEXT_PUBLIC_USE_STATIC_ROLES === 'true',
  ENABLE_DEBUG_LOGGING: process.env.NEXT_PUBLIC_ENABLE_DEBUG_LOGGING === 'true',

  // Authentication
  JWT_STORAGE_KEY: 'access_token',
  //JWT_STORAGE_KEY: 'jwt_token',
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
      TRANSCRIPTS_API_BASE_URL: ENV_CONFIG.TRANSCRIPTS_API_BASE_URL,
      NODE_ENV: ENV_CONFIG.NODE_ENV,
      DEBUG: ENV_CONFIG.DEBUG,
      ENABLE_AUDIT_LOG: ENV_CONFIG.ENABLE_AUDIT_LOG,
      ENABLE_DOMAIN_MANAGEMENT: ENV_CONFIG.ENABLE_DOMAIN_MANAGEMENT,
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
      TRANSCRIPTS_API_BASE_URL: ENV_CONFIG.TRANSCRIPTS_API_BASE_URL,
      NODE_ENV: ENV_CONFIG.NODE_ENV,
      DEBUG: ENV_CONFIG.DEBUG,
      ENABLE_AUDIT_LOG: ENV_CONFIG.ENABLE_AUDIT_LOG,
      ENABLE_DOMAIN_MANAGEMENT: ENV_CONFIG.ENABLE_DOMAIN_MANAGEMENT,
    });
  }
};

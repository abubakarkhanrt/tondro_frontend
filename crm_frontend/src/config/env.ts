/**
 * ──────────────────────────────────────────────────
 * File: src/config/env.ts
 * Description: Environment configuration for TondroAI CRM Next.js app
 * Author: Muhammad Abubakar Khan
 * Created: 19-06-2025
 * Last Updated: 30-06-2025
 * ──────────────────────────────────────────────────
 */

// ────────────────────────────────────────
// Environment Configuration
// ────────────────────────────────────────

export const ENV_CONFIG = {
  // API Configuration
  //API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || process.env.REACT_APP_API_BASE_URL || 'https://8080-tondroai-rolus.cluster-sjj3zsn3ffchivwccxsgsswqek.cloudworkstations.dev/api',
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081/api',
  API_TIMEOUT: parseInt(process.env.NEXT_PUBLIC_TIMEOUT || process.env.REACT_APP_TIMEOUT || '10000'),

  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_DEVELOPMENT: (process.env.NODE_ENV || 'development') === 'development',
  IS_PRODUCTION: (process.env.NODE_ENV || 'development') === 'production',

  // Debug Configuration
  DEBUG: (process.env.NEXT_PUBLIC_DEBUG || process.env.REACT_APP_DEBUG || 'false') === 'true',

  // Feature Flags
  ENABLE_AUDIT_LOG: (process.env.NEXT_PUBLIC_ENABLE_AUDIT_LOG || process.env.REACT_APP_ENABLE_AUDIT_LOG || 'true') !== 'false',
  ENABLE_DOMAIN_MANAGEMENT:
    (process.env.NEXT_PUBLIC_ENABLE_DOMAIN_MANAGEMENT || process.env.REACT_APP_ENABLE_DOMAIN_MANAGEMENT || 'true') !== 'false',

  // Authentication
  JWT_STORAGE_KEY: 'jwt_token',
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
      NODE_ENV: ENV_CONFIG.NODE_ENV,
      DEBUG: ENV_CONFIG.DEBUG,
      ENABLE_AUDIT_LOG: ENV_CONFIG.ENABLE_AUDIT_LOG,
      ENABLE_DOMAIN_MANAGEMENT: ENV_CONFIG.ENABLE_DOMAIN_MANAGEMENT,
    });
  }
}; 
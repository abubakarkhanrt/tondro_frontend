/**
 * ──────────────────────────────────────────────────
 * File: client/src/config/env.ts
 * Description: Environment configuration for TondroAI CRM React app
 * Author: Muhammad Abubakar Khan
 * Created: 19-06-2025
 * Last Updated: 23-06-2025
 * ──────────────────────────────────────────────────
 */

// ────────────────────────────────────────
// Environment Configuration
// ────────────────────────────────────────

export const ENV_CONFIG = {
  // API Configuration
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL!,
  API_TIMEOUT: parseInt(process.env.REACT_APP_TIMEOUT!),
  
  // Environment
  NODE_ENV: process.env.NODE_ENV!,
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  
  // Debug Configuration
  DEBUG: process.env.REACT_APP_DEBUG === 'true',
  
  // Feature Flags
  ENABLE_AUDIT_LOG: process.env.REACT_APP_ENABLE_AUDIT_LOG !== 'false',
  ENABLE_DOMAIN_MANAGEMENT: process.env.REACT_APP_ENABLE_DOMAIN_MANAGEMENT !== 'false',
  
  // Authentication
  JWT_STORAGE_KEY: 'jwt_token',
  USER_EMAIL_STORAGE_KEY: 'user_email',
  
  // Default Values
  DEFAULT_PAGE_SIZE: 10,
  DEFAULT_TIMEOUT: 5000,
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
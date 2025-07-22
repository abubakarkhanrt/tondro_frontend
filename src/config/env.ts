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
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_PATH,
  API_TIMEOUT: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000', 10),
  API_BASE_PATH: 'api/crm',

  // Transcripts API Configuration (direct backend calls)
  TRANSCRIPTS_API_BASE_URL: process.env.NEXT_PUBLIC_TRANSCRIPTS_API_BASE_PATH,
  TRANSCRIPTS_API_TIMEOUT: parseInt(
    process.env.NEXT_PUBLIC_TRANSCRIPTS_API_TIMEOUT || '60000',
    10
  ), // Longer timeout for file processing

  // Auth API Configuration (dedicated auth backend)
  AUTH_API_BASE_URL: process.env.NEXT_PUBLIC_AUTH_API_BASE_PATH,

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

  // Default Values
  DEFAULT_PAGE_SIZE: 10,
  DEFAULT_TIMEOUT: 100000,
} as const;

// ────────────────────────────────────────
// Type Definitions
// ────────────────────────────────────────

export type EnvConfig = typeof ENV_CONFIG;

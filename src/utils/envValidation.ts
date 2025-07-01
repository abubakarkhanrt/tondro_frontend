/**
 * ──────────────────────────────────────────────────
 * File: src/utils/envValidation.ts
 * Description: Environment variable validation
 * Author: Muhammad Abubakar Khan
 * Created: 01-07-2025
 * Last Updated: 01-07-2025
 * ──────────────────────────────────────────────────
 */

import { ENV_CONFIG } from '../config/env';

export const validateEnvironment = (): void => {
  const requiredVars = [
    'NEXT_PUBLIC_API_BASE_URL',
    'NEXT_PUBLIC_API_BASE_PATH',
  ];

  const missingVars = requiredVars.filter(
    varName => !process.env[varName]
  );

  if (missingVars.length > 0) {
    console.warn(
      `⚠️  Missing environment variables: ${missingVars.join(', ')}`
    );
    console.warn('Using default values...');
  }

  // Log current configuration in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Environment Configuration:', {
      API_BASE_URL: ENV_CONFIG.API_BASE_URL,
      API_BASE_PATH: ENV_CONFIG.API_BASE_PATH,
      API_TIMEOUT: ENV_CONFIG.API_TIMEOUT,
      USE_STATIC_ROLES: ENV_CONFIG.USE_STATIC_ROLES,
      ENABLE_DEBUG_LOGGING: ENV_CONFIG.ENABLE_DEBUG_LOGGING,
    });
  }
}; 
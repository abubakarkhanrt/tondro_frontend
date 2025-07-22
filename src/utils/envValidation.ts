/**
 * ──────────────────────────────────────────────────
 * File: src/utils/envValidation.ts
 * Description: Environment variable validation
 * Author: Muhammad Abubakar Khan
 * Created: 01-07-2025
 * Last Updated: 01-07-2025
 * ──────────────────────────────────────────────────
 */

import { ENV_CONFIG } from '@/config/env';

export const validateEnvironment = (): void => {
  const requiredVars = [
    'API_BASE_URL',
    'AUTH_API_BASE_URL',
    'TRANSCRIPTS_API_BASE_URL',
  ];

  const missingVars = requiredVars.filter(varName => !ENV_CONFIG[varName]);

  if (missingVars.length > 0) {
    console.warn(
      `⚠️  Missing environment variables: ${missingVars.join(', ')}`
    );
  }
};

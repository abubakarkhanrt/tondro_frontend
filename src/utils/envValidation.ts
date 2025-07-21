/**
 * ──────────────────────────────────────────────────
 * File: src/utils/envValidation.ts
 * Description: Environment variable validation
 * Author: Muhammad Abubakar Khan
 * Created: 01-07-2025
 * Last Updated: 01-07-2025
 * ──────────────────────────────────────────────────
 */

export const validateEnvironment = (): void => {
  const requiredVars = [
    'NEXT_PUBLIC_API_BASE_URL',
    'NEXT_PUBLIC_API_BASE_PATH',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.warn(
      `⚠️  Missing environment variables: ${missingVars.join(', ')}`
    );
    console.warn('Using default values...');
  }
};

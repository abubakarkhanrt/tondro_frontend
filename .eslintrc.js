/**
 * ──────────────────────────────────────────────────
 * File: .eslintrc.js
 * Description: ESLint configuration for TondroAI CRM TypeScript project
 * Author: Muhammad Abubakar Khan
 * Created: 18-06-2025
 * Last Updated: 20-06-2025
 * ──────────────────────────────────────────────────
 */

module.exports = {
  extends: ['next/core-web-vitals', 'next/typescript'],
  rules: {
    'no-console': 'off',
    'prefer-const': 'error',
    'no-var': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    'react-hooks/exhaustive-deps': 'off',
  },
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
};

// ──────────────────────────────────────────────────
// End of File: .eslintrc.js
// ──────────────────────────────────────────────────

/**
 * ──────────────────────────────────────────────────
 * File: client/eslint-rules/index.js
 * Description: ESLint plugin for custom rules
 * Author: Muhammad Abubakar Khan
 * Created: 18-06-2025
 * Last Updated: 20-06-2025
 * ──────────────────────────────────────────────────
 */

const requireTestId = require('./require-testid.js');

module.exports = {
  rules: {
    'require-testid': requireTestId,
  },
}; 
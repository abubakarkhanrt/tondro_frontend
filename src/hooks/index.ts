/**
 * ──────────────────────────────────────────────────
 * File: src/hooks/index.ts
 * Description: Barrel export file for all hooks
 * Author: Muhammad Abubakar Khan
 * Created: 07-07-2025
 * Last Updated: 29-07-2025
 * ──────────────────────────────────────────────────
 */

// ────────────────────────────────────────
// Shared Hooks
// ────────────────────────────────────────

export { useEntityState, type BaseEntityState } from './useEntityState';
export { usePagination } from './usePagination';
export { useEntityData } from './useEntityData';

// ────────────────────────────────────────
// Feature-Specific Hooks
// ────────────────────────────────────────

export { useProductTiers, useProductTier } from './useProductTiers';

// ────────────────────────────────────────
// End of File: src/hooks/index.ts
// ──────────────────────────────────────────────────

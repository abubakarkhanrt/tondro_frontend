/**
 * ──────────────────────────────────────────────────
 * File: client/src/utils/tierFormatter.ts
 * Description: Utility functions for formatting tier names from backend to user-friendly display
 * Author: Muhammad Abubakar Khan
 * Created: 18-06-2025
 * Last Updated: 27-06-2025
 * ──────────────────────────────────────────────────
 */

// Tier color mapping for consistent visual representation
export const TIER_COLORS = {
  // Admissions tiers - Blue shades
  ADMISSIONS: 'primary',
  // Transcript tiers - Green shades
  TRANSCRIPT: 'success',
} as const;

export type TierColorType = (typeof TIER_COLORS)[keyof typeof TIER_COLORS];

/**
 * Gets the standardized color for a tier based on its category
 *
 * @param tierName - The tier name from backend
 * @returns The color type for the tier category
 *
 * @example
 * getTierColor("admissions_200"); // "primary"
 */
export function getTierColor(tierName: string): TierColorType {
  const lowerTierName = tierName.toLowerCase();

  // Admissions tiers
  if (lowerTierName.includes('admissions')) {
    return TIER_COLORS.ADMISSIONS;
  } else if (lowerTierName.includes('transcript')) {
    return TIER_COLORS.TRANSCRIPT;
  }
  // Default fallback
  return TIER_COLORS.ADMISSIONS;
}

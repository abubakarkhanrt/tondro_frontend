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

/**
 * Formats a tier name from backend format to user-friendly display format
 * Removes redundant product names since they're displayed separately
 *
 * @param tierName - The tier name from backend (e.g., "admissions_200")
 * @returns Formatted tier name for display (e.g., "Admis 200")
 *
 */
export function formatTierName(tierName: string): string {
  if (!tierName) return '';

  // Handle common tier patterns - remove redundant product names
  const tierMappings: Record<string, string> = {
    admissions_200: 'Admis 200',
    admissions_500: 'Admis 500',
    admissions_1000: 'Admis 1000',
    transcripts_500: 'Trans 500',
    transcripts_1000: 'Trans 1000',
    transcripts_2000: 'Trans 2000',
  };

  // Check if we have a direct mapping
  const mappedTier = tierMappings[tierName.toLowerCase()];
  if (mappedTier) {
    return mappedTier;
  }
  return tierName;
}

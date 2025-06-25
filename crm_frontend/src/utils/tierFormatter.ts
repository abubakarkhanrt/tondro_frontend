/**
 * ──────────────────────────────────────────────────
 * File: client/src/utils/tierFormatter.ts
 * Description: Utility functions for formatting tier names from backend to user-friendly display
 * Author: Muhammad Abubakar Khan
 * Created: 18-06-2025
 * Last Updated: 25-06-2025
 * ──────────────────────────────────────────────────
 */

// Tier color mapping for consistent visual representation
export const TIER_COLORS = {
  // Admissions tiers - Blue shades
  ADMISSIONS: 'primary',
  // Transcript tiers - Green shades
  TRANSCRIPT: 'success',
  // Enterprise tiers - Purple shades
  ENTERPRISE: 'secondary',
  // Professional tiers - Orange shades
  PROFESSIONAL: 'warning',
  // Basic/Standard tiers - Grey shades
  BASIC: 'default',
  // Premium tiers - Gold/Amber shades
  PREMIUM: 'info',
} as const;

export type TierColorType = (typeof TIER_COLORS)[keyof typeof TIER_COLORS];

// Tier limits mapping for usage display
export const TIER_LIMITS = {
  // Admissions tiers
  'admissions_tier_1': 500,
  'admissions_tier_2': 1000,
  'admissions_tier_3': 2000,
  
  // Transcript tiers
  'transcripts_tier_1': 500,
  'transcripts_tier_2': 1000,
  'transcripts_tier_3': 2000,
  
  // Generic tiers
  'tier_1': 500,
  'tier_2': 1000,
  'tier_3': 2000,
} as const;

/**
 * Gets the standardized color for a tier based on its category
 *
 * @param tierName - The tier name from backend
 * @returns The color type for the tier category
 *
 * @example
 * getTierColor("admissions_tier_1"); // "primary"
 * getTierColor("transcript_premium"); // "success"
 */
export function getTierColor(tierName: string): TierColorType {
  if (!tierName) return TIER_COLORS.BASIC;

  const lowerTierName = tierName.toLowerCase();

  // Admissions tiers
  if (
    lowerTierName.includes('admissions') ||
    lowerTierName.includes('admission')
  ) {
    return TIER_COLORS.ADMISSIONS;
  }

  // Transcript tiers
  if (lowerTierName.includes('transcript')) {
    return TIER_COLORS.TRANSCRIPT;
  }

  // Enterprise tiers
  if (lowerTierName.includes('enterprise')) {
    return TIER_COLORS.ENTERPRISE;
  }

  // Professional tiers
  if (lowerTierName.includes('professional')) {
    return TIER_COLORS.PROFESSIONAL;
  }

  // Premium tiers
  if (lowerTierName.includes('premium')) {
    return TIER_COLORS.PREMIUM;
  }

  // Basic/Standard tiers
  if (
    lowerTierName.includes('basic') ||
    lowerTierName.includes('standard') ||
    lowerTierName.includes('starter')
  ) {
    return TIER_COLORS.BASIC;
  }

  // Default fallback
  return TIER_COLORS.BASIC;
}

/**
 * Formats a tier name from backend format to user-friendly display format
 * Removes redundant product names since they're displayed separately
 * 
 * @param tierName - The tier name from backend (e.g., "admissions_tier_1")
 * @returns Formatted tier name for display (e.g., "Tier 1")
 * 
 * @example
 * formatTierName("admissions_tier_1"); // "Tier 1"
 * formatTierName("transcript_basic"); // "Basic"
 * formatTierName("enterprise_premium"); // "Premium"
 */
export function formatTierName(tierName: string): string {
  if (!tierName) return '';
  
  // Handle common tier patterns - remove redundant product names
  const tierMappings: Record<string, string> = {
    'admissions_tier_1': 'Tier 1',
    'admissions_tier_2': 'Tier 2',
    'admissions_tier_3': 'Tier 3',
    'transcripts_tier_1': 'Tier 1',
    'transcripts_tier_2': 'Tier 2',
    'transcripts_tier_3': 'Tier 3'
  };

  // Check if we have a direct mapping
  if (tierMappings[tierName.toLowerCase()]) {
    return tierMappings[tierName.toLowerCase()];
  }

  // Generic formatting for unknown tiers - remove common product prefixes
  const lowerTierName = tierName.toLowerCase();
  let cleanedTierName = tierName;
  
  // Remove common product prefixes
  if (lowerTierName.startsWith('admissions_')) {
    cleanedTierName = tierName.replace(/^admissions_/i, '');
  } else if (lowerTierName.startsWith('transcript_') || lowerTierName.startsWith('transcripts_')) {
    cleanedTierName = tierName.replace(/^transcript[s]?_/i, '');
  } else if (lowerTierName.startsWith('enterprise_')) {
    cleanedTierName = tierName.replace(/^enterprise_/i, '');
  }

  // Format the cleaned tier name
  return cleanedTierName
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Formats multiple tier names for display
 *
 * @param tierNames - Array of tier names from backend
 * @returns Array of formatted tier names
 *
 * @example
 * formatTierNames(["admissions_tier_1", "enterprise_premium"]);
 * // ["Admissions Tier 1", "Enterprise Premium"]
 */
export function formatTierNames(tierNames: string[]): string[] {
  return tierNames.map(formatTierName);
}

/**
 * Gets the maximum limit for a given tier
 *
 * @param tierName - The tier name from backend
 * @returns The maximum limit for the tier, or null if not found
 *
 * @example
 * getTierLimit("transcripts_tier_3"); // 2000
 * getTierLimit("admissions_tier_1"); // 500
 */
export function getTierLimit(tierName: string): number | null {
  if (!tierName) return null;
  
  const lowerTierName = tierName.toLowerCase();
  return TIER_LIMITS[lowerTierName as keyof typeof TIER_LIMITS] || null;
}

/**
 * Formats usage display with current usage and tier limit
 *
 * @param currentUsage - Current usage value
 * @param tierName - The tier name from backend
 * @returns Formatted usage string (e.g., "50/2000") or just current usage if limit not found
 *
 * @example
 * formatUsageDisplay(50, "transcripts_tier_3"); // "50/2000"
 * formatUsageDisplay(100, "unknown_tier"); // "100"
 */
export function formatUsageDisplay(currentUsage: number | string | null, tierName: string): string {
  if (currentUsage === null || currentUsage === undefined) {
    return '0';
  }
  
  const usage = typeof currentUsage === 'string' ? parseInt(currentUsage, 10) || 0 : currentUsage;
  const limit = getTierLimit(tierName);
  
  if (limit !== null) {
    return `${usage}/${limit}`;
  }
  
  return usage.toString();
}

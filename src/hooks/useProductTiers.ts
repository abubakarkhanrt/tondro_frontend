/**
 * ──────────────────────────────────────────────────
 * File: src/hooks/useProductTiers.ts
 * Description: Custom hook for managing product tiers data
 * Author: Muhammad Abubakar Khan
 * Created: 24-06-2025
 * Last Updated: 04-07-2025
 * ──────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react';
import { apiHelpers } from '../services/api';
import type { Product, ProductTier } from '../types';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

// ────────────────────────────────────────
// Hook Interface
// ────────────────────────────────────────

interface UseProductTiersReturn {
  tiers: ProductTier[];
  loading: boolean;
  error: string | null;
  refetch: (products: Product[]) => Promise<void>;
  getTierByProductAndName: (
    productId: string,
    tierName: string
  ) => ProductTier | undefined;
  getTiersByProductId: (productId: string) => string[];
}

// ────────────────────────────────────────
// Hook Implementation
// ────────────────────────────────────────

export const useProductTiers = (): UseProductTiersReturn => {
  const [tiers, setTiers] = useState<ProductTier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ────────────────────────────────────────
  // Fetch All Tiers (Updated to fetch per product)
  // ────────────────────────────────────────

  const fetchTiers = useCallback(async (products: Product[]) => {
    try {
      setLoading(true);
      setError(null);

      const allTiers: ProductTier[] = [];

      for (const product of products) {
        try {
          const controller = apiHelpers.createAbortController();
          const response = await apiHelpers.getProductTiersByProduct(
            String(product.id),
            controller.signal
          );

          if (response.data.product_tiers) {
            allTiers.push(...response.data.product_tiers);
          }
        } catch (err: unknown) {
          console.warn(`Failed to fetch tiers for product ${product.id}:`, err);
          // Continue with other products even if one fails
        }
      }

      setTiers(allTiers);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to fetch product tiers'));
      setTiers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ────────────────────────────────────────
  // Utility Functions
  // ────────────────────────────────────────

  const getTierByProductAndName = useCallback(
    (productId: string, tierName: string): ProductTier | undefined => {
      return tiers.find(
        tier => tier.product_id === productId && tier.tier_name === tierName
      );
    },
    [tiers]
  );

  const getTiersByProductId = useCallback(
    (productId: string): string[] => {
      if (!productId) return [];
      return tiers
        .filter(tier => tier.product_id === productId)
        .map(tier => tier.tier_name);
    },
    [tiers]
  );

  return {
    tiers,
    loading,
    error,
    refetch: fetchTiers,
    getTierByProductAndName,
    getTiersByProductId,
  };
};

// ────────────────────────────────────────
// Single Tier Hook
// ────────────────────────────────────────

interface UseProductTierReturn {
  tier: ProductTier | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useProductTier = (
  productId: string,
  tierName: string
): UseProductTierReturn => {
  const [tier, setTier] = useState<ProductTier | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTier = useCallback(async () => {
    if (!productId || !tierName) {
      setTier(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const controller = apiHelpers.createAbortController();
      const response = await apiHelpers.getProductTier(
        productId,
        tierName,
        controller.signal
      );

      setTier(response.data.tier);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to fetch product tier'));
      setTier(null);
    } finally {
      setLoading(false);
    }
  }, [productId, tierName]);

  useEffect(() => {
    fetchTier();
  }, [fetchTier]);

  return {
    tier,
    loading,
    error,
    refetch: fetchTier,
  };
};

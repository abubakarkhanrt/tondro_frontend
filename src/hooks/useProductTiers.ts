/**
 * ──────────────────────────────────────────────────
 * File: src/hooks/useProductTiers.ts
 * Description: Custom hook for managing product tiers data
 * Author: Muhammad Abubakar Khan
 * Created: 24-06-2025
 * Last Updated: 02-07-2025
 * ──────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react';
import { apiHelpers } from '../services/api';
import type { ProductTier } from '../types';

// ────────────────────────────────────────
// Hook Interface
// ────────────────────────────────────────

interface UseProductTiersReturn {
  tiers: ProductTier[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getTierByProductAndName: (
    productId: string,
    tierName: string
  ) => ProductTier | undefined;
  getTiersByProduct: (productId: string) => ProductTier[];
}

// ────────────────────────────────────────
// Hook Implementation
// ────────────────────────────────────────

export const useProductTiers = (): UseProductTiersReturn => {
  const [tiers, setTiers] = useState<ProductTier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ────────────────────────────────────────
  // Fetch All Tiers
  // ────────────────────────────────────────

  const fetchTiers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const controller = apiHelpers.createAbortController();
      const response = await apiHelpers.getProductTiers(controller.signal);

      setTiers(response.data.tiers || []);
    } catch (err: any) {
      console.error('Error fetching product tiers:', err);
      setError(err.response?.data?.message || 'Failed to fetch product tiers');
      setTiers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ────────────────────────────────────────
  // Initial Load
  // ────────────────────────────────────────

  useEffect(() => {
    fetchTiers();
  }, [fetchTiers]);

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

  const getTiersByProduct = useCallback(
    (productId: string): ProductTier[] => {
      return tiers.filter(tier => tier.product_id === productId);
    },
    [tiers]
  );

  return {
    tiers,
    loading,
    error,
    refetch: fetchTiers,
    getTierByProductAndName,
    getTiersByProduct,
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
    } catch (err: any) {
      console.error('Error fetching product tier:', err);
      setError(err.response?.data?.message || 'Failed to fetch product tier');
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

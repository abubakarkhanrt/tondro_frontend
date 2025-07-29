/**
 * ──────────────────────────────────────────────────
 * File: src/hooks/useEntityData.ts
 * Description: Shared data fetching hook for entity components
 * Author: Muhammad Abubakar Khan
 * Created: 07-07-2025
 * Last Updated: 07-07-2025
 * ──────────────────────────────────────────────────
 */

import { useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { apiHelpers } from '../services/api';
import type { BaseEntityState, PaginationState } from './useEntityState';
import type { ApiParams, FilterParams } from '../types';

// ────────────────────────────────────────
// Type Definitions
// ────────────────────────────────────────

interface FetchOptions {
  signal?: AbortSignal;
  params?: ApiParams;
}

interface UseEntityDataOptions<T, F = FilterParams> {
  fetchFunction: (
    options?: FetchOptions
  ) => Promise<{ data: T[] | { items: T[]; total: number } }>;
  filters: F;
  pagination: PaginationState;
  enabled?: boolean;
  onSuccess?: (data: T[], total: number) => void;
  onError?: (error: string) => void;
}

interface UseEntityDataReturn {
  fetchData: () => Promise<void>;
  refetch: () => Promise<void>;
  cancelRequest: () => void;
  isInitialized: boolean;
}

// ────────────────────────────────────────
// Hook Implementation
// ────────────────────────────────────────

export function useEntityData<T, F = FilterParams>(
  entityState: BaseEntityState<T>,
  setEntityState: React.Dispatch<React.SetStateAction<BaseEntityState<T>>>,
  setPagination: React.Dispatch<React.SetStateAction<PaginationState>>,
  options: UseEntityDataOptions<T, F>
): UseEntityDataReturn {
  const {
    fetchFunction,
    filters,
    pagination,
    enabled = true,
    onSuccess,
    onError,
  } = options;
  const isInitializedRef = useRef<boolean>(false);

  // ────────────────────────────────────────
  // Fetch Data Function
  // ────────────────────────────────────────

  const fetchData = useCallback(async (): Promise<void> => {
    // Cancel any existing request
    if (entityState.abortController) {
      entityState.abortController.abort();
    }

    // Create new abort controller
    const controller = apiHelpers.createAbortController();
    setEntityState(prev => ({
      ...prev,
      loading: true,
      error: '',
      abortController: controller,
    }));

    try {
      // Check authentication token
      const token = localStorage.getItem('access_token');
      if (!token || token === 'undefined' || token === 'null') {
        throw new Error('Authentication token not found. Please login again.');
      }

      // Prepare API parameters
      const apiParams = {
        page: pagination.page + 1, // Convert to 1-based for API
        page_size: pagination.page_size,
        ...filters,
      };

      // Remove empty parameters
      Object.keys(apiParams).forEach(key => {
        if (
          apiParams[key as keyof typeof apiParams] === '' ||
          apiParams[key as keyof typeof apiParams] === null ||
          apiParams[key as keyof typeof apiParams] === undefined
        ) {
          delete apiParams[key as keyof typeof apiParams];
        }
      });

      // Fetch data
      const response = await fetchFunction({
        signal: controller.signal,
        params: apiParams,
      });

      // Handle different response formats
      let data: T[] = [];
      let total: number = 0;

      if (Array.isArray(response.data)) {
        // Direct array format
        data = response.data;
        total = response.data.length;
      } else if (
        response.data &&
        typeof response.data === 'object' &&
        'items' in response.data
      ) {
        // Paginated format
        data = response.data.items || [];
        total = response.data.total || 0;
      } else {
        console.warn('Unexpected response format:', response.data);
        data = [];
        total = 0;
      }

      // Update state
      setEntityState(prev => ({
        ...prev,
        data,
        loading: false,
        error: '',
        abortController: null,
      }));

      setPagination(prev => ({
        ...prev,
        total,
      }));

      // Call success callback
      if (onSuccess) {
        onSuccess(data, total);
      }

      isInitializedRef.current = true;
    } catch (error: unknown) {
      // Don't show error for cancelled requests
      if (
        axios.isCancel(error) ||
        (error instanceof Error && error.name === 'AbortError')
      ) {
        return;
      }

      console.error('Error fetching data:', error);

      let errorMessage = 'Failed to load data. Please try again.';

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          errorMessage = 'Authentication failed. Please login again.';
        } else if (error.response?.status === 403) {
          errorMessage =
            'Access denied. You do not have permission to view this data.';
        } else if (error.message) {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setEntityState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        abortController: null,
      }));

      // Call error callback
      if (onError) {
        onError(errorMessage);
      }
    }
  }, [
    entityState.abortController,
    setEntityState,
    setPagination,
    fetchFunction,
    filters,
    pagination.page,
    pagination.page_size,
    onSuccess,
    onError,
  ]);

  // ────────────────────────────────────────
  // Refetch Function
  // ────────────────────────────────────────

  const refetch = useCallback(async (): Promise<void> => {
    await fetchData();
  }, [fetchData]);

  // ────────────────────────────────────────
  // Cancel Request Function
  // ────────────────────────────────────────

  const cancelRequest = useCallback((): void => {
    if (entityState.abortController) {
      entityState.abortController.abort();
      setEntityState(prev => ({
        ...prev,
        abortController: null,
      }));
    }
  }, [entityState.abortController, setEntityState]);

  // ────────────────────────────────────────
  // Effect for Auto-fetching
  // ────────────────────────────────────────

  useEffect(() => {
    if (enabled) {
      fetchData();
    }

    // Cleanup on unmount
    return () => {
      if (entityState.abortController) {
        entityState.abortController.abort();
      }
    };
  }, []);

  return {
    fetchData,
    refetch,
    cancelRequest,
    isInitialized: isInitializedRef.current,
  };
}

// ────────────────────────────────────────
// End of File: src/hooks/useEntityData.ts
// ──────────────────────────────────────────────────

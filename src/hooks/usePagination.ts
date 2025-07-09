/**
 * ──────────────────────────────────────────────────
 * File: src/hooks/usePagination.ts
 * Description: Shared pagination hook for entity components
 * Author: Muhammad Abubakar Khan
 * Created: 07-07-2025
 * Last Updated: 07-07-2025
 * ──────────────────────────────────────────────────
 */

import { useCallback } from 'react';
import type { PaginationState } from './useEntityState';

// ────────────────────────────────────────
// Hook Interface
// ────────────────────────────────────────

interface UsePaginationReturn {
  handlePageChange: (event: unknown, newPage: number) => void;
  handlePageSizeChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  resetToFirstPage: () => void;
  goToPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  getTotalPages: () => number;
  hasNextPage: () => boolean;
  hasPreviousPage: () => boolean;
}

// ────────────────────────────────────────
// Hook Implementation
// ────────────────────────────────────────

export function usePagination(
  pagination: PaginationState,
  setPagination: React.Dispatch<React.SetStateAction<PaginationState>>
): UsePaginationReturn {
  // ────────────────────────────────────────
  // Page Change Handler
  // ────────────────────────────────────────

  const handlePageChange = useCallback(
    (_event: unknown, newPage: number): void => {
      setPagination(prev => ({ ...prev, page: newPage }));
    },
    [setPagination]
  );

  // ────────────────────────────────────────
  // Page Size Change Handler
  // ────────────────────────────────────────

  const handlePageSizeChange = useCallback(
    (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ): void => {
      const newPageSize = parseInt(event.target.value, 10);
      setPagination(prev => ({
        ...prev,
        pageSize: newPageSize,
        page: 0, // Reset to first page when page size changes
      }));
    },
    [setPagination]
  );

  // ────────────────────────────────────────
  // Utility Functions
  // ────────────────────────────────────────

  const resetToFirstPage = useCallback((): void => {
    setPagination(prev => ({ ...prev, page: 0 }));
  }, [setPagination]);

  const goToPage = useCallback(
    (page: number): void => {
      setPagination(prev => ({ ...prev, page }));
    },
    [setPagination]
  );

  const setPageSize = useCallback(
    (pageSize: number): void => {
      setPagination(prev => ({
        ...prev,
        pageSize,
        page: 0, // Reset to first page when page size changes
      }));
    },
    [setPagination]
  );

  const getTotalPages = useCallback((): number => {
    return Math.ceil(pagination.total / pagination.pageSize);
  }, [pagination.total, pagination.pageSize]);

  const hasNextPage = useCallback((): boolean => {
    return pagination.page < getTotalPages() - 1;
  }, [pagination.page, getTotalPages]);

  const hasPreviousPage = useCallback((): boolean => {
    return pagination.page > 0;
  }, [pagination.page]);

  return {
    handlePageChange,
    handlePageSizeChange,
    resetToFirstPage,
    goToPage,
    setPageSize,
    getTotalPages,
    hasNextPage,
    hasPreviousPage,
  };
}

// ────────────────────────────────────────
// End of File: src/hooks/usePagination.ts
// ────────────────────────────────────────────────── 
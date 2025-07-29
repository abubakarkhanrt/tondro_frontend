/**
 * ──────────────────────────────────────────────────
 * File: src/hooks/useEntityState.ts
 * Description: Shared state management hook for entity components
 * Author: Muhammad Abubakar Khan
 * Created: 07-07-2025
 * Last Updated: 07-07-2025
 * ──────────────────────────────────────────────────
 */

import { useState, useCallback } from 'react';
import type { FilterParams, PaginationState, SnackbarState } from '../types';

// ────────────────────────────────────────
// Type Definitions
// ────────────────────────────────────────

export interface BaseEntityState<T> {
  data: T[];
  loading: boolean;
  error: string;
  abortController: AbortController | null;
}

// ────────────────────────────────────────
// Hook Interface
// ────────────────────────────────────────

interface UseEntityStateReturn<T, F = FilterParams> {
  // Entity state
  entityState: BaseEntityState<T>;
  setEntityState: React.Dispatch<React.SetStateAction<BaseEntityState<T>>>;

  // Pagination state
  pagination: PaginationState;
  setPagination: React.Dispatch<React.SetStateAction<PaginationState>>;

  // Filter state
  filters: F;
  setFilters: React.Dispatch<React.SetStateAction<F>>;

  // Snackbar state
  snackbar: SnackbarState;
  setSnackbar: React.Dispatch<React.SetStateAction<SnackbarState>>;

  // Dialog states
  createDialogOpen: boolean;
  setCreateDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedEntity: T | null;
  setSelectedEntity: React.Dispatch<React.SetStateAction<T | null>>;
  editMode: boolean;
  setEditMode: React.Dispatch<React.SetStateAction<boolean>>;

  // Utility functions
  resetEntityState: () => void;
  resetPagination: () => void;
  resetFilters: (defaultFilters: F) => void;
  resetSnackbar: () => void;
  resetAll: (defaultFilters: F) => void;
}

// ────────────────────────────────────────
// Hook Implementation
// ────────────────────────────────────────

export function useEntityState<T, F = FilterParams>(
  defaultFilters: F,
  initialPageSize: number = 50
): UseEntityStateReturn<T, F> {
  // Entity state
  const [entityState, setEntityState] = useState<BaseEntityState<T>>({
    data: [],
    loading: false,
    error: '',
    abortController: null,
  });

  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    page: 0,
    page_size: initialPageSize,
    total: 0,
  });

  // Filter state
  const [filters, setFilters] = useState<F>(defaultFilters);

  // Snackbar state
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [selectedEntity, setSelectedEntity] = useState<T | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);

  // ────────────────────────────────────────
  // Reset Functions
  // ────────────────────────────────────────

  const resetEntityState = useCallback(() => {
    setEntityState({
      data: [],
      loading: false,
      error: '',
      abortController: null,
    });
  }, []);

  const resetPagination = useCallback(() => {
    setPagination({
      page: 0,
      page_size: initialPageSize,
      total: 0,
    });
  }, [initialPageSize]);

  const resetFilters = useCallback((defaultFilters: F) => {
    setFilters(defaultFilters);
  }, []);

  const resetSnackbar = useCallback(() => {
    setSnackbar({
      open: false,
      message: '',
      severity: 'success',
    });
  }, []);

  const resetAll = useCallback(
    (defaultFilters: F) => {
      resetEntityState();
      resetPagination();
      resetFilters(defaultFilters);
      resetSnackbar();
      setCreateDialogOpen(false);
      setSelectedEntity(null);
      setEditMode(false);
    },
    [resetEntityState, resetPagination, resetFilters, resetSnackbar]
  );

  return {
    // Entity state
    entityState,
    setEntityState,

    // Pagination state
    pagination,
    setPagination,

    // Filter state
    filters,
    setFilters,

    // Snackbar state
    snackbar,
    setSnackbar,

    // Dialog states
    createDialogOpen,
    setCreateDialogOpen,
    selectedEntity,
    setSelectedEntity,
    editMode,
    setEditMode,

    // Utility functions
    resetEntityState,
    resetPagination,
    resetFilters,
    resetSnackbar,
    resetAll,
  };
}

// ────────────────────────────────────────
// End of File: src/hooks/useEntityState.ts
// ──────────────────────────────────────────────────

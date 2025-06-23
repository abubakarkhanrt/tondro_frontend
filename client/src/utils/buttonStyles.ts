/**
 * ──────────────────────────────────────────────────
 * File: client/src/utils/buttonStyles.ts
 * Description: Standardized button styling utilities for consistent UI across the application
 * Author: Muhammad Abubakar Khan
 * Created: 18-06-2025
 * Last Updated: 20-06-2025
 * ──────────────────────────────────────────────────
 */

import { SxProps, Theme } from '@mui/material';

// Standardized button color variants
export const BUTTON_COLORS = {
  CREATE: 'success', // Green for create/add buttons
  CLEAR: 'primary',  // Blue for clear/reset buttons
  DELETE: 'error',   // Red for delete buttons
  EDIT: 'warning',   // Orange for edit buttons
  VIEW: 'info',      // Light blue for view buttons
  SUBMIT: 'success', // Green for submit buttons
  CANCEL: 'inherit'  // Inherit color for cancel buttons
} as const;

export type ButtonColorType = typeof BUTTON_COLORS[keyof typeof BUTTON_COLORS];

// Standardized button styles
export const BUTTON_STYLES = {
  // Create/Add button style - Green
  create: {
    variant: 'contained' as const,
    color: BUTTON_COLORS.CREATE,
    sx: {
      minHeight: '40px',
      fontWeight: 600,
      textTransform: 'none' as const
    }
  },
  
  // Clear/Reset button style - Blue
  clear: {
    variant: 'contained' as const,
    color: BUTTON_COLORS.CLEAR,
    sx: {
      minHeight: '40px',
      fontWeight: 600,
      textTransform: 'none' as const
    }
  },
  
  // Delete button style - Red
  delete: {
    variant: 'contained' as const,
    color: BUTTON_COLORS.DELETE,
    sx: {
      minHeight: '40px',
      fontWeight: 600,
      textTransform: 'none' as const
    }
  },
  
  // Edit button style - Orange
  edit: {
    variant: 'outlined' as const,
    color: BUTTON_COLORS.EDIT,
    sx: {
      minHeight: '40px',
      fontWeight: 600,
      textTransform: 'none' as const
    }
  },
  
  // View button style - Light blue
  view: {
    variant: 'outlined' as const,
    color: BUTTON_COLORS.VIEW,
    sx: {
      minHeight: '40px',
      fontWeight: 600,
      textTransform: 'none' as const
    }
  },
  
  // Submit button style - Green
  submit: {
    variant: 'contained' as const,
    color: BUTTON_COLORS.SUBMIT,
    sx: {
      minHeight: '40px',
      fontWeight: 600,
      textTransform: 'none' as const
    }
  },
  
  // Cancel button style - Grey
  cancel: {
    variant: 'outlined' as const,
    color: BUTTON_COLORS.CANCEL,
    sx: {
      minHeight: '40px',
      fontWeight: 600,
      textTransform: 'none' as const
    }
  }
} as const;

/**
 * Gets standardized button props based on button type
 * 
 * @param type - The type of button (create, clear, delete, etc.)
 * @param customSx - Optional custom sx props to merge
 * @returns Button props with standardized styling
 * 
 * @example
 * const createButtonProps = getButtonProps('create');
 * const clearButtonProps = getButtonProps('clear', { minWidth: '120px' });
 */
export function getButtonProps(
  type: keyof typeof BUTTON_STYLES, 
  customSx?: SxProps<Theme>
) {
  const baseProps = BUTTON_STYLES[type];
  return {
    variant: baseProps.variant,
    color: baseProps.color,
    sx: customSx ? { ...baseProps.sx, ...customSx } : baseProps.sx
  };
}

/**
 * Gets the standardized color for a button based on its action
 * 
 * @param action - The button action (create, clear, delete, etc.)
 * @returns The color type for the button
 * 
 * @example
 * getButtonColor('create'); // "success"
 * getButtonColor('clear'); // "primary"
 */
export function getButtonColor(action: string): ButtonColorType {
  const lowerAction = action.toLowerCase();
  
  if (lowerAction.includes('create') || lowerAction.includes('add') || lowerAction.includes('submit')) {
    return BUTTON_COLORS.CREATE;
  }
  
  if (lowerAction.includes('clear') || lowerAction.includes('reset')) {
    return BUTTON_COLORS.CLEAR;
  }
  
  if (lowerAction.includes('delete') || lowerAction.includes('remove')) {
    return BUTTON_COLORS.DELETE;
  }
  
  if (lowerAction.includes('edit') || lowerAction.includes('update')) {
    return BUTTON_COLORS.EDIT;
  }
  
  if (lowerAction.includes('view') || lowerAction.includes('details')) {
    return BUTTON_COLORS.VIEW;
  }
  
  if (lowerAction.includes('cancel')) {
    return BUTTON_COLORS.CANCEL;
  }
  
  // Default fallback
  return BUTTON_COLORS.CLEAR;
} 
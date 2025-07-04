/**
 * ──────────────────────────────────────────────────
 * File: src/components/common/OrganizationsDropdown.tsx
 * Description: Reusable organizations dropdown component for V2 API format
 * Author: Muhammad Abubakar Khan
 * Created: 02-07-2025
 * Last Updated: 04-07-2025
 * ──────────────────────────────────────────────────
 */

import React, { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';
import { apiHelpers } from '../../services/api';
import { type OrganizationV2 } from '../../types';

// ────────────────────────────────────────
// Component Props Interface
// ────────────────────────────────────────

interface OrganizationsDropdownProps {
  /** Current selected value */
  value: string | number;

  /** Callback when selection changes */
  onChange: (value: string | number) => void;

  /** Label for the dropdown */
  label?: string;

  /** Whether to show "All Organizations" option */
  showAllOption?: boolean;

  /** Text for "All Organizations" option */
  allOptionText?: string;

  /** Whether the field is required */
  required?: boolean;

  /** Whether the field is disabled */
  disabled?: boolean;

  /** Whether to show loading state */
  loading?: boolean;

  /** Custom error state */
  error?: boolean;

  /** Error message */
  errorMessage?: string;

  /** Custom test ID prefix */
  testIdPrefix?: string;

  /** Whether to convert organization ID to numeric format (for subscriptions) */
  convertToNumeric?: boolean;

  /** Custom organizations data (if not fetching from API) */
  organizations?: OrganizationV2[];

  /** Whether to fetch organizations from API */
  fetchFromApi?: boolean;

  /** Additional CSS classes */
  className?: string;

  /** Additional styles */
  sx?: any;

  /** Margin for the FormControl (normal, dense, none) */
  margin?: 'normal' | 'dense' | 'none';
}

// ────────────────────────────────────────
// Main Component
// ────────────────────────────────────────

const OrganizationsDropdown: React.FC<OrganizationsDropdownProps> = ({
  value,
  onChange,
  label = 'Organization',
  showAllOption = true,
  allOptionText = 'All Organizations',
  required = false,
  disabled = false,
  loading: externalLoading = false,
  error = false,
  errorMessage,
  testIdPrefix = 'organizations-dropdown',
  convertToNumeric = false,
  organizations: externalOrganizations,
  fetchFromApi = false,
  className,
  sx,
  margin = 'normal',
}) => {
  // ────────────────────────────────────────
  // State Management
  // ────────────────────────────────────────

  const [organizations, setOrganizations] = useState<OrganizationV2[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string>('');

  // ────────────────────────────────────────
  // API Functions
  // ────────────────────────────────────────

  const fetchOrganizations = async (): Promise<void> => {
    if (!fetchFromApi || externalOrganizations) return;

    setLoading(true);
    setFetchError('');

    try {
      const response = await apiHelpers.getOrganizations();

      // Handle the transformed response format from getOrganizations
      let orgs: OrganizationV2[] = [];

      if (response.data && response.data.organizations) {
        // Handle the transformed response format (OrganizationsResponse)
        orgs = response.data.organizations.map((org: any) => ({
          id: org.id ,
          name: org.name ,
          domain: org.domain  || null,
          status: (org.status || 'inactive').toLowerCase() as 'active' | 'inactive' | 'pending',
          subscription_count: org.subscription_count || 0,
          user_count: org.user_count || org.totalUsers || 0,
          created_at: org.created_at || org.createdAt || new Date().toISOString(),
        }));
      } else if (response.data && (response.data as any).items) {
        // Handle the paginated response format (OrganizationsV2Response)
        orgs = (response.data as any).items;
      } else if (Array.isArray(response.data)) {
        // Direct array format
        orgs = response.data;
      } else {
        console.warn('Unexpected organizations response format:', response.data);
        orgs = [];
      }

      // Remove duplicate organizations based on id
      const uniqueOrgs = orgs.filter((org, index, self) => {
        return index === self.findIndex(o => o.id === org.id);
      });

      setOrganizations(uniqueOrgs);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setFetchError('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  // ────────────────────────────────────────
  // Effects
  // ────────────────────────────────────────

  useEffect(() => {
    if (externalOrganizations && externalOrganizations.length > 0) {
      setOrganizations(externalOrganizations);
      return;
    }

    if (fetchFromApi && !externalOrganizations) {
      fetchOrganizations();
    }
  }, [externalOrganizations, fetchFromApi]);

  // ────────────────────────────────────────
  // Event Handlers
  // ────────────────────────────────────────

  const handleChange = (event: any) => {
    const selectedValue = event.target.value;
    onChange(selectedValue);
  };

  // ────────────────────────────────────────
  // Value Conversion
  // ────────────────────────────────────────

  const getDisplayValue = (org: OrganizationV2): string | number => {
    if (convertToNumeric) {
      // Return numeric ID for subscriptions
      return org.id;
    }
    return String(org.id);
  };

  // ────────────────────────────────────────
  // Render Functions
  // ────────────────────────────────────────

  const renderLoadingState = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <CircularProgress size={16} />
      <Typography variant="body2" color="text.secondary">
        Loading organizations...
      </Typography>
    </Box>
  );

  const renderErrorState = () => (
    <Typography variant="body2" color="error">
      {fetchError || errorMessage || 'Failed to load organizations'}
    </Typography>
  );

  const renderEmptyState = () => (
    <Typography variant="body2" color="text.secondary">
      No organizations available
    </Typography>
  );

  // ────────────────────────────────────────
  // Main Render
  // ────────────────────────────────────────

  const isLoading = loading || externalLoading;
  const hasError = error || !!fetchError;
  const hasOrganizations = organizations.length > 0;

  return (
    <FormControl
      fullWidth
      required={required}
      disabled={disabled || isLoading}
      error={hasError}
      className={className || ''}
      sx={sx}
      margin={margin}
    >
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        onChange={handleChange}
        label={label}
        data-testid={`${testIdPrefix}-select`}
        inputProps={{
          'aria-label': `${label} selection`,
        }}
      >
        {showAllOption && (
          <MenuItem value="" data-testid={`${testIdPrefix}-option-all`}>
            {allOptionText}
          </MenuItem>
        )}

        {isLoading && <MenuItem disabled>{renderLoadingState()}</MenuItem>}

        {hasError && <MenuItem disabled>{renderErrorState()}</MenuItem>}

        {!isLoading && !hasError && !hasOrganizations && (
          <MenuItem disabled>{renderEmptyState()}</MenuItem>
        )}

        {!isLoading &&
          !hasError &&
          hasOrganizations &&
          organizations.map(org => (
            <MenuItem
              key={org.id}
              value={getDisplayValue(org)}
              data-testid={`${testIdPrefix}-option-${org.id}`}
            >
              {org.name}
            </MenuItem>
          ))}
      </Select>
    </FormControl>
  );
};

export default OrganizationsDropdown;

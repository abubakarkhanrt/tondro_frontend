/**
 * ──────────────────────────────────────────────────
 * File: src/components/common/OrganizationsDropdown.tsx
 * Description: Reusable organizations dropdown component that handles both API formats
 * Author: Muhammad Abubakar Khan
 * Created: 02-07-2025
 * Last Updated: 02-07-2025
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
import {
  type Organization,
  type OrganizationV2,
} from '../../types';

// ────────────────────────────────────────
// Helper Functions
// ────────────────────────────────────────

const getOrganizationName = (org: Organization | OrganizationV2): string => {
  // Check if it's the new format (V2)
  if ('name' in org && typeof org.id === 'number') {
    return org.name;
  }
  // Old format
  return org.tenantName;
};

const getOrganizationId = (org: Organization | OrganizationV2): string => {
  // Check if it's the new format (V2)
  if ('id' in org && typeof org.id === 'number') {
    return String(org.id);
  }
  // Old format
  return org.organizationId;
};

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
  organizations?: (Organization | OrganizationV2)[];
  
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

  const [organizations, setOrganizations] = useState<(Organization | OrganizationV2)[]>([]);
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
      
      // Handle both response formats
      let orgs: (Organization | OrganizationV2)[] = [];
      
      if (response.data.items) {
        // New format (V2)
        orgs = response.data.items;
      } else if (response.data.organizations) {
        // Old format
        orgs = response.data.organizations;
      } else {
        // Fallback: assume it's an array
        orgs = Array.isArray(response.data) ? response.data : [];
      }

      // Remove duplicate organizations based on organizationId/name
      const uniqueOrgs = orgs.filter(
        (org, index, self) => {
          const orgId = getOrganizationId(org);
          return index === self.findIndex(o => getOrganizationId(o) === orgId);
        }
      );

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
    console.log('🔄 OrganizationsDropdown useEffect triggered');
    console.log('📦 External organizations:', externalOrganizations?.length || 0);
    console.log('🌐 Fetch from API:', fetchFromApi);
    
    if (externalOrganizations && externalOrganizations.length > 0) {
      console.log('✅ Using external organizations data');
      setOrganizations(externalOrganizations);
      return;
    }
    
    if (fetchFromApi && !externalOrganizations) {
      console.log('🌐 Fetching organizations from API');
      fetchOrganizations();
    }
  }, []); // Remove fetchFromApi dependency

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

  const getDisplayValue = (org: Organization | OrganizationV2): string | number => {
    const orgId = getOrganizationId(org);
    
    if (convertToNumeric) {
      // Convert org_000001 format to numeric for subscriptions
      return parseInt(orgId.replace('org_', ''), 10);
    }
    
    return orgId;
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
      className={className}
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
          <MenuItem
            value=""
            data-testid={`${testIdPrefix}-option-all`}
          >
            {allOptionText}
          </MenuItem>
        )}
        
        {isLoading && (
          <MenuItem disabled>
            {renderLoadingState()}
          </MenuItem>
        )}
        
        {hasError && (
          <MenuItem disabled>
            {renderErrorState()}
          </MenuItem>
        )}
        
        {!isLoading && !hasError && !hasOrganizations && (
          <MenuItem disabled>
            {renderEmptyState()}
          </MenuItem>
        )}
        
        {!isLoading && !hasError && hasOrganizations && organizations.map(org => (
          <MenuItem
            key={getOrganizationId(org)}
            value={getDisplayValue(org)}
            data-testid={`${testIdPrefix}-option-${getOrganizationId(org)}`}
          >
            {getOrganizationName(org)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default OrganizationsDropdown; 
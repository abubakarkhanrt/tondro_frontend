/**
 * ──────────────────────────────────────────────────
 * File: client/src/components/FilterForm.tsx
 * Description: Reusable filter form component for TondroAI CRM
 * Author: Muhammad Abubakar Khan
 * Created: 18-06-2025
 * Last Updated: 20-06-2025
 * ──────────────────────────────────────────────────
 */

import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Typography, Grid, TextField, Select, MenuItem, 
  FormControl, InputLabel, Button, Box, Collapse, IconButton, SelectChangeEvent, Chip
} from '@mui/material';
import { TestIds } from '../testIds';
import { getButtonProps } from '../utils/buttonStyles';

// ────────────────────────────────────────
// Type Definitions
// ────────────────────────────────────────

interface FilterOption {
  value: string;
  label: string;
}

interface FilterField {
  name: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'numberrange' | 'search';
  defaultValue?: any;
  placeholder?: string;
  options?: FilterOption[];
  min?: number;
  max?: number;
  step?: number;
}

interface FilterFormProps {
  filters: FilterField[];
  onFilterChange: (values: Record<string, any>) => void;
  onClearFilters: () => void;
  title?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  showClearButton?: boolean;
  showApplyButton?: boolean;
  onApply?: (values: Record<string, any>) => void;
}

// ────────────────────────────────────────
// Main Component
// ────────────────────────────────────────

const FilterForm: React.FC<FilterFormProps> = ({
  filters = [],
  onFilterChange,
  onClearFilters,
  title = "Filters",
  collapsible = true,
  defaultExpanded = true,
  showClearButton = true,
  showApplyButton = false,
  onApply
}) => {
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [expanded, setExpanded] = useState<boolean>(defaultExpanded);

  // Initialize filter values
  useEffect(() => {
    const initialValues: Record<string, any> = {};
    filters.forEach(filter => {
      initialValues[filter.name] = filter.defaultValue || (filter.type === 'multiselect' ? [] : '');
    });
    setFilterValues(initialValues);
  }, [filters]);

  const handleFilterChange = (fieldName: string, value: any): void => {
    const newValues = { ...filterValues, [fieldName]: value };
    setFilterValues(newValues);
    
    // Auto-apply filters if not using apply button
    if (!showApplyButton) {
      onFilterChange(newValues);
    }
  };

  const handleClearFilters = (): void => {
    const clearedValues: Record<string, any> = {};
    filters.forEach(filter => {
      clearedValues[filter.name] = filter.type === 'multiselect' ? [] : '';
    });
    setFilterValues(clearedValues);
    onClearFilters();
  };

  const handleApply = (): void => {
    if (onApply) onApply(filterValues);
  };

  const renderFilterField = (filter: FilterField): React.ReactElement => {
    const value = filterValues[filter.name] || (filter.type === 'multiselect' ? [] : '');

    switch (filter.type) {
      case 'select':
        return (
          <FormControl fullWidth>
            <InputLabel>{filter.label}</InputLabel>
            <Select
              value={value}
              onChange={(e: SelectChangeEvent) => handleFilterChange(filter.name, e.target.value)}
              label={filter.label}
              data-testid={TestIds.filterForm[filter.name as keyof typeof TestIds.filterForm] || `filter-form-${filter.name}`}
            >
              <MenuItem value="">All</MenuItem>
              {filter.options?.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      case 'multiselect':
        return (
          <FormControl fullWidth>
            <InputLabel>{filter.label}</InputLabel>
            <Select
              multiple
              value={Array.isArray(value) ? value : []}
              onChange={(e: SelectChangeEvent<string[]>) => handleFilterChange(filter.name, e.target.value as string[])}
              label={filter.label}
              data-testid={TestIds.filterForm[filter.name as keyof typeof TestIds.filterForm] || `filter-form-${filter.name}`}
            >
              {filter.options?.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      case 'date':
        return (
          <TextField
            fullWidth
            label={filter.label}
            type="date"
            value={value}
            onChange={(e) => handleFilterChange(filter.name, e.target.value)}
            InputLabelProps={{ shrink: true }}
            data-testid={TestIds.filterForm[filter.name as keyof typeof TestIds.filterForm] || `filter-form-${filter.name}`}
          />
        );
      case 'daterange':
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              label={`${filter.label} From`}
              type="date"
              value={value.start || ''}
              onChange={(e) => handleFilterChange(filter.name, { 
                ...value, 
                start: e.target.value 
              })}
              InputLabelProps={{ shrink: true }}
              data-testid={TestIds.filterForm.dateFrom}
            />
            <TextField
              fullWidth
              label={`${filter.label} To`}
              type="date"
              value={value.end || ''}
              onChange={(e) => handleFilterChange(filter.name, { 
                ...value, 
                end: e.target.value 
              })}
              InputLabelProps={{ shrink: true }}
              data-testid={TestIds.filterForm.dateTo}
            />
          </Box>
        );
      case 'number':
        return (
          <TextField
            fullWidth
            label={filter.label}
            type="number"
            value={value}
            onChange={(e) => handleFilterChange(filter.name, e.target.value)}
            placeholder={filter.placeholder}
            inputProps={{
              min: filter.min,
              max: filter.max,
              step: filter.step
            }}
            data-testid={TestIds.filterForm[filter.name as keyof typeof TestIds.filterForm] || `filter-form-${filter.name}`}
          />
        );
      case 'numberrange':
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              label={`${filter.label} Min`}
              type="number"
              value={value.min || ''}
              onChange={(e) => handleFilterChange(filter.name, { 
                ...value, 
                min: e.target.value 
              })}
              placeholder={filter.placeholder}
              inputProps={{
                min: filter.min,
                max: filter.max,
                step: filter.step
              }}
              data-testid={TestIds.filterForm[filter.name as keyof typeof TestIds.filterForm] || `filter-form-${filter.name}-min`}
            />
            <TextField
              fullWidth
              label={`${filter.label} Max`}
              type="number"
              value={value.max || ''}
              onChange={(e) => handleFilterChange(filter.name, { 
                ...value, 
                max: e.target.value 
              })}
              placeholder={filter.placeholder}
              inputProps={{
                min: filter.min,
                max: filter.max,
                step: filter.step
              }}
              data-testid={TestIds.filterForm[filter.name as keyof typeof TestIds.filterForm] || `filter-form-${filter.name}-max`}
            />
          </Box>
        );
      case 'search':
        return (
          <TextField
            fullWidth
            label={filter.label}
            value={value}
            onChange={(e) => handleFilterChange(filter.name, e.target.value)}
            placeholder={filter.placeholder || `Search ${filter.label.toLowerCase()}...`}
            InputProps={{
              startAdornment: (
                <span style={{ marginRight: 8 }}>🔍</span>
              )
            }}
            data-testid={TestIds.filterForm.search}
          />
        );
      default: // text
        return (
          <TextField
            fullWidth
            label={filter.label}
            value={value}
            onChange={(e) => handleFilterChange(filter.name, e.target.value)}
            placeholder={filter.placeholder}
            data-testid={TestIds.filterForm[filter.name as keyof typeof TestIds.filterForm] || `filter-form-${filter.name}`}
          />
        );
    }
  };

  const hasActiveFilters = (): boolean => {
    return Object.values(filterValues).some(value => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(v => v && v.toString().trim() !== '');
      }
      return value && value.toString().trim() !== '';
    });
  };

  const filterContent = (
    <CardContent data-testid={TestIds.filterForm.container}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          {title}
        </Typography>
        {collapsible && (
          <IconButton
            onClick={() => setExpanded(!expanded)}
            size="small"
            data-testid={TestIds.filterForm.expandCollapse}
          >
            {expanded ? '−' : '+'}
          </IconButton>
        )}
      </Box>
      
      <Collapse in={expanded}>
        <Grid container spacing={2}>
          {filters.map((filter) => (
            <Grid item xs={12} sm={6} md={4} key={filter.name}>
              {renderFilterField(filter)}
            </Grid>
          ))}
        </Grid>
        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          {showClearButton && (
            <Button 
              {...getButtonProps('clear')}
              onClick={handleClearFilters} 
              disabled={!hasActiveFilters()}
              data-testid={TestIds.filterForm.clearFilters}
            >
              Clear Filters
            </Button>
          )}
          {showApplyButton && (
            <Button 
              {...getButtonProps('submit')}
              onClick={handleApply}
              data-testid={TestIds.filterForm.applyFilters}
            >
              Apply Filters
            </Button>
          )}
        </Box>
      </Collapse>
    </CardContent>
  );

  return (
    <Card sx={{ mb: 3 }}>
      {filterContent}
    </Card>
  );
};

export default FilterForm;

// ──────────────────────────────────────────────────
// End of File: client/src/components/FilterForm.tsx
// ────────────────────────────────────────────────── 
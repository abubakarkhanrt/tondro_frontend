/**
 * ──────────────────────────────────────────────────
 * File: client/src/components/EntityTable.tsx
 * Description: Reusable table component for displaying entities in TondroAI CRM
 * Author: Muhammad Abubakar Khan
 * Created: 18-06-2025
 * Last Updated: 20-06-2025
 * ──────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  TablePagination,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Tooltip,
  Collapse,
} from '@mui/material';
import { getStatusBackgroundColor } from '../theme';
import { TestIds } from '../testIds';

// ────────────────────────────────────────
// Type Definitions
// ────────────────────────────────────────

interface SortConfig {
  key: string | null;
  direction: 'asc' | 'desc';
}

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

interface TableAction {
  label: string;
  onClick: (row: any) => void;
  variant?: 'text' | 'outlined' | 'contained';
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  tooltip?: string;
  icon?: React.ReactElement;
  disabled?: (row: any) => boolean;
}

interface ExpandableConfig {
  render: (row: any) => React.ReactElement;
}

interface TableColumn {
  key: string;
  label: string;
  type?:
    | 'text'
    | 'date'
    | 'datetime'
    | 'boolean'
    | 'chip'
    | 'status'
    | 'currency'
    | 'number'
    | 'email'
    | 'url';
  chipColor?:
    | 'primary'
    | 'secondary'
    | 'error'
    | 'info'
    | 'success'
    | 'warning'
    | 'default';
  actions?: TableAction[];
  expandable?: ExpandableConfig;
  sortable?: boolean;
  width?: string | number;
}

interface EntityTableProps {
  data?: any[];
  columns?: TableColumn[];
  loading?: boolean;
  error?: string | null;
  pagination?: PaginationState;
  onPageChange?: (event: unknown, newPage: number) => void;
  onPageSizeChange?: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onRefresh?: () => void;
  title?: string;
  showRefreshButton?: boolean;
  expandableRows?: boolean;
  expandedRows?: Set<string>;
  onToggleRowExpansion?: (id: string) => void;
  emptyMessage?: string;
}

// ────────────────────────────────────────
// Main Component
// ────────────────────────────────────────

const EntityTable: React.FC<EntityTableProps> = ({
  data = [],
  columns = [],
  loading = false,
  error = null,
  pagination = {
    page: 0,
    pageSize: 50,
    total: 0,
  },
  onPageChange,
  onPageSizeChange,
  onRefresh,
  title = 'Data Table',
  showRefreshButton = true,
  expandableRows = false,
  expandedRows = new Set(),
  emptyMessage = 'No data available',
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: 'asc',
  });

  const handleSort = (key: string): void => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    if (typeof aValue === 'string') {
      return sortConfig.direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const renderCellValue = (
    value: any,
    column: TableColumn
  ): React.ReactNode => {
    if (value === null || value === undefined) {
      return '-';
    }

    switch (column.type) {
      case 'date':
        return new Date(value).toLocaleDateString();

      case 'datetime':
        return new Date(value).toLocaleString();

      case 'boolean':
        return value ? 'Yes' : 'No';

      case 'chip':
        return (
          <Chip
            label={value}
            color={column.chipColor || 'default'}
            size="small"
          />
        );

      case 'status':
        return (
          <Chip
            label={value}
            style={{
              backgroundColor: getStatusBackgroundColor(value),
              color: '#ffffff',
            }}
            size="small"
          />
        );

      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(value);

      case 'number':
        return new Intl.NumberFormat().format(value);

      case 'email':
        return (
          <a href={`mailto:${value}`} style={{ color: 'inherit' }}>
            {value}
          </a>
        );

      case 'url':
        return (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit' }}
          >
            {value}
          </a>
        );

      case 'text':
      default:
        return value;
    }
  };

  const renderActions = (
    row: any,
    column: TableColumn
  ): React.ReactElement | null => {
    if (!column.actions) return null;

    return (
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {column.actions.map((action, index) => (
          <Tooltip key={index} title={action.tooltip || action.label}>
            <Button
              size="small"
              variant={action.variant || 'outlined'}
              color={action.color || 'primary'}
              onClick={() => action.onClick(row)}
              disabled={action.disabled && action.disabled(row)}
              startIcon={action.icon}
              data-testid={TestIds.entityTable.actionButton(
                action.label.toLowerCase().replace(/\s+/g, '-'),
                row.id
              )}
            >
              {action.label}
            </Button>
          </Tooltip>
        ))}
      </Box>
    );
  };

  const renderExpandableContent = (
    row: any,
    column: TableColumn
  ): React.ReactElement | null => {
    if (!column.expandable || !expandedRows.has(row.id)) return null;

    return (
      <TableRow>
        <TableCell
          style={{ paddingBottom: 0, paddingTop: 0 }}
          colSpan={columns.length}
        >
          <Collapse in={expandedRows.has(row.id)} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>{column.expandable.render(row)}</Box>
          </Collapse>
        </TableCell>
      </TableRow>
    );
  };

  if (loading) {
    return (
      <Paper>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress data-testid={TestIds.common.loadingSpinner} />
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper>
        <Alert
          severity="error"
          sx={{ m: 2 }}
          data-testid={TestIds.common.errorAlert}
        >
          {error}
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper data-testid={TestIds.entityTable.container}>
      <Box
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6">
          {title} ({pagination.total})
        </Typography>
        {showRefreshButton && onRefresh && (
          <Button
            variant="outlined"
            onClick={onRefresh}
            data-testid={TestIds.entityTable.refresh}
          >
            Refresh
          </Button>
        )}
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                  sx={column.sortable ? { cursor: 'pointer' } : {}}
                  data-testid={
                    column.sortable
                      ? TestIds.entityTable.sortColumn(column.key)
                      : undefined
                  }
                >
                  {column.label}
                  {column.sortable && sortConfig.key === column.key && (
                    <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  <Typography variant="body2" color="text.secondary">
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((row) => (
                <React.Fragment key={row.id}>
                  <TableRow>
                    {columns.map((column) => (
                      <TableCell key={column.key}>
                        {column.key === 'actions'
                          ? renderActions(row, column)
                          : renderCellValue(row[column.key], column)}
                      </TableCell>
                    ))}
                  </TableRow>
                  {expandableRows &&
                    renderExpandableContent(
                      row,
                      columns.find((col) => col.expandable)!
                    )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {onPageChange && onPageSizeChange && (
        <TablePagination
          component="div"
          count={pagination.total}
          page={pagination.page}
          onPageChange={onPageChange}
          rowsPerPage={pagination.pageSize}
          onRowsPerPageChange={onPageSizeChange}
          data-testid={TestIds.entityTable.pagination}
        />
      )}
    </Paper>
  );
};

export default EntityTable;

// ──────────────────────────────────────────────────
// End of File: client/src/components/EntityTable.tsx
// ──────────────────────────────────────────────────

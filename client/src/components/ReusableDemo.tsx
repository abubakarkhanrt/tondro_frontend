/**
 * ──────────────────────────────────────────────────
 * File: client/src/components/ReusableDemo.tsx
 * Description: Demonstration page for reusable components in TondroAI CRM
 * Author: Muhammad Abubakar Khan
 * Created: 18-06-2025
 * Last Updated: 20-06-2025
 * ──────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Grid, Divider
} from '@mui/material';
import CreateDialog from './CreateDialog';
import EntityTable from './EntityTable';
import FilterForm from './FilterForm';
import { TestIds } from '../testIds';

// ────────────────────────────────────────
// Type Definitions
// ────────────────────────────────────────

interface DemoUser {
  id: number;
  name: string;
  email: string;
  status: string;
  role: string;
  created_at: string;
}

interface FilterOption {
  value: string;
  label: string;
}

interface FilterField {
  name: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'numberrange' | 'search';
  placeholder?: string;
  options?: FilterOption[];
}

interface TableColumn {
  key: string;
  label: string;
  type?: 'number' | 'boolean' | 'status' | 'text' | 'email' | 'chip' | 'date' | 'datetime' | 'currency' | 'url';
  chipColor?: 'primary' | 'secondary' | 'error' | 'default' | 'info' | 'success' | 'warning';
  sortable?: boolean;
  actions?: any[];
}

interface CreateDialogField {
  name: string;
  label: string;
  type: 'number' | 'select' | 'text' | 'email' | 'textarea' | 'url';
  required?: boolean;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  options?: FilterOption[];
  rows?: number;
  fullWidth?: boolean;
}

// ────────────────────────────────────────
// Main Component
// ────────────────────────────────────────

const ReusableDemo: React.FC = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [demoData] = useState<DemoUser[]>([
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active', role: 'admin', created_at: '2024-01-15' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'inactive', role: 'user', created_at: '2024-01-20' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'pending', role: 'manager', created_at: '2024-02-01' }
  ]);

  // Example filter configuration
  const filterConfig: FilterField[] = [
    {
      name: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Search by name or email...'
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'pending', label: 'Pending' }
      ]
    },
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      options: [
        { value: 'admin', label: 'Admin' },
        { value: 'user', label: 'User' },
        { value: 'manager', label: 'Manager' }
      ]
    }
  ];

  // Example table columns configuration
  const tableColumns: TableColumn[] = [
    {
      key: 'name',
      label: 'Name',
      type: 'text',
      sortable: true
    },
    {
      key: 'email',
      label: 'Email',
      type: 'email',
      sortable: true
    },
    {
      key: 'status',
      label: 'Status',
      type: 'status',
      sortable: true
    },
    {
      key: 'role',
      label: 'Role',
      type: 'chip',
      chipColor: 'primary',
      sortable: true
    },
    {
      key: 'created_at',
      label: 'Created',
      type: 'date',
      sortable: true
    },
    {
      key: 'actions',
      label: 'Actions',
      actions: [
        {
          label: 'View',
          variant: 'outlined',
          color: 'primary',
          onClick: (row: DemoUser) => alert(`Viewing ${row.name}`)
        },
        {
          label: 'Edit',
          variant: 'outlined',
          color: 'secondary',
          onClick: (row: DemoUser) => alert(`Editing ${row.name}`)
        },
        {
          label: 'Delete',
          variant: 'outlined',
          color: 'error',
          onClick: (row: DemoUser) => alert(`Deleting ${row.name}`)
        }
      ]
    }
  ];

  // Example create dialog fields configuration
  const createDialogFields: CreateDialogField[] = [
    {
      name: 'name',
      label: 'Full Name',
      type: 'text',
      required: true,
      placeholder: 'Enter full name',
      minLength: 2,
      maxLength: 50
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      required: true,
      placeholder: 'Enter email address'
    },
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      required: true,
      options: [
        { value: 'admin', label: 'Administrator' },
        { value: 'user', label: 'User' },
        { value: 'manager', label: 'Manager' }
      ]
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'pending', label: 'Pending' }
      ]
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      required: false,
      placeholder: 'Enter any additional notes',
      rows: 3,
      fullWidth: true
    }
  ];

  const handleCreateSubmit = (formData: Record<string, any>) => {
    console.log('Create form data:', formData);
    alert(`Creating user: ${formData.name}`);
    setCreateDialogOpen(false);
  };

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
    console.log('Filters changed:', newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
    console.log('Filters cleared');
  };

  return (
    <Box data-testid={TestIds.reusableDemo.page}>
      <Typography variant="h4" component="h1" gutterBottom>
        Reusable Components Demo
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        This page demonstrates the reusable components used throughout the application.
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Filter Form Component
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                A reusable filter form that can be configured with different field types.
              </Typography>
              <FilterForm
                filters={filterConfig}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                title="Demo Filters"
                collapsible={true}
                defaultExpanded={true}
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Entity Table Component
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setCreateDialogOpen(true)}
                  data-testid={TestIds.reusableDemo.createButton}
                >
                  Create Demo Item
                </Button>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                A reusable table component with sorting, pagination, and action buttons.
              </Typography>
              <EntityTable
                data={demoData}
                columns={tableColumns}
                loading={false}
                error=""
                pagination={{
                  page: 0,
                  pageSize: 10,
                  total: demoData.length
                }}
                onPageChange={() => {}}
                onPageSizeChange={() => {}}
                onRefresh={() => {}}
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Create Dialog Component
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                A reusable dialog for creating new items with configurable form fields.
              </Typography>
              <Button
                variant="outlined"
                onClick={() => setCreateDialogOpen(true)}
                data-testid={TestIds.reusableDemo.openCreateDialog}
              >
                Open Create Dialog
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <CreateDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateSubmit}
        title="Create Demo User"
        fields={createDialogFields}
      />
    </Box>
  );
};

export default ReusableDemo;

// ──────────────────────────────────────────────────
// End of File: client/src/components/ReusableDemo.tsx
// ────────────────────────────────────────────────── 
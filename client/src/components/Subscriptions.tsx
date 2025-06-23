/**
 * ──────────────────────────────────────────────────
 * File: client/src/components/Subscriptions.tsx
 * Description: Subscriptions management page for TondroAI CRM
 * Author: Muhammad Abubakar Khan
 * Created: 18-06-2025
 * Last Updated: 20-06-2025
 * ──────────────────────────────────────────────────
 */

import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, Button, TextField, 
  Select, MenuItem, FormControl, InputLabel, Dialog, DialogTitle, 
  DialogContent, DialogActions, Alert, CircularProgress, IconButton,
  Chip, TablePagination, Snackbar, SelectChangeEvent, useTheme
} from '@mui/material';
import { 
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { apiHelpers } from '@/services/api';
import { 
  Subscription, 
  Organization, 
  Product, 
  CreateSubscriptionRequest, 
  UpdateSubscriptionRequest, 
  UsageEventRequest,
  PaginatedSubscriptionsResponse
} from '@/types';
import axios from 'axios';
import { getStatusColor, getStatusBackgroundColor } from '@/theme';
import { TestIds } from '../testIds';
import { getButtonProps } from '../utils/buttonStyles';

// Stub for current user ID (replace with real user context if available)
const currentUserId = 'demo-user-id';

// Stubs for missing dialog components (replace with real implementations if available)
const CreateSubscriptionDialog = (props: any) => <></>;
const EditSubscriptionDialog = (props: any) => <></>;
const ViewSubscriptionDialog = (props: any) => <></>;
const RecordUsageDialog = (props: any) => <></>;

// ────────────────────────────────────────
// Type Definitions
// ────────────────────────────────────────

interface FiltersState {
  organization_id: string;
  product_id: string;
  status: string;
  tier_name: string; // Updated from tier
}

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

interface UsageData {
  quantity: number;
  event_type: string;
  timestamp: string;
}

// ────────────────────────────────────────
// Main Component
// ────────────────────────────────────────

const Subscriptions: React.FC = () => {
  const theme = useTheme();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [filters, setFilters] = useState<FiltersState>({
    organization_id: '',
    product_id: '',
    status: '',
    tier_name: '' // Updated from tier
  });
  const [pagination, setPagination] = useState<PaginationState>({
    page: 0,
    pageSize: 50,
    total: 0
  });
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [selectedSubscriptionForUsage, setSelectedSubscriptionForUsage] = useState<Subscription | null>(null);
  const [usageDialogOpen, setUsageDialogOpen] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    // Add a small delay to ensure token is available after login
    const timer = setTimeout(() => {
      const token = localStorage.getItem('jwt_token');
      if (token) {
        fetchSubscriptions();
        loadDropdownData(); // Load organizations and products for display
      } else {
        setError('No authentication token found. Please login again.');
        setLoading(false);
      }
    }, 100); // Small delay to ensure token is set

    return () => {
      clearTimeout(timer);
      // Cancel any ongoing requests when component unmounts
      if (abortController) {
        abortController.abort();
      }
    };
  }, [filters, pagination.page, pagination.pageSize]);

  const fetchSubscriptions = async (): Promise<void> => {
    // Cancel any existing request
    if (abortController) {
      abortController.abort();
    }
    
    // Create new abort controller
    const controller = apiHelpers.createAbortController();
    setAbortController(controller);
    
    setLoading(true);
    setError('');
    
    try {
      // Double-check token before making request
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        setError('Authentication token not found. Please login again.');
        setLoading(false);
        return;
      }

      const params = {
        page: pagination.page + 1,
        page_size: pagination.pageSize,
        ...filters
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key as keyof typeof params] === '') delete params[key as keyof typeof params];
      });

      const response = await apiHelpers.getSubscriptions(params, controller.signal);
      const data: PaginatedSubscriptionsResponse = response.data;
      setSubscriptions(data.items || []);
      setPagination(prev => ({ ...prev, total: data.total || 0 }));
    } catch (error: any) {
      // Don't show error for cancelled requests
      if (axios.isCancel(error)) {
        return;
      }
      
      console.error('Error fetching subscriptions:', error);
      
      if (typeof error === 'object' && error !== null && 'response' in error && (error as any).response && (error as any).response.status === 401) {
        setError('Authentication failed. Please login again.');
      } else {
        setError('Failed to load subscriptions. Please try again.');
      }
    } finally {
      setLoading(false);
      setAbortController(null);
    }
  };

  const fetchOrganizations = async (): Promise<void> => {
    try {
      const response = await apiHelpers.getOrganizations();
      const organizationsData = response.data.organizations || [];
      setOrganizations(organizationsData);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      const err = error as any;
      if (err.response) {
        console.error('Error response:', err.response.data);
        console.error('Error status:', err.response.status);
        console.error('Error headers:', err.response.headers);
      }
      // Don't show error for organizations as it's not critical
    }
  };

  const fetchProducts = async (): Promise<void> => {
    try {
      // Double-check token before making request
      const token = localStorage.getItem('jwt_token');
      if (!token) {
        console.error('No token available for products request');
        return;
      }

      const response = await apiHelpers.getProducts();
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      const err = error as any;
      if (err.response) {
        console.error('Error response:', err.response.data);
        console.error('Error status:', err.response.status);
        console.error('Error headers:', err.response.headers);
      }
      // Don't show error for products as it's not critical
    }
  };

  const handleCreateSubscription = async (formData: CreateSubscriptionRequest): Promise<void> => {
    try {
      await apiHelpers.createSubscription(formData);
      setSnackbar({
        open: true,
        message: 'Subscription created successfully',
        severity: 'success'
      });
      setCreateDialogOpen(false);
      fetchSubscriptions();
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to create subscription',
        severity: 'error'
      });
    }
  };

  const handleDeleteSubscription = async (id: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this subscription?')) {
      return;
    }

    try {
      await apiHelpers.deleteSubscription(id, 'User requested deletion');
      setSnackbar({
        open: true,
        message: 'Subscription deleted successfully',
        severity: 'success'
      });
      fetchSubscriptions();
    } catch (error: any) {
      console.error('Error deleting subscription:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to delete subscription',
        severity: 'error'
      });
    }
  };

  const handleUpdateStatus = async (id: string, status: string): Promise<void> => {
    try {
      await apiHelpers.updateSubscriptionStatus(id, { status: status as any, reason: 'Status updated by user' });
      setSnackbar({
        open: true,
        message: 'Subscription status updated successfully',
        severity: 'success'
      });
      fetchSubscriptions();
    } catch (error: any) {
      console.error('Error updating subscription status:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to update subscription status',
        severity: 'error'
      });
    }
  };

  const handleRecordUsage = async (id: string, usageData: UsageData): Promise<void> => {
    if (!selectedSubscriptionForUsage) return;
    try {
      const usageEvent: UsageEventRequest = {
        event_type: usageData.event_type,
        quantity: usageData.quantity,
        metadata: { timestamp: usageData.timestamp }
      };
      
      await apiHelpers.recordUsage(id, usageEvent);
      setSnackbar({
        open: true,
        message: 'Usage recorded successfully',
        severity: 'success'
      });
      setUsageDialogOpen(false);
      setSelectedSubscriptionForUsage(null);
      fetchSubscriptions();
    } catch (error: any) {
      console.error('Error recording usage:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to record usage',
        severity: 'error'
      });
    }
  };

  const handleCancelSubscription = async (id: string, immediate: boolean = false, reason: string = ''): Promise<void> => {
    if (!confirm(`Are you sure you want to cancel this subscription?${immediate ? ' This action cannot be undone.' : ''}`)) {
      return;
    }

    try {
      // Use deleteSubscription instead of cancelSubscription
      await apiHelpers.deleteSubscription(id, reason || 'User requested cancellation');
      setSnackbar({
        open: true,
        message: 'Subscription cancelled successfully',
        severity: 'success'
      });
      fetchSubscriptions();
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to cancel subscription',
        severity: 'error'
      });
    }
  };

  const handleFilterChange = (field: string, value: string): void => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 0 })); // Reset to first page
  };

  const handlePageChange = (event: unknown, newPage: number): void => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newPageSize = parseInt(event.target.value, 10);
    setPagination(prev => ({ 
      ...prev, 
      pageSize: newPageSize,
      page: 0 // Reset to first page
    }));
  };

  const getTierColor = (tier: string): 'primary' | 'secondary' | 'success' | 'info' | 'warning' => {
    if (tier.includes('tier_1')) return 'success';
    if (tier.includes('tier_2')) return 'info';
    if (tier.includes('tier_3')) return 'warning';
    return 'primary';
  };

  const getOrganizationIdString = (numericId: number): string => {
    return `org_${numericId.toString().padStart(6, '0')}`;
  };

  const getOrganizationName = (organizationId: number): string => {
    const org = organizations.find(o => o.organizationId === getOrganizationIdString(organizationId));
    return org ? org.tenantName : `Organization ${organizationId}`;
  };

  const getProductName = (productId: string): string => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : `Product ${productId}`;
  };

  const handleUpdateSubscription = async (formData: UpdateSubscriptionRequest): Promise<void> => {
    if (!selectedSubscription) return;

    try {
      await apiHelpers.updateSubscription(selectedSubscription.id, formData);
      setSnackbar({
        open: true,
        message: 'Subscription updated successfully',
        severity: 'success'
      });
      setSelectedSubscription(null);
      setEditMode(false);
      fetchSubscriptions();
    } catch (error: any) {
      console.error('Error updating subscription:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to update subscription',
        severity: 'error'
      });
    }
  };

  const loadDropdownData = async (): Promise<void> => {
    await Promise.all([
      fetchOrganizations(),
      fetchProducts()
    ]);
  };

  const handleOpenCreateDialog = async (): Promise<void> => {
    await loadDropdownData();
    setCreateDialogOpen(true);
  };

  const loadFilterData = async (): Promise<void> => {
    await loadDropdownData();
  };

  // ────────────────────────────────────────
  // Filter Section Component
  // ────────────────────────────────────────

  const FilterSection: React.FC = () => (
    <Card sx={{ mb: 3 }} data-testid={TestIds.filterForm.container}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Organization</InputLabel>
              <Select
                value={filters.organization_id}
                onChange={e => handleFilterChange('organization_id', e.target.value)}
                label="Organization"
                data-testid={TestIds.filterForm.organization}
              >
                <MenuItem value="">All Organizations</MenuItem>
                {organizations.map((org) => (
                  <MenuItem key={org.organizationId} value={org.organizationId}>
                    {org.tenantName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Product</InputLabel>
              <Select
                value={filters.product_id}
                onChange={e => handleFilterChange('product_id', e.target.value)}
                label="Product"
                data-testid={TestIds.filterForm.product}
              >
                <MenuItem value="">All Products</MenuItem>
                {products.map((product) => (
                  <MenuItem key={product.id} value={product.id}>
                    {product.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={e => handleFilterChange('status', e.target.value)}
                label="Status"
                data-testid={TestIds.filterForm.status}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Tier</InputLabel>
              <Select
                value={filters.tier_name}
                onChange={e => handleFilterChange('tier_name', e.target.value)}
                label="Tier"
                data-testid={TestIds.filterForm.tier}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="basic">Basic</MenuItem>
                <MenuItem value="premium">Premium</MenuItem>
                <MenuItem value="enterprise">Enterprise</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  // ────────────────────────────────────────
  // Subscriptions Table Component
  // ────────────────────────────────────────

  const SubscriptionsTable: React.FC = () => (
    <Card data-testid={TestIds.subscriptions.table}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Subscriptions ({pagination.total})
          </Typography>
          <Button
            {...getButtonProps('create')}
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
            data-testid={TestIds.subscriptions.createButton}
          >
            Create Subscription
          </Button>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress data-testid={TestIds.common.loadingSpinner} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }} data-testid={TestIds.common.errorAlert}>
            {error}
          </Alert>
        ) : (
          <>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Organization</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Tier</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {subscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell>
                        {getOrganizationName(subscription.organization_id)}
                      </TableCell>
                      <TableCell>
                        {getProductName(subscription.product_id)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={subscription.status}
                          style={{ 
                            backgroundColor: getStatusBackgroundColor(theme, subscription.status),
                            color: '#ffffff'
                          }}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={subscription.tier_name}
                          color={getTierColor(subscription.tier_name)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(subscription.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedSubscription(subscription);
                              setEditMode(false);
                            }}
                            data-testid={TestIds.subscriptions.viewDetails(subscription.id)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedSubscription(subscription);
                              setEditMode(true);
                            }}
                            data-testid={TestIds.subscriptions.edit(subscription.id)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              setSelectedSubscriptionForUsage(subscription);
                              setUsageDialogOpen(true);
                            }}
                            data-testid={TestIds.subscriptions.recordUsage(subscription.id)}
                          >
                            <AddIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="secondary"
                            data-testid={TestIds.subscriptions.viewUsage(subscription.id)}
                          >
                            <SettingsIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleCancelSubscription(subscription.id)}
                            data-testid={TestIds.subscriptions.cancel(subscription.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              component="div"
              count={pagination.total}
              page={pagination.page}
              onPageChange={handlePageChange}
              rowsPerPage={pagination.pageSize}
              onRowsPerPageChange={handlePageSizeChange}
              rowsPerPageOptions={[10, 25, 50, 100]}
              data-testid={TestIds.entityTable.pagination}
            />
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box data-testid={TestIds.subscriptions.page}>
      <Typography variant="h4" component="h1" gutterBottom>
        Subscriptions
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} data-testid={TestIds.common.errorAlert}>
          {error}
        </Alert>
      )}
      
      <FilterSection />
      
      <SubscriptionsTable />
      
      <CreateSubscriptionDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateSubscription}
        organizations={organizations}
        products={products}
      />
      
      {selectedSubscription && (
        <>
          <ViewSubscriptionDialog
            subscription={selectedSubscription}
            onClose={() => setSelectedSubscription(null)}
            onUpdate={fetchSubscriptions}
            organizations={organizations}
            products={products}
          />
          <EditSubscriptionDialog
            subscription={selectedSubscription}
            onClose={() => setSelectedSubscription(null)}
            onSubmit={handleUpdateSubscription}
            organizations={organizations}
            products={products}
          />
        </>
      )}
      
      <RecordUsageDialog
        open={usageDialogOpen}
        onClose={() => setUsageDialogOpen(false)}
        onSubmit={handleRecordUsage}
        subscription={selectedSubscriptionForUsage}
      />
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
          data-testid={snackbar.severity === 'success' ? TestIds.common.successAlert : TestIds.common.errorAlert}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Subscriptions;

// ──────────────────────────────────────────────────
// End of File: client/src/components/Subscriptions.tsx
// ────────────────────────────────────────────────── 
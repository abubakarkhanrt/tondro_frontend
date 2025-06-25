/**
 * ──────────────────────────────────────────────────
 * File: client/src/components/Subscriptions.tsx
 * Description: Subscriptions management page for TondroAI CRM
 * Author: Muhammad Abubakar Khan
 * Created: 18-06-2025
 * Last Updated: 25-06-2025
 * ──────────────────────────────────────────────────
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  TablePagination,
  Snackbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { apiHelpers } from '../services/api';
import {
  type Subscription,
  type Organization,
  type Product,
  type CreateSubscriptionRequest,
  type UpdateSubscriptionRequest,
  type PaginatedSubscriptionsResponse,
} from '../types';
import axios from 'axios';
import { getStatusBackgroundColor } from '../theme';
import { TestIds } from '../testIds';
import { getButtonProps } from '../utils/buttonStyles';
import { formatTierName } from '../utils/tierFormatter';
import { useProductTiers } from '../hooks/useProductTiers';

// Stub for current user ID (replace with real user context if available)
// const currentUserId = 'demo-user-id';

// Stubs for missing dialog components (replace with real implementations if available)
const CreateSubscriptionDialog = ({
  open,
  onClose,
  onSubmit,
  organizations,
  products,
  getTierOptions,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSubscriptionRequest) => Promise<void>;
  organizations: Organization[];
  products: Product[];
  getTierOptions: (productId: string) => string[];
}) => {
  const [form, setForm] = useState<CreateSubscriptionRequest>({
    organization_id: 0,
    product_id: '',
    tier_name: '',
    auto_renewal: true,
    starts_at: new Date().toISOString().split('T')[0],
    ends_at: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tierOptions = getTierOptions(form.product_id);

  const handleChange = (field: keyof CreateSubscriptionRequest, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear tier when product changes
    if (field === 'product_id') {
      setForm((prev) => ({ ...prev, tier_name: '' }));
    }
  };

  const handleSubmit = async () => {
    if (!form.organization_id || !form.product_id || !form.tier_name) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      // Format dates properly for backend API
      const formattedData = {
        ...form,
        starts_at: form.starts_at ? `${form.starts_at}T00:00:00` : undefined,
        ends_at: form.ends_at ? `${form.ends_at}T00:00:00` : null,
      };
      
      await onSubmit(formattedData);
      onClose();
      // Reset form
      setForm({
        organization_id: 0,
        product_id: '',
        tier_name: '',
        auto_renewal: true,
        starts_at: new Date().toISOString().split('T')[0],
        ends_at: null,
      });
    } catch (e: any) {
      setError(e?.message || 'Failed to create subscription');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset form
    setForm({
      organization_id: 0,
      product_id: '',
      tier_name: '',
      auto_renewal: true,
      starts_at: new Date().toISOString().split('T')[0],
      ends_at: null,
    });
    setError(null);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New Subscription</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Organization *</InputLabel>
                <Select
                  value={form.organization_id || ''}
                  onChange={(e) => handleChange('organization_id', Number(e.target.value))}
                  label="Organization *"
                >
                  {organizations.map((org) => (
                    <MenuItem key={org.organizationId} value={parseInt(org.organizationId.replace('org_', ''), 10)}>
                      {org.tenantName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Product *</InputLabel>
                <Select
                  value={form.product_id}
                  onChange={(e) => handleChange('product_id', e.target.value)}
                  label="Product *"
                >
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Tier *</InputLabel>
                <Select
                  value={form.tier_name}
                  onChange={(e) => handleChange('tier_name', e.target.value)}
                  label="Tier *"
                  disabled={!form.product_id}
                >
                  {tierOptions.map((tier) => (
                    <MenuItem key={tier} value={tier}>
                      {formatTierName(tier)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Auto Renewal</InputLabel>
                <Select
                  value={form.auto_renewal ? 'yes' : 'no'}
                  onChange={(e) => handleChange('auto_renewal', e.target.value === 'yes')}
                  label="Auto Renewal"
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Start Date"
                type="date"
                value={form.starts_at ? form.starts_at.slice(0, 10) : ''}
                onChange={(e) => handleChange('starts_at', e.target.value)}
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="End Date (Optional)"
                type="date"
                value={form.ends_at ? form.ends_at.slice(0, 10) : ''}
                onChange={(e) => handleChange('ends_at', e.target.value || null)}
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Subscription'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const EditSubscriptionDialog = ({
  subscription,
  onClose,
  onSubmit,
  getTierOptions,
}: {
  subscription: Subscription;
  onClose: () => void;
  onSubmit: (data: UpdateSubscriptionRequest) => Promise<void>;
  getTierOptions: (productId: string) => string[];
}) => {
  const [form, setForm] = useState<UpdateSubscriptionRequest>({
    status: subscription.status,
    tier_name: subscription.tier_name,
    auto_renewal: subscription.auto_renewal,
    ends_at: subscription.ends_at,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tierOptions = getTierOptions(subscription.product_id);

  const handleChange = (field: keyof UpdateSubscriptionRequest, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(form);
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to update subscription');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Subscription</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Tier</InputLabel>
                <Select
                  value={form.tier_name}
                  onChange={(e) => handleChange('tier_name', e.target.value)}
                  label="Tier"
                >
                  {tierOptions.map((tier) => (
                    <MenuItem key={tier} value={tier}>
                      {formatTierName(tier)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Status</InputLabel>
                <Select
                  value={form.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  label="Status"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="trial">Trial</MenuItem>
                  <MenuItem value="expired">Expired</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="End Date"
                type="date"
                value={form.ends_at ? form.ends_at.slice(0, 10) : ''}
                onChange={(e) => handleChange('ends_at', e.target.value)}
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Auto Renewal</InputLabel>
                <Select
                  value={form.auto_renewal ? 'yes' : 'no'}
                  onChange={(e) => handleChange('auto_renewal', e.target.value === 'yes')}
                  label="Auto Renewal"
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

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

// interface UsageData {
//   quantity: number;
//   event_type: string;
//   timestamp: string;
// }

// ────────────────────────────────────────
// Main Component
// ────────────────────────────────────────

const Subscriptions: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [filters, setFilters] = useState<FiltersState>({
    organization_id: '',
    product_id: '',
    status: '',
    tier_name: '', // Updated from tier
  });
  const [pagination, setPagination] = useState<PaginationState>({
    page: 0,
    pageSize: 50,
    total: 0,
  });
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Product tiers hook for dynamic tier data
  const { tiers: productTiers, getTierByProductAndName } = useProductTiers();

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
        ...filters,
      };

      // Remove empty filters
      Object.keys(params).forEach((key) => {
        if (params[key as keyof typeof params] === '')
          delete params[key as keyof typeof params];
      });

      const response = await apiHelpers.getSubscriptions(
        params,
        controller.signal
      );
      const data: PaginatedSubscriptionsResponse = response.data;
      setSubscriptions(data.items || []);
      setPagination((prev) => ({ ...prev, total: data.total || 0 }));
    } catch (error: any) {
      // Don't show error for cancelled requests
      if (axios.isCancel(error)) {
        return;
      }

      console.error('Error fetching subscriptions:', error);

      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        (error as any).response &&
        (error as any).response.status === 401
      ) {
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

  const handleCreateSubscription = async (
    formData: CreateSubscriptionRequest
  ): Promise<void> => {
    try {
      await apiHelpers.createSubscription(formData);
      setSnackbar({
        open: true,
        message: 'Subscription created successfully',
        severity: 'success',
      });
      setCreateDialogOpen(false);
      fetchSubscriptions();
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.message || 'Failed to create subscription',
        severity: 'error',
      });
    }
  };

  const getTierOptions = (productId: string): string[] => {
    if (!productId) return [];
    
    // Get tiers for the specific product from API data
    const productTiersForProduct = productTiers.filter(tier => tier.product_id === productId);
    
    if (productTiersForProduct.length > 0) {
      // Return tier names from API data
      return productTiersForProduct.map(tier => tier.tier_name);
    }
    
    // Fallback to hardcoded values if no API data available
    const product = products.find((p) => p.id === productId);
    if (!product) return [];

    const productName = product.name.toLowerCase();
    if (productName.includes('transcript')) {
      return ['transcripts_tier_1', 'transcripts_tier_2', 'transcripts_tier_3'];
    } else if (productName.includes('admission')) {
      return ['admissions_tier_1', 'admissions_tier_2', 'admissions_tier_3'];
    }
    return ['tier_1', 'tier_2', 'tier_3'];
  };

  const handleFilterChange = (field: string, value: string): void => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPagination((prev) => ({ ...prev, page: 0 })); // Reset to first page
    
    // Clear tier filter when product changes
    if (field === 'product_id') {
      setFilters((prev) => ({ ...prev, tier_name: '' }));
    }
  };

  const handleClearFilters = (): void => {
    setFilters({
      organization_id: '',
      product_id: '',
      status: '',
      tier_name: '',
    });
    setPagination((prev) => ({ ...prev, page: 0 }));
  };

  const handlePageChange = (_event: unknown, newPage: number): void => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const newPageSize = parseInt(event.target.value, 10);
    setPagination((prev) => ({
      ...prev,
      pageSize: newPageSize,
      page: 0, // Reset to first page
    }));
  };

  const getTierColor = (
    tier: string
  ): 'primary' | 'secondary' | 'success' | 'info' | 'warning' => {
    if (tier.includes('tier_1')) return 'success';
    if (tier.includes('tier_2')) return 'info';
    if (tier.includes('tier_3')) return 'warning';
    return 'primary';
  };

  const getOrganizationIdString = (numericId: number): string => {
    return `org_${numericId.toString().padStart(6, '0')}`;
  };

  const getOrganizationName = (organizationId: number): string => {
    const org = organizations.find(
      (o) => o.organizationId === getOrganizationIdString(organizationId)
    );
    return org ? org.tenantName : `Organization ${organizationId}`;
  };

  const getProductName = (productId: string): string => {
    const product = products.find((p) => p.id === productId);
    return product ? product.name : `Product ${productId}`;
  };

  const handleUpdateSubscription = async (
    formData: UpdateSubscriptionRequest
  ): Promise<void> => {
    if (!selectedSubscription) return;

    try {
      await apiHelpers.updateSubscription(selectedSubscription.id, formData);
      setSnackbar({
        open: true,
        message: 'Subscription updated successfully',
        severity: 'success',
      });
      setSelectedSubscription(null);
      setEditMode(false);
      fetchSubscriptions();
    } catch (error: any) {
      console.error('Error updating subscription:', error);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.message || 'Failed to update subscription',
        severity: 'error',
      });
    }
  };

  const loadDropdownData = async (): Promise<void> => {
    await Promise.all([fetchOrganizations(), fetchProducts()]);
  };

  const handleOpenCreateDialog = async (): Promise<void> => {
    await loadDropdownData();
    setCreateDialogOpen(true);
  };

  // ────────────────────────────────────────
  // Filter Section Component
  // ────────────────────────────────────────

  const FilterSection: React.FC = () => (
    <Card sx={{ mb: 3 }} data-testid={TestIds.filterForm.container}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={handleClearFilters} 
            data-testid={TestIds.filterForm.clearButton}
          >
            Clear
          </Button>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Organization</InputLabel>
              <Select
                value={filters.organization_id}
                onChange={(e) =>
                  handleFilterChange('organization_id', e.target.value)
                }
                label="Organization"
                data-testid={TestIds.filterForm.organization}
              >
                <MenuItem value="">All Organizations</MenuItem>
                {organizations.map((org) => (
                  <MenuItem key={org.organizationId} value={parseInt(org.organizationId.replace('org_', ''), 10)}>
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
                onChange={(e) =>
                  handleFilterChange('product_id', e.target.value)
                }
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
                onChange={(e) => handleFilterChange('status', e.target.value)}
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
                onChange={(e) =>
                  handleFilterChange('tier_name', e.target.value)
                }
                label="Tier"
                disabled={!filters.product_id}
                data-testid={TestIds.filterForm.tier}
              >
                <MenuItem value="">All</MenuItem>
                {filters.product_id && getTierOptions(filters.product_id).map((tier) => (
                  <MenuItem key={tier} value={tier}>
                    {formatTierName(tier)}
                  </MenuItem>
                ))}
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
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h6">
            Subscriptions ({pagination.total})
          </Typography>
          <Button
            {...getButtonProps('create')}
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
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            data-testid={TestIds.common.errorAlert}
          >
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
                    <TableCell>End Date</TableCell>
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
                            backgroundColor: getStatusBackgroundColor(
                              subscription.status
                            ),
                            color: '#ffffff',
                          }}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={formatTierName(subscription.tier_name)}
                          color={getTierColor(subscription.tier_name)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(subscription.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {subscription.ends_at 
                          ? new Date(subscription.ends_at).toLocaleDateString()
                          : 'No end date'
                        }
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedSubscription(subscription);
                              setEditMode(false);
                            }}
                            data-testid={TestIds.subscriptions.viewDetails(
                              subscription.id
                            )}
                          >
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedSubscription(subscription);
                              setEditMode(true);
                            }}
                            data-testid={TestIds.subscriptions.edit(
                              subscription.id
                            )}
                          >
                            <EditIcon />
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

  // ────────────────────────────────────────
  // View Subscription Dialog Component
  // ────────────────────────────────────────

  interface ViewSubscriptionDialogProps {
    subscription: Subscription;
    onClose: () => void;
    organizations: Organization[];
    products: Product[];
    getTierByProductAndName: (productId: string, tierName: string) => any;
  }

  const ViewSubscriptionDialog: React.FC<ViewSubscriptionDialogProps> = ({
    subscription,
    onClose,
    organizations,
    products,
    getTierByProductAndName,
  }) => {
    const getOrganizationName = (organizationId: number): string => {
      const org = organizations.find(
        (o) => o.organizationId === `org_${organizationId.toString().padStart(6, '0')}`
      );
      return org ? org.tenantName : `Organization ${organizationId}`;
    };

    const getProductName = (productId: string): string => {
      const product = products.find((p) => p.id === productId);
      return product ? product.name : `Product ${productId}`;
    };

    // Get max limit using the hook function
    const getMaxLimit = (productId: string, tierName: string): number | undefined => {
      const tierData = getTierByProductAndName(productId, tierName);
      return tierData?.max_limit;
    };

    const maxLimit = getMaxLimit(subscription.product_id, subscription.tier_name);
    const currentUsage = subscription.current_usage;
    
    // Add debugging
    console.log('Debug subscription details:', {
      product_id: subscription.product_id,
      tier_name: subscription.tier_name,
      current_usage: currentUsage,
      tierData: getTierByProductAndName(subscription.product_id, subscription.tier_name),
      maxLimit: maxLimit
    });
    
    const usageDisplay = maxLimit 
      ? `${currentUsage}/${maxLimit}`
      : `${currentUsage}`;

    return (
      <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Subscription Details
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Organization
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {getOrganizationName(subscription.organization_id)}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Product
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {getProductName(subscription.product_id)}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label={subscription.status}
                  style={{
                    backgroundColor: getStatusBackgroundColor(subscription.status),
                    color: '#ffffff',
                  }}
                  size="small"
                  sx={{ mb: 2 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Tier
                </Typography>
                <Chip
                  label={formatTierName(subscription.tier_name)}
                  color={getTierColor(subscription.tier_name)}
                  size="small"
                  sx={{ mb: 2 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Current Usage / Max Limit
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {usageDisplay}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Auto Renewal
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {subscription.auto_renewal ? 'Yes' : 'No'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Start Date
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {new Date(subscription.starts_at).toLocaleDateString()}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  End Date
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {subscription.ends_at 
                    ? new Date(subscription.ends_at).toLocaleDateString()
                    : 'No end date'
                  }
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Billing Period Start
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {new Date(subscription.billing_period_start).toLocaleDateString()}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Billing Period End
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {subscription.billing_period_end 
                    ? new Date(subscription.billing_period_end).toLocaleDateString()
                    : 'No end date'
                  }
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {new Date(subscription.updated_at).toLocaleDateString()}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box data-testid={TestIds.subscriptions.page}>
      <Typography variant="h4" component="h1" gutterBottom>
        Subscriptions
      </Typography>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          data-testid={TestIds.common.errorAlert}
        >
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
        getTierOptions={getTierOptions}
      />

      {selectedSubscription && (
        <>
          {!editMode && (
            <ViewSubscriptionDialog
              subscription={selectedSubscription}
              onClose={() => {
                setSelectedSubscription(null);
                setEditMode(false);
              }}
              organizations={organizations}
              products={products}
              getTierByProductAndName={getTierByProductAndName}
            />
          )}
          {editMode && (
            <EditSubscriptionDialog
              subscription={selectedSubscription}
              onClose={() => {
                setSelectedSubscription(null);
                setEditMode(false);
              }}
              onSubmit={handleUpdateSubscription}
              getTierOptions={getTierOptions}
            />
          )}
        </>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
          data-testid={
            snackbar.severity === 'success'
              ? TestIds.common.successAlert
              : TestIds.common.errorAlert
          }
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

/**
 * ──────────────────────────────────────────────────
 * File: client/src/components/Subscriptions.tsx
 * Description: Subscriptions management page for TondroAI CRM
 * Author: Muhammad Abubakar Khan
 * Created: 18-06-2025
 * Last Updated: 03-07-2025
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
} from '../types';
import { getStatusBackgroundColor } from '../theme';
import { TestIds } from '../testIds';
import { getButtonProps } from '../utils/buttonStyles';
import { formatTierName, getTierColor } from '../utils/tierFormatter';
import { useProductTiers } from '../hooks/useProductTiers';
import OrganizationsDropdown from './common/OrganizationsDropdown';
import { useAuth } from '../contexts/AuthContext';
import { PERMISSIONS } from '../config/roles';
import { useEntityState, usePagination, useEntityData } from '../hooks';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { useAlert } from '@/contexts/AlertContext';

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
    tier: '',
    auto_renewal: true,
    starts_at: new Date().toISOString().split('T')[0] || '',
    ends_at: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setForm({
        organization_id: 0,
        product_id: '',
        tier: '',
        auto_renewal: true,
        starts_at: new Date().toISOString().split('T')[0] || '',
        ends_at: null,
      });
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  const tierOptions = getTierOptions(form.product_id);

  const handleChange = (field: keyof CreateSubscriptionRequest, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear tier when product changes
    if (field === 'product_id') {
      setForm(prev => ({ ...prev, tier: '' }));
    }
  };

  const handleSubmit = async () => {
    if (
      !form.organization_id ||
      !form.product_id ||
      !form.tier ||
      !form.starts_at
    ) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      // Calculate end date as one year from start date
      const startDate = new Date(form.starts_at);
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);

      // Format dates properly for backend API
      const formattedData = {
        ...form,
        auto_renewal: true, // Always true for new subscriptions
        starts_at: `${form.starts_at}T00:00:00`,
        ends_at: endDate.toISOString().split('T')[0] + 'T00:00:00',
      };

      await onSubmit(formattedData);
      onClose();
    } catch (e: any) {
      setError(getApiErrorMessage(e, 'Failed to create subscription'));
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
      tier: '',
      auto_renewal: true,
      starts_at: new Date().toISOString().split('T')[0] || '',
      ends_at: null,
    });
    setError(null);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      data-testid={TestIds.subscriptions.createDialog.container}
    >
      <DialogTitle data-testid={TestIds.subscriptions.createDialog.title}>
        Create New Subscription
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <OrganizationsDropdown
                value={form.organization_id || ''}
                onChange={value =>
                  handleChange('organization_id', Number(value))
                }
                label="Organization"
                required={true}
                testIdPrefix="subscriptions-create-organization"
                showAllOption={false}
                convertToNumeric={true}
                margin="normal"
                organizations={organizations as any}
                fetchFromApi={false}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Product *</InputLabel>
                <Select
                  value={form.product_id}
                  onChange={e => handleChange('product_id', e.target.value)}
                  label="Product *"
                  data-testid={TestIds.subscriptions.createDialog.product}
                >
                  {products.map(product => (
                    <MenuItem
                      key={product.id}
                      value={product.id}
                      data-testid={TestIds.subscriptions.createDialog.productOption(
                        product.id
                      )}
                    >
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
                  value={form.tier}
                  onChange={e => handleChange('tier', e.target.value)}
                  label="Tier *"
                  disabled={!form.product_id}
                  data-testid={TestIds.subscriptions.createDialog.tier}
                >
                  {tierOptions.map(tier => (
                    <MenuItem
                      key={tier}
                      value={tier}
                      data-testid={TestIds.subscriptions.createDialog.tierOption(
                        tier
                      )}
                    >
                      {formatTierName(tier)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Start Date"
                type="date"
                value={form.starts_at ? form.starts_at.slice(0, 10) : ''}
                onChange={e => handleChange('starts_at', e.target.value)}
                fullWidth
                margin="normal"
                InputLabelProps={{ shrink: true }}
                required
                data-testid={TestIds.subscriptions.createDialog.startDate}
                onKeyDown={e => e.preventDefault()}
                inputProps={{
                  min: new Date().toISOString().split('T')[0],
                  'data-testid': TestIds.subscriptions.createDialog.startDate,
                  'aria-label': 'Subscription start date input',
                }}
              />
            </Grid>
          </Grid>
          {error && (
            <Alert
              severity="error"
              sx={{ mt: 2 }}
              data-testid={TestIds.subscriptions.createDialog.error}
            >
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          disabled={submitting}
          data-testid={TestIds.subscriptions.createDialog.cancel}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting}
          data-testid={TestIds.subscriptions.createDialog.submit}
        >
          {submitting ? 'Creating...' : 'Create Subscription'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Add helper functions to handle both field formats
const getTierName = (subscription: Subscription): string => {
  return subscription.tier || '';
};

const getMaxLimit = (subscription: Subscription): number | null => {
  return subscription.max_limit !== undefined
    ? subscription.max_limit
    : subscription.usage_limit || null;
};

// Update the EditSubscriptionDialog to use the helper function
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
    tier: getTierName(subscription),
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tierOptions = getTierOptions(subscription.product_id);

  const handleChange = (field: keyof UpdateSubscriptionRequest, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(form);
      onClose();
    } catch (e: any) {
      setError(getApiErrorMessage(e, 'Failed to update subscription'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      data-testid={TestIds.subscriptions.editDialog.container}
    >
      <DialogTitle data-testid={TestIds.subscriptions.editDialog.title}>
        Edit Subscription
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Tier</InputLabel>
                <Select
                  value={form.tier || ''}
                  onChange={e => handleChange('tier', e.target.value)}
                  label="Tier"
                  data-testid={TestIds.subscriptions.editDialog.tier}
                >
                  {tierOptions.map(tier => (
                    <MenuItem
                      key={tier}
                      value={tier}
                      data-testid={TestIds.subscriptions.editDialog.tierOption(
                        tier
                      )}
                    >
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
                  value={form.status || ''}
                  onChange={e => handleChange('status', e.target.value)}
                  label="Status"
                  data-testid={TestIds.subscriptions.editDialog.status}
                >
                  <MenuItem
                    value="active"
                    data-testid={TestIds.subscriptions.editDialog.statusOption(
                      'active'
                    )}
                  >
                    Active
                  </MenuItem>
                  <MenuItem
                    value="inactive"
                    data-testid={TestIds.subscriptions.editDialog.statusOption(
                      'inactive'
                    )}
                  >
                    Inactive
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          {error && (
            <Alert
              severity="error"
              sx={{ mt: 2 }}
              data-testid={TestIds.subscriptions.editDialog.error}
            >
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          disabled={submitting}
          data-testid={TestIds.subscriptions.editDialog.cancel}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting}
          data-testid={TestIds.subscriptions.editDialog.submit}
        >
          {submitting ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ────────────────────────────────────────
// Main Component
// ────────────────────────────────────────

const Subscriptions: React.FC = () => {
  const { hasPermission } = useAuth();
  const {
    entityState,
    setEntityState,
    pagination,
    setPagination,
    filters,
    setFilters,
    createDialogOpen,
    setCreateDialogOpen,
    selectedEntity: selectedSubscription,
    setSelectedEntity: setSelectedSubscription,
    editMode,
    setEditMode,
  } = useEntityState<Subscription>(
    {
      organization_id: '',
      product_id: '',
      status: '',
      tier: '',
    },
    50
  );

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Product tiers hook for dynamic tier data
  const { tiers: productTiers } = useProductTiers();

  const { fetchData: fetchSubscriptions, refetch: refetchSubscriptions } =
    useEntityData(entityState, setEntityState, setPagination, {
      fetchFunction: async options => {
        const apiParams = {
          ...options?.params,
          ...(options?.params?.status && {
            status_filter: options.params.status,
          }),
        };
        delete apiParams.status;

        const response = await apiHelpers.getSubscriptions(
          apiParams,
          options?.signal
        );

        let items: Subscription[] = [];
        let total = 0;

        if (Array.isArray(response.data)) {
          items = response.data;
          total = response.data.length;
        } else if (response.data && 'items' in response.data) {
          items = response.data.items || [];
          total = response.data.total || 0;
        }

        return {
          data: {
            items,
            total,
          },
        };
      },
      filters,
      pagination,
    });

  const { showAlert } = useAlert();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setEntityState(prev => ({
        ...prev,
        error: 'No authentication token found. Please login again.',
        loading: false,
      }));
      return;
    }

    const timer = setTimeout(() => {
      fetchSubscriptions();
      loadDropdownData();
    }, 100);

    return () => clearTimeout(timer);
  }, [filters, pagination.page, pagination.pageSize]);

  useEffect(() => {
    if (entityState.error) {
      showAlert(
        getApiErrorMessage(entityState.error, 'Failed to fetch subscriptions.'),
        'error'
      );
    }
  }, [entityState.error, showAlert]);

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
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('No token available for products request');
        return;
      }

      const response = await apiHelpers.getProducts();

      // Handle both response formats
      let productsData: Product[] = [];

      if (Array.isArray(response.data)) {
        // Legacy format: direct array of products
        productsData = response.data;
      } else if (
        response.data &&
        typeof response.data === 'object' &&
        'products' in response.data
      ) {
        // New format: { success: boolean, message: string, products: Product[], total: number }
        productsData = response.data.products || [];
      } else {
        console.warn('Unexpected products response format:', response.data);
        productsData = [];
      }

      setProducts(productsData);
    } catch (error) {
      showAlert(getApiErrorMessage(error, 'Failed to fetch products'), 'error');
      // Don't show error for products as it's not critical
    }
  };

  const handleCreateSubscription = async (
    formData: CreateSubscriptionRequest
  ): Promise<void> => {
    try {
      await apiHelpers.createSubscription(formData);
      showAlert('Subscription created successfully!');
      setCreateDialogOpen(false);
      refetchSubscriptions();
    } catch (error: any) {
      showAlert(
        getApiErrorMessage(error, 'Failed to create subscription'),
        'error'
      );
    }
  };

  const getTierOptions = (productId: string): string[] => {
    if (!productId) return [];

    // Get tiers for the specific product from API data
    const productTiersForProduct = productTiers.filter(
      tier => tier.product_id === productId
    );

    if (productTiersForProduct.length > 0) {
      // Return tier names from API data
      return productTiersForProduct.map(tier => tier.tier_name);
    }

    // Fallback to hardcoded values if no API data available
    const product = products.find(p => p.id === productId);
    if (!product) return [];

    // Use name field instead of display_name
    const productName = (product.name || '').toLowerCase();
    if (productName.includes('transcript')) {
      return ['Trans 200', 'Trans 500', 'Trans 1000'];
    } else if (productName.includes('admission')) {
      return ['Admis 200', 'Admis 500', 'Admis 1000'];
    } else if (productName.includes('transcript')) {
      return ['transcripts_500', 'transcripts_1000', 'transcripts_2000'];
    } else if (productName.includes('admission')) {
      return ['admissions_200', 'admissions_500', 'admissions_1000'];
    }
    return ['tier_1', 'tier_2', 'tier_3'];
  };

  const handleFilterChange = (field: string, value: string): void => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 0 })); // Reset to first page

    // Clear tier filter when product changes
    if (field === 'product_id') {
      setFilters(prev => ({ ...prev, tier: '' }));
    }
  };

  const handleClearFilters = (): void => {
    setFilters({
      organization_id: '',
      product_id: '',
      status: '',
      tier: '',
    });
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const paginationHandlers = usePagination(pagination, setPagination);

  const getOrganizationName = (organizationId: number): string => {
    const org = organizations.find(o => o.id === organizationId);
    return org
      ? org.name || `Organization ${organizationId}`
      : `Organization ${organizationId}`;
  };

  const getProductName = (productId: string): string => {
    const product = products.find(p => p.id === productId);
    if (!product) return `Product ${productId}`;

    // Use name field instead of display_name
    return product.name || `Product ${productId}`;
  };

  const handleUpdateSubscription = async (
    formData: UpdateSubscriptionRequest
  ): Promise<void> => {
    if (!selectedSubscription) return;

    try {
      await apiHelpers.updateSubscription(selectedSubscription.id, formData);
      showAlert('Subscription updated successfully!');
      setSelectedSubscription(null);
      setEditMode(false);
      refetchSubscriptions();
    } catch (error: any) {
      showAlert(
        getApiErrorMessage(error, 'Failed to update subscription'),
        'error'
      );
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
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={2}
        >
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
            <OrganizationsDropdown
              value={filters.organization_id}
              onChange={value =>
                handleFilterChange('organization_id', String(value))
              }
              label="Organization"
              testIdPrefix="subscriptions-filter-organization"
              showAllOption={true}
              allOptionText="All Organizations"
              convertToNumeric={true}
              organizations={organizations as any}
              fetchFromApi={false}
              margin="none"
            />
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
                <MenuItem
                  value=""
                  data-testid={TestIds.filterForm.productOptionAll}
                >
                  All Products
                </MenuItem>
                {products.map(product => (
                  <MenuItem
                    key={product.id}
                    value={product.id}
                    data-testid={TestIds.filterForm.productOption(product.id)}
                  >
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
                <MenuItem
                  value=""
                  data-testid={TestIds.filterForm.statusOptionAll}
                >
                  All
                </MenuItem>
                <MenuItem
                  value="active"
                  data-testid={TestIds.filterForm.statusOption('active')}
                >
                  Active
                </MenuItem>
                <MenuItem
                  value="inactive"
                  data-testid={TestIds.filterForm.statusOption('inactive')}
                >
                  Inactive
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Tier</InputLabel>
              <Select
                value={filters.tier}
                onChange={e => handleFilterChange('tier', e.target.value)}
                label="Tier"
                disabled={!filters.product_id}
                data-testid={TestIds.filterForm.tier}
              >
                <MenuItem
                  value=""
                  data-testid={TestIds.filterForm.tierOptionAll}
                >
                  All
                </MenuItem>
                {filters.product_id &&
                  getTierOptions(filters.product_id).map(tier => (
                    <MenuItem
                      key={tier}
                      value={tier}
                      data-testid={TestIds.filterForm.tierOption(tier)}
                    >
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
          {hasPermission(PERMISSIONS.SUBSCRIPTION_CREATE) && (
            <Button
              {...getButtonProps('create')}
              onClick={handleOpenCreateDialog}
              data-testid={TestIds.subscriptions.createButton}
            >
              Create Subscription
            </Button>
          )}
        </Box>

        {entityState.loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress data-testid={TestIds.common.loadingSpinner} />
          </Box>
        ) : entityState.error ? (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            data-testid={TestIds.common.errorAlert}
          >
            {entityState.error}
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
                    <TableCell>Current Usage</TableCell>
                    <TableCell>End Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entityState.data.map(subscription => (
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
                          label={formatTierName(getTierName(subscription))}
                          color={getTierColor(getTierName(subscription))}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {getMaxLimit(subscription)
                          ? `${subscription.current_usage}/${getMaxLimit(subscription)}`
                          : `${subscription.current_usage}`}
                      </TableCell>
                      <TableCell>
                        {subscription.ends_at
                          ? new Date(subscription.ends_at).toLocaleDateString()
                          : 'No end date'}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {hasPermission(PERMISSIONS.SUBSCRIPTION_READ) && (
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
                          )}
                          {hasPermission(PERMISSIONS.SUBSCRIPTION_UPDATE) && (
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
                          )}
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
              onPageChange={paginationHandlers.handlePageChange}
              rowsPerPage={pagination.pageSize}
              onRowsPerPageChange={paginationHandlers.handlePageSizeChange}
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
  }

  const ViewSubscriptionDialog: React.FC<ViewSubscriptionDialogProps> = ({
    subscription,
    onClose,
    organizations,
    products,
  }) => {
    const getOrganizationName = (organizationId: number): string => {
      const org = organizations.find(o => o.id === organizationId);
      return org
        ? org.name || `Organization ${organizationId}`
        : `Organization ${organizationId}`;
    };

    const getProductName = (productId: string): string => {
      const product = products.find(p => p.id === productId);
      if (!product) return `Product ${productId}`;

      // Use name field instead of display_name
      return product.name || `Product ${productId}`;
    };

    // Use helper functions for tier and limit
    const tierName = getTierName(subscription);
    const maxLimit = getMaxLimit(subscription);

    const usageDisplay = maxLimit
      ? `${subscription.current_usage}/${maxLimit}`
      : `${subscription.current_usage}`;

    return (
      <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Subscription Details</DialogTitle>
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
                    backgroundColor: getStatusBackgroundColor(
                      subscription.status
                    ),
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
                  label={formatTierName(tierName)}
                  color={getTierColor(tierName)}
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
                    : 'No end date'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Billing Period Start
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {new Date(
                    subscription.billing_period_start
                  ).toLocaleDateString()}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Billing Period End
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {subscription.billing_period_end
                    ? new Date(
                        subscription.billing_period_end
                      ).toLocaleDateString()
                    : 'No end date'}
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
          <Button
            onClick={onClose}
            data-testid={TestIds.subscriptions.viewDialog.closeButton}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box data-testid={TestIds.subscriptions.page}>
      <Typography variant="h4" component="h1" gutterBottom>
        Subscriptions
      </Typography>

      {entityState.error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          data-testid={TestIds.common.errorAlert}
        >
          {entityState.error}
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
    </Box>
  );
};

export default Subscriptions;

// ──────────────────────────────────────────────────
// End of File: client/src/components/Subscriptions.tsx
// ──────────────────────────────────────────────────

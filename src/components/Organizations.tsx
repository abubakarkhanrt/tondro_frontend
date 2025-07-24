/**
 * ──────────────────────────────────────────────────
 * File: client/src/components/Organizations.tsx
 * Description: Organizations management component for TondroAI CRM
 * Author: Muhammad Abubakar Khan
 * Created: 18-06-2025
 * Last Updated: 04-07-2025
 * ──────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Snackbar,
  IconButton,
  Tooltip,
  Divider,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { debounce } from 'lodash';
import { apiHelpers } from '../services/api';
import {
  type Organization,
  type CreateOrganizationRequest,
  type UpdateOrganizationRequest,
  type Product,
  ERROR_MESSAGES,
  type ProductSubscriptionRequest,
  type Subscription,
  type CreateSubscriptionRequest,
  type CreateOrganizationApiRequest,
} from '../types';
import { getStatusBackgroundColor } from '../theme';
import { TestIds } from '../testIds';
import { formatTierName, getTierColor } from '../utils/tierFormatter';
import { getButtonProps } from '../utils/buttonStyles';
import DomainManagement from './DomainManagement';
import { useAuth } from '../contexts/AuthContext';
import { PERMISSIONS } from '../config/roles';
import { useEntityState, usePagination, useEntityData } from '../hooks';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ────────────────────────────────────────
// Utility Functions
// ────────────────────────────────────────

// Map frontend display values to backend API values
const mapStatusToApi = (displayStatus: string): string => {
  const statusMap: Record<string, string> = {
    Active: 'active',
    Pending: 'pending',
    Inactive: 'inactive',
  };
  return statusMap[displayStatus] || displayStatus;
};

// ────────────────────────────────────────
// Main Organizations Component
// ────────────────────────────────────────

const Organizations: React.FC = () => {
  const { hasPermission, user } = useAuth();
  const {
    entityState,
    setEntityState,
    pagination,
    setPagination,
    filters,
    setFilters,
    snackbar,
    setSnackbar,
    createDialogOpen,
    setCreateDialogOpen,
    selectedEntity: selectedOrg,
    setSelectedEntity: setSelectedOrg,
    editMode,
    setEditMode,
  } = useEntityState<Organization, { status: string; search: string }>(
    { status: '', search: '' },
    10
  );

  const [products, setProducts] = useState<Product[]>([]);
  const [allSubscriptions, setAllSubscriptions] = useState<Subscription[]>([]);

  const { fetchData: fetchOrganizations, refetch: refetchOrganizations } =
    useEntityData(entityState, setEntityState, setPagination, {
      fetchFunction: async options => {
        const params = {
          page: pagination.page + 1, // Convert to 1-based for API
          page_size: pagination.pageSize,
          ...(filters.status && {
            status_filter: mapStatusToApi(filters.status),
          }), // Map status to API format
          ...(filters.search && { search: filters.search }),
        };
        const response = await apiHelpers.getOrganizations(
          params,
          options?.signal
        );
        return {
          data: {
            items: response.data.organizations,
            total: response.data.total,
          },
        };
      },
      filters,
      pagination,
    });

  // ────────────────────────────────────────
  // API Functions
  // ────────────────────────────────────────

  const fetchProducts = useCallback(async (): Promise<void> => {
    try {
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
      console.error('Error fetching products:', error);
    }
  }, []);

  const fetchAllSubscriptions = useCallback(async (): Promise<void> => {
    try {
      const response = await apiHelpers.getSubscriptions();

      // Handle both response formats
      let subscriptionsData: Subscription[] = [];

      if (Array.isArray(response.data)) {
        // Direct array format (new backend format)
        subscriptionsData = response.data;
      } else if (
        response.data &&
        typeof response.data === 'object' &&
        'items' in response.data
      ) {
        // Paginated format (old backend format)
        subscriptionsData = response.data.items || [];
      } else {
        console.warn(
          'Unexpected subscriptions response format:',
          response.data
        );
        subscriptionsData = [];
      }

      setAllSubscriptions(subscriptionsData);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      setAllSubscriptions([]);
    }
  }, []);

  // Helper function to get subscriptions for a specific organization
  const getSubscriptionsForOrganization = useCallback(
    (organizationId: number): Subscription[] => {
      return allSubscriptions.filter(
        subscription => subscription.organization_id === organizationId
      );
    },
    [allSubscriptions]
  );

  const handleCreateOrganization = useCallback(
    async (
      formData: CreateOrganizationRequest & {
        initialSubscriptions: ProductSubscriptionRequest[];
      }
    ): Promise<void> => {
      try {
        if (!user?.id) {
          throw new Error(
            'User ID not found in user information. Please login again.'
          );
        }

        // Try to extract numeric part from the user ID
        let createdByValue: number | undefined;
        const userIdString = String(user.id); // Convert to string first
        const numericMatch = userIdString.match(/\d+/);
        if (numericMatch) {
          createdByValue = parseInt(numericMatch[0], 10);
        } else {
          createdByValue = undefined;
        }

        // Create the organization first (without subscriptions)
        const organizationRequestData: CreateOrganizationApiRequest = {
          name: formData.name,
          domain: formData.domain, // Changed from organizationDomain
          initial_admin_email: formData.initialAdminEmail,
          status: formData.initialStatus?.toLowerCase() as
            | 'active'
            | 'inactive'
            | 'pending',
          initial_admin_password: formData.initial_admin_password || '',
          ...(createdByValue !== undefined && { created_by: createdByValue }),
        };

        const organizationResponse = await apiHelpers.createOrganization(
          organizationRequestData
        );
        const createdOrganization = organizationResponse.data;

        // Create subscriptions one by one
        if (
          formData.initialSubscriptions &&
          formData.initialSubscriptions.length > 0
        ) {
          // The API returns 'id' field, not 'organizationId'
          const organizationId = createdOrganization.id;

          // Extract numeric organization ID for subscription creation
          const numericOrgId =
            typeof organizationId === 'string'
              ? parseInt(organizationId, 10)
              : organizationId; // If it's already a number

          for (const subscription of formData.initialSubscriptions) {
            try {
              const subscriptionRequestData: CreateSubscriptionRequest = {
                organization_id: numericOrgId,
                product_id: subscription.product_id,
                tier: subscription.tier_name,
                auto_renewal: subscription.auto_renewal ?? true,
                ends_at: `${subscription.ends_at}T00:00:00`, // Convert date to datetime format
              };

              await apiHelpers.createSubscription(subscriptionRequestData);
            } catch (subscriptionError: any) {
              console.error('Error creating subscription:', subscriptionError);
              // Continue with other subscriptions even if one fails
            }
          }
        }

        let message = 'Organization created';

        if (formData.initial_admin_password && navigator.clipboard) {
          navigator.clipboard.writeText(formData.initial_admin_password);
          message += ' and password copied to clipboard!';
        } else {
          message += '!';
        }

        setSnackbar({
          open: true,
          message: message,
          severity: 'success',
        });
        setCreateDialogOpen(false);
        refetchOrganizations();
        fetchAllSubscriptions(); // Refresh subscriptions to show newly created ones
      } catch (error: any) {
        setSnackbar({
          open: true,
          message: getApiErrorMessage(error, 'Failed to create organization'),
          severity: 'error',
        });
      }
    },
    [
      refetchOrganizations,
      fetchAllSubscriptions,
      setSnackbar,
      setCreateDialogOpen,
    ]
  );

  const handleUpdateOrganization = useCallback(
    async (formData: UpdateOrganizationRequest): Promise<void> => {
      if (!selectedOrg) return;

      try {
        // Map frontend field names to backend API field names
        const apiFormData = {
          name: formData.name,
          domain: formData.domain, // Changed from organizationDomain
          status: formData.status
            ? (mapStatusToApi(formData.status) as
                | 'active'
                | 'inactive'
                | 'pending')
            : 'active',
        };

        if (!selectedOrg.id) {
          throw new Error('Organization ID is required for update');
        }

        await apiHelpers.updateOrganization(selectedOrg.id, apiFormData as any);
        setSnackbar({
          open: true,
          message: 'Organization updated successfully',
          severity: 'success',
        });
        setSelectedOrg(null);
        setEditMode(false);
        refetchOrganizations();
      } catch (error: any) {
        setSnackbar({
          open: true,
          message: getApiErrorMessage(error, 'Failed to update organization'),
          severity: 'error',
        });
      }
    },
    [
      selectedOrg,
      refetchOrganizations,
      setSnackbar,
      setSelectedOrg,
      setEditMode,
    ]
  );

  // ────────────────────────────────────────
  // Event Handlers
  // ────────────────────────────────────────

  const paginationHandlers = usePagination(pagination, setPagination);

  const handleFilterChange = (newFilters: {
    status: string;
    search: string;
  }): void => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 0 })); // Reset to first page
  };

  const handleClearFilters = () => {
    setFilters({ status: '', search: '' });
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  // ────────────────────────────────────────
  // Effects
  // ────────────────────────────────────────

  useEffect(() => {
    fetchOrganizations();
    fetchAllSubscriptions(); // Fetch all subscriptions once
    fetchProducts();
  }, []);

  useEffect(() => {
    refetchOrganizations();
  }, [filters, pagination.page, pagination.pageSize]);

  // ────────────────────────────────────────
  // Filter Section Component
  // ────────────────────────────────────────

  interface FilterSectionProps {
    filters: { status: string; search: string };
    onFiltersChange: (filters: { status: string; search: string }) => void;
    onClearFilters: () => void;
  }

  const FilterSection: React.FC<FilterSectionProps> = ({
    filters,
    onFiltersChange,
    onClearFilters,
  }) => {
    const [localSearch, setLocalSearch] = useState<string>(filters.search);

    // Sync local state with parent filters
    useEffect(() => {
      setLocalSearch(filters.search);
    }, [filters.search]);

    // Create a stable, debounced version of the onFiltersChange callback
    const debouncedOnFiltersChange = useMemo(
      () => debounce(onFiltersChange, 500),
      [onFiltersChange]
    );

    // Cancel any pending debounced calls when the component unmounts
    useEffect(() => {
      return () => {
        debouncedOnFiltersChange.cancel();
      };
    }, [debouncedOnFiltersChange]);

    // Handle search input changes
    const handleSearchChange = (value: string) => {
      setLocalSearch(value);
      debouncedOnFiltersChange({ ...filters, search: value });
    };

    // Handle status changes immediately
    const handleStatusChange = (status: string) => {
      // Cancel any pending search updates to prevent using a stale status
      debouncedOnFiltersChange.cancel();
      onFiltersChange({ ...filters, status });
    };

    // Handle clearing filters
    const handleClear = () => {
      debouncedOnFiltersChange.cancel();
      onClearFilters();
    };

    return (
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
              onClick={handleClear}
              data-testid={TestIds.filterForm.clearButton}
            >
              Clear
            </Button>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Search"
                value={localSearch}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="Search organizations..."
                data-testid={TestIds.filterForm.search}
                inputProps={{
                  'data-testid': TestIds.filterForm.search,
                  'aria-label': 'Search organizations input',
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={e => handleStatusChange(e.target.value as string)}
                  label="Status"
                  data-testid={TestIds.filterForm.statusTrigger}
                  inputProps={{
                    'aria-label': 'Status filter',
                  }}
                >
                  <MenuItem
                    value=""
                    data-testid={TestIds.filterForm.statusOptionAll}
                  >
                    All
                  </MenuItem>
                  <MenuItem
                    value="Active"
                    data-testid={TestIds.filterForm.statusOption('Active')}
                  >
                    Active
                  </MenuItem>
                  <MenuItem
                    value="Pending"
                    data-testid={TestIds.filterForm.statusOption('Pending')}
                  >
                    Pending
                  </MenuItem>
                  <MenuItem
                    value="Inactive"
                    data-testid={TestIds.filterForm.statusOption('Inactive')}
                  >
                    Inactive
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  // ────────────────────────────────────────
  // Organizations Table Component
  // ────────────────────────────────────────

  const OrganizationsTable: React.FC<{
    products: Product[];
    hasPermission: (permission: Permission) => boolean;
  }> = ({ products, hasPermission }) => (
    <Card data-testid={TestIds.organizations.table}>
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
            Organizations ({pagination.total})
          </Typography>
          {hasPermission(PERMISSIONS.ORGANIZATION_CREATE) && (
            <Button
              {...getButtonProps('create')}
              onClick={() => setCreateDialogOpen(true)}
              data-testid={TestIds.organizations.createButton}
            >
              Create Organization
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
                    <TableCell>Tenant Name</TableCell>
                    <TableCell>Domain</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Subscriptions</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entityState.data.map(org => {
                    // Use the new organization format with 'id' field
                    const orgSubscriptions = getSubscriptionsForOrganization(
                      org.id
                    );

                    return (
                      <TableRow key={org.id}>
                        <TableCell>
                          <Typography variant="subtitle2">
                            {org.name}
                          </Typography>
                        </TableCell>
                        <TableCell>{org.domain}</TableCell>
                        <TableCell>
                          <Chip
                            label={org.status}
                            style={{
                              backgroundColor: getStatusBackgroundColor(
                                org.status
                              ),
                              color: '#ffffff',
                            }}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {orgSubscriptions.length > 0 ? (
                            <Box>
                              {orgSubscriptions.map((sub, index) => {
                                const product = products.find(
                                  p => p.id === sub.product_id
                                );
                                const productName =
                                  product?.name || `Product ${sub.product_id}`;

                                return (
                                  <Card
                                    key={index}
                                    sx={{
                                      mb: 1,
                                      p: 1,
                                      backgroundColor: 'grey.50',
                                    }}
                                  >
                                    <Grid
                                      container
                                      spacing={1}
                                      alignItems="center"
                                    >
                                      <Grid item xs={4}>
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          component="div"
                                        >
                                          Product:
                                        </Typography>
                                        <Typography
                                          variant="body2"
                                          component="div"
                                        >
                                          {productName}
                                        </Typography>
                                      </Grid>
                                      <Grid item xs={4}>
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          component="div"
                                        >
                                          Tier:
                                        </Typography>
                                        <Chip
                                          label={formatTierName(
                                            sub.tier || sub.tier_name || ''
                                          )}
                                          size="small"
                                          color={getTierColor(
                                            sub.tier || sub.tier_name || ''
                                          )}
                                        />
                                      </Grid>
                                      <Grid item xs={4}>
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          component="div"
                                        >
                                          Usage:
                                        </Typography>
                                        <Typography
                                          variant="body2"
                                          component="div"
                                        >
                                          {sub.current_usage || 0} /{' '}
                                          {sub.max_limit ||
                                            sub.usage_limit ||
                                            'Unlimited'}
                                        </Typography>
                                      </Grid>
                                    </Grid>
                                  </Card>
                                );
                              })}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No subscriptions
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {hasPermission(PERMISSIONS.ORGANIZATION_READ) && (
                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setSelectedOrg(org);
                                    setEditMode(false);
                                  }}
                                  data-testid={TestIds.organizations.viewDetails(
                                    org.id
                                  )}
                                >
                                  <VisibilityIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            {hasPermission(PERMISSIONS.ORGANIZATION_UPDATE) && (
                              <Tooltip title="Edit Organization">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setSelectedOrg(org);
                                    setEditMode(true);
                                  }}
                                  data-testid={TestIds.organizations.edit(
                                    org.id
                                  )}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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

  return (
    <Box data-testid={TestIds.organizations.page}>
      <Typography variant="h4" component="h1" gutterBottom>
        Organizations
      </Typography>

      <FilterSection
        filters={filters}
        onFiltersChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />

      <OrganizationsTable products={products} hasPermission={hasPermission} />

      <CreateOrganizationDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateOrganization as any}
        products={products}
      />

      {selectedOrg && !editMode && (
        <ViewOrganizationDialog
          organization={selectedOrg}
          onClose={() => setSelectedOrg(null)}
          onUpdate={() => setEditMode(true)}
          allSubscriptions={allSubscriptions}
          products={products}
        />
      )}

      {selectedOrg && editMode && (
        <EditOrganizationDialog
          organization={selectedOrg}
          onClose={() => {
            setSelectedOrg(null);
            setEditMode(false);
          }}
          onSubmit={handleUpdateOrganization}
        />
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
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

// ────────────────────────────────────────
// Subscription Form Component
// ────────────────────────────────────────

interface SubscriptionFormProps {
  subscriptions: ProductSubscriptionRequest[];
  onSubscriptionsChange: (subscriptions: ProductSubscriptionRequest[]) => void;
  products: Product[];
}

const SubscriptionForm: React.FC<SubscriptionFormProps> = ({
  subscriptions,
  onSubscriptionsChange,
  products,
}) => {
  const addSubscription = () => {
    const today = new Date().toISOString().split('T')[0]; // Default to today in YYYY-MM-DD format
    const oneYearLater = new Date();
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
    const endDate = oneYearLater.toISOString().split('T')[0];

    const newSubscription: ProductSubscriptionRequest = {
      product_id: '',
      tier_name: '',
      auto_renewal: true,
      starts_at: today || '',
      ends_at: endDate || '',
    };
    onSubscriptionsChange([...subscriptions, newSubscription]);
  };

  const removeSubscription = (index: number) => {
    const newSubscriptions = subscriptions.filter((_, i) => i !== index);
    onSubscriptionsChange(newSubscriptions);
  };

  const updateSubscription = (
    index: number,
    field: keyof ProductSubscriptionRequest,
    value: any
  ) => {
    const newSubscriptions = [...subscriptions];
    newSubscriptions[index] = {
      ...newSubscriptions[index],
      [field]: value,
    } as ProductSubscriptionRequest;

    // If start date is changed, automatically calculate end date (start date + 1 year)
    if (field === 'starts_at' && value) {
      const startDate = new Date(value);
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);
      newSubscriptions[index].ends_at =
        endDate.toISOString().split('T')[0] || '';
    }

    onSubscriptionsChange(newSubscriptions);
  };

  const getTierOptions = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return [];

    // Generate tier options based on product name
    const productName = product.name.toLowerCase();
    if (productName.includes('transcript')) {
      return ['Trans 200', 'Trans 500', 'Trans 1000'];
    } else if (productName.includes('admission')) {
      return ['Admis 200', 'Admis 500', 'Admis 1000'];
    }
    return ['tier_1', 'tier_2', 'tier_3'];
  };

  return (
    <Box data-testid={TestIds.organizations.subscriptionForm.container}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="h6">Initial Subscriptions</Typography>
        <Button
          startIcon={<AddIcon />}
          onClick={addSubscription}
          variant="outlined"
          size="small"
          data-testid={TestIds.organizations.subscriptionForm.addButton}
        >
          Add Subscription
        </Button>
      </Box>

      {subscriptions.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Please add at least one subscription for the organization.
        </Alert>
      )}

      {subscriptions.map((subscription, index) => (
        <Card
          key={index}
          sx={{ mb: 2, p: 2 }}
          data-testid={TestIds.organizations.subscriptionForm.subscriptionCard(
            index
          )}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography variant="subtitle1">
              Subscription {index + 1}
            </Typography>
            <IconButton
              onClick={() => removeSubscription(index)}
              color="error"
              size="small"
              data-testid={TestIds.organizations.subscriptionForm.removeButton(
                index
              )}
            >
              <RemoveIcon />
            </IconButton>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Product</InputLabel>
                <Select
                  value={subscription.product_id}
                  onChange={e =>
                    updateSubscription(index, 'product_id', e.target.value)
                  }
                  label="Product"
                  data-testid={TestIds.organizations.subscriptionForm.productSelect(
                    index
                  )}
                  inputProps={{
                    'aria-label': 'Product selection',
                  }}
                >
                  {products.map(product => (
                    <MenuItem
                      key={product.id}
                      value={product.id}
                      data-testid={TestIds.organizations.subscriptionForm.productSelectOption(
                        index,
                        product.id
                      )} // ✅ test ID for each item
                    >
                      {product.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Tier</InputLabel>
                <Select
                  value={subscription.tier_name}
                  onChange={e =>
                    updateSubscription(index, 'tier_name', e.target.value)
                  }
                  label="Tier"
                  disabled={!subscription.product_id}
                  data-testid={TestIds.organizations.subscriptionForm.tierSelect(
                    index
                  )}
                  inputProps={{
                    'aria-label': 'Tier selection',
                  }}
                >
                  {getTierOptions(subscription.product_id).map(tier => (
                    <MenuItem
                      key={tier}
                      value={tier}
                      data-testid={TestIds.organizations.subscriptionForm.tierSelectOption(
                        index,
                        tier
                      )} // ✅ Unique per option
                    >
                      {formatTierName(tier)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Starts At"
                type="date"
                value={subscription.starts_at}
                onChange={e =>
                  updateSubscription(index, 'starts_at', e.target.value)
                }
                fullWidth
                placeholder="e.g., 2024-01-01"
                data-testid={TestIds.organizations.subscriptionForm.startDate(
                  index
                )}
                onKeyDown={e => e.preventDefault()}
                inputProps={{
                  min: new Date().toISOString().split('T')[0],
                  'data-testid':
                    TestIds.organizations.subscriptionForm.startDate(index),
                  'aria-label': 'Subscription start date input',
                }}
              />
            </Grid>

            {/* Auto Renewal control hidden as requested
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={subscription.auto_renewal ?? true}
                    onChange={(e) =>
                      updateSubscription(
                        index,
                        'auto_renewal',
                        e.target.checked
                      )
                    }
                  />
                }
                label="Auto Renewal"
              />
            </Grid>
            */}
          </Grid>
        </Card>
      ))}
    </Box>
  );
};

// ────────────────────────────────────────
// Create Organization Dialog Component
// ────────────────────────────────────────

interface CreateOrganizationDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    data: CreateOrganizationRequest & {
      initialSubscriptions: ProductSubscriptionRequest[];
    }
  ) => Promise<void>;
  products: Product[];
}

const CreateOrganizationDialog: React.FC<CreateOrganizationDialogProps> = ({
  open,
  onClose,
  onSubmit,
  products,
}) => {
  const [formData, setFormData] = useState<
    CreateOrganizationRequest & {
      initialSubscriptions: ProductSubscriptionRequest[];
    }
  >({
    name: '',
    domain: '', // Changed from organizationDomain
    initialAdminEmail: '',
    initialSubscriptions: [],
    initialStatus: 'Active',
    initial_admin_password: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubscriptionsChange = (
    subscriptions: ProductSubscriptionRequest[]
  ) => {
    setFormData(prev => ({ ...prev, initialSubscriptions: subscriptions }));
  };

  const validateDomainName = (name: string): boolean => {
    const domainRegex =
      /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return domainRegex.test(name);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Tenant name is required';
    }

    if (!formData.domain?.trim()) {
      // Changed from organizationDomain
      newErrors.domain = 'Organization domain is required'; // Changed from organizationDomain
    } else if (!validateDomainName(formData.domain)) {
      // Changed from organizationDomain
      newErrors.domain = 'Please enter a valid domain name (e.g., company.com)'; // Changed from organizationDomain
    }

    if (!formData.initialAdminEmail?.trim()) {
      newErrors.initialAdminEmail = 'Admin email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.initialAdminEmail)) {
      newErrors.initialAdminEmail = 'Please enter a valid email address';
    }

    if (!formData.initial_admin_password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(formData.initial_admin_password)) {
        newErrors.password =
          'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.';
      }
    }

    if (formData.initial_admin_password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.initialSubscriptions.length === 0) {
      newErrors.subscriptions = 'Please add at least one subscription';
    } else {
      const invalidSubscriptions = formData.initialSubscriptions.filter(
        sub => !sub.product_id || !sub.tier_name || !sub.starts_at
      );

      if (invalidSubscriptions.length > 0) {
        newErrors.subscriptions =
          'Please complete all subscription details (product, tier, and start date are required)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error: any) {
      // Handle specific domain-related errors
      const errorMessage = getApiErrorMessage(
        error,
        'Failed to create organization'
      );
      const userFriendlyMessage =
        ERROR_MESSAGES[errorMessage as keyof typeof ERROR_MESSAGES] ||
        errorMessage;

      // Set specific field errors if available
      if (errorMessage.includes('domain') || errorMessage.includes('Domain')) {
        setErrors(prev => ({
          ...prev,
          domain: userFriendlyMessage, // Changed from organizationDomain
        }));
      } else {
        setErrors(prev => ({ ...prev, general: userFriendlyMessage }));
      }
    } finally {
      setLoading(false);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      domain: '', // Changed from organizationDomain
      initialAdminEmail: '',
      initialSubscriptions: [],
      initialStatus: 'Active',
      initial_admin_password: '',
    });
    setConfirmPassword('');
    setErrors({});
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      data-testid={TestIds.organizations.createDialog.container}
    >
      <DialogTitle data-testid={TestIds.organizations.createDialog.title}>
        Create New Organization
      </DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mt: 2, mb: 1 }}>
          The initial admin password can only be set once. Please save it in a
          secure location.
        </Alert>
        <Box sx={{ pt: 1 }}>
          {errors.general && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              data-testid={TestIds.organizations.createDialog.error}
            >
              {errors.general}
            </Alert>
          )}

          <TextField
            label="Organization Name"
            value={formData.name}
            onChange={e => handleChange('name', e.target.value)}
            fullWidth
            margin="normal"
            required
            error={!!errors.name}
            helperText={errors.name}
            data-testid={TestIds.organizations.createDialog.tenantName}
            inputProps={{
              'data-testid': TestIds.organizations.createDialog.tenantName,
              'aria-label': 'Tenant name input',
            }}
          />
          <TextField
            label="Organization Domain"
            value={formData.domain}
            onChange={e => handleChange('domain', e.target.value)}
            fullWidth
            margin="normal"
            required
            placeholder="example.com"
            error={!!errors.domain}
            helperText={
              errors.domain || 'Enter a unique domain name for the organization'
            }
            data-testid={TestIds.organizations.createDialog.domain} // Changed from organizationDomain
            inputProps={{
              'data-testid': TestIds.organizations.createDialog.domain, // Changed from organizationDomain
              'aria-label': 'Organization domain input',
            }}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Organization Status</InputLabel>
            <Select
              value={formData.initialStatus || 'Active'}
              onChange={e => handleChange('initialStatus', e.target.value)}
              label="Organization Status"
              data-testid={TestIds.organizations.createDialog.status}
              inputProps={{
                'data-testid': TestIds.organizations.createDialog.status,
                'aria-label': 'Initial status selection',
              }}
            >
              <MenuItem
                value="Active"
                data-testid={TestIds.organizations.createDialog.statusOption(
                  'Active'
                )}
              >
                Active
              </MenuItem>
              <MenuItem
                value="Pending"
                data-testid={TestIds.organizations.createDialog.statusOption(
                  'Pending'
                )}
              >
                Pending
              </MenuItem>
              <MenuItem
                value="Inactive"
                data-testid={TestIds.organizations.createDialog.statusOption(
                  'Inactive'
                )}
              >
                Inactive
              </MenuItem>
            </Select>
          </FormControl>

          <Divider sx={{ my: 3 }} />

          <TextField
            label="Initial Admin Email"
            type="email"
            value={formData.initialAdminEmail}
            onChange={e => handleChange('initialAdminEmail', e.target.value)}
            fullWidth
            margin="normal"
            required
            error={!!errors.initialAdminEmail}
            helperText={errors.initialAdminEmail}
            data-testid={TestIds.organizations.createDialog.adminEmail}
            inputProps={{
              'data-testid': TestIds.organizations.createDialog.adminEmail,
              'aria-label': 'Admin email input',
            }}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Initial Admin Password"
            type={showPassword ? 'text' : 'password'}
            value={formData.initial_admin_password}
            onChange={e =>
              handleChange('initial_admin_password', e.target.value)
            }
            required
            error={!!errors.password}
            helperText={errors.password}
            data-testid={TestIds.organizations.createDialog.password}
            InputProps={{
              endAdornment: (
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              ),
            }}
            inputProps={{
              'data-testid': TestIds.organizations.createDialog.password,
              'aria-label': 'Initial admin password input',
            }}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Confirm Password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            data-testid={TestIds.organizations.createDialog.confirmPassword}
            InputProps={{
              endAdornment: (
                <IconButton
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  edge="end"
                >
                  {showConfirmPassword ? (
                    <VisibilityOffIcon />
                  ) : (
                    <VisibilityIcon />
                  )}
                </IconButton>
              ),
            }}
            inputProps={{
              'data-testid': TestIds.organizations.createDialog.confirmPassword,
              'aria-label': 'Confirm password input',
            }}
          />

          <Divider sx={{ my: 3 }} />

          <SubscriptionForm
            subscriptions={formData.initialSubscriptions}
            onSubscriptionsChange={handleSubscriptionsChange}
            products={products}
          />

          {errors.subscriptions && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {errors.subscriptions}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          data-testid={TestIds.organizations.createDialog.cancel}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || formData.initialSubscriptions.length === 0}
          data-testid={TestIds.organizations.createDialog.submit}
        >
          {loading ? 'Creating...' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ────────────────────────────────────────
// View Organization Dialog Component
// ────────────────────────────────────────

interface ViewOrganizationDialogProps {
  organization: Organization;
  onClose: () => void;
  onUpdate: () => void;
  allSubscriptions: Subscription[];
  products: Product[];
}

const ViewOrganizationDialog: React.FC<ViewOrganizationDialogProps> = ({
  organization,
  onClose,
  allSubscriptions,
  products,
}) => {
  const [activeTab, setActiveTab] = useState<number>(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Helper function to get subscriptions for this organization
  const getOrganizationSubscriptions = (): Subscription[] => {
    const numericOrgId = organization.id || 0;
    return allSubscriptions.filter(
      subscription => subscription.organization_id === numericOrgId
    );
  };

  const renderOrganizationDetails = () => {
    const orgSubscriptions = getOrganizationSubscriptions();

    return (
      <Box sx={{ pt: 1 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              component="div"
            >
              Organization ID
            </Typography>
            <Typography variant="body1" gutterBottom component="div">
              {organization.id}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              component="div"
            >
              Tenant Name
            </Typography>
            <Typography variant="body1" gutterBottom component="div">
              {organization.name}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              component="div"
            >
              Primary Domain
            </Typography>
            <Typography variant="body1" gutterBottom component="div">
              {organization.domain} {/* Changed from organizationDomain */}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              component="div"
            >
              Status
            </Typography>
            <Chip
              label={organization.status}
              style={{
                backgroundColor: getStatusBackgroundColor(organization.status),
                color: '#ffffff',
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              component="div"
            >
              Created
            </Typography>
            <Typography variant="body1" gutterBottom component="div">
              {organization.created_at
                ? new Date(organization.created_at).toLocaleString()
                : 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography
              variant="subtitle2"
              color="text.secondary"
              gutterBottom
              component="div"
            >
              Subscriptions ({orgSubscriptions.length})
            </Typography>
            {orgSubscriptions.length > 0 ? (
              <Box>
                {orgSubscriptions.map((sub, index) => {
                  const product = products.find(p => p.id === sub.product_id);
                  const productName =
                    product?.name || `Product ${sub.product_id}`;

                  return (
                    <Card key={index} sx={{ mb: 1, p: 1 }}>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            component="div"
                          >
                            Product:
                          </Typography>
                          <Typography variant="body1" component="div">
                            {productName}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            component="div"
                          >
                            Tier:
                          </Typography>
                          <Chip
                            label={formatTierName(
                              sub.tier || sub.tier_name || ''
                            )}
                            size="small"
                            color={getTierColor(
                              sub.tier || sub.tier_name || ''
                            )}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            component="div"
                          >
                            Status:
                          </Typography>
                          <Chip
                            label={sub.status}
                            size="small"
                            color={
                              sub.status === 'active'
                                ? 'success'
                                : sub.status === 'trial'
                                  ? 'warning'
                                  : 'default'
                            }
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            component="div"
                          >
                            Usage:
                          </Typography>
                          <Typography variant="body1" component="div">
                            {sub.current_usage || 0} /{' '}
                            {sub.max_limit || sub.usage_limit || 'Unlimited'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            component="div"
                          >
                            Start Date:
                          </Typography>
                          <Typography variant="body1" component="div">
                            {sub.starts_at
                              ? new Date(sub.starts_at).toLocaleDateString()
                              : 'No start date'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            component="div"
                          >
                            End Date:
                          </Typography>
                          <Typography variant="body1" component="div">
                            {sub.ends_at
                              ? new Date(sub.ends_at).toLocaleDateString()
                              : 'No end date'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            component="div"
                          >
                            Auto Renewal:
                          </Typography>
                          <Typography variant="body1" component="div">
                            {sub.auto_renewal ? 'Yes' : 'No'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            component="div"
                          >
                            Last Updated:
                          </Typography>
                          <Typography variant="body1" component="div">
                            {new Date(sub.updated_at).toLocaleString()}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Card>
                  );
                })}
              </Box>
            ) : (
              <Typography
                variant="body1"
                color="text.secondary"
                component="div"
              >
                No subscriptions found for this organization
              </Typography>
            )}
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderDomainManagement = () => (
    <Box sx={{ pt: 1 }}>
      <DomainManagement
        organizationId={organization.id.toString()}
        organizationName={organization.name || ''}
      />
    </Box>
  );

  return (
    <Dialog open={!!organization} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Organization Details: {organization?.name}</DialogTitle>
      <DialogContent>
        {organization && (
          <>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
            >
              <Tab label="Details" />
              <Tab label="Domain Management" />
            </Tabs>

            {activeTab === 0 && renderOrganizationDetails()}
            {activeTab === 1 && renderDomainManagement()}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          data-testid={TestIds.organizations.viewDialog.closeButton}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ────────────────────────────────────────
// Edit Organization Dialog Component
// ────────────────────────────────────────

interface EditOrganizationDialogProps {
  organization: Organization;
  onClose: () => void;
  onSubmit: (data: UpdateOrganizationRequest) => Promise<void>;
}

const EditOrganizationDialog: React.FC<EditOrganizationDialogProps> = ({
  organization,
  onClose,
  onSubmit,
}) => {
  // Map backend status to frontend display format
  const mapStatusFromApi = (apiStatus: string): string => {
    const statusMap: Record<string, string> = {
      active: 'Active',
      pending: 'Pending',
      inactive: 'Inactive',
    };
    return statusMap[apiStatus] || apiStatus;
  };

  const [formData, setFormData] = useState<UpdateOrganizationRequest>({
    name: organization.name || '',
    domain: organization.domain || '',
    status: mapStatusFromApi(organization.status) as
      | 'Active'
      | 'Inactive'
      | 'Pending',
  });
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (): Promise<void> => {
    if (!formData.name?.trim() || !formData.domain?.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error in edit dialog:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={!!organization}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      data-testid={TestIds.organizations.editDialog.container}
    >
      <DialogTitle data-testid={TestIds.organizations.editDialog.title}>
        Edit Organization
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <TextField
            fullWidth
            label="Organization Name" // Changed from "Tenant Name"
            value={formData.name} // Changed from tenantName
            onChange={
              e => setFormData({ ...formData, name: e.target.value }) // Changed from tenantName
            }
            margin="normal"
            required
            data-testid={TestIds.organizations.editDialog.tenantName} // Changed from tenantName
            inputProps={{
              'data-testid': TestIds.organizations.editDialog.tenantName, // Changed from tenantName
              'aria-label': 'Organization name input',
            }}
          />
          <TextField
            fullWidth
            label="Organization Domain"
            value={formData.domain} // Changed from organizationDomain
            onChange={
              e => setFormData({ ...formData, domain: e.target.value }) // Changed from organizationDomain
            }
            margin="normal"
            required
            data-testid={TestIds.organizations.editDialog.domain} // Changed from organizationDomain
            inputProps={{
              'data-testid': TestIds.organizations.editDialog.domain, // Changed from organizationDomain
              'aria-label': 'Organization domain input',
            }}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              value={formData.status || ''}
              onChange={e =>
                setFormData({ ...formData, status: e.target.value as any })
              }
              label="Status"
              data-testid={TestIds.organizations.editDialog.status}
              inputProps={{
                'data-testid': TestIds.organizations.editDialog.status,
                'aria-label': 'Status selection',
              }}
            >
              <MenuItem
                value="Active"
                data-testid={TestIds.organizations.editDialog.statusOption(
                  'Active'
                )}
              >
                Active
              </MenuItem>
              <MenuItem
                value="Pending"
                data-testid={TestIds.organizations.editDialog.statusOption(
                  'Pending'
                )}
              >
                Pending
              </MenuItem>
              <MenuItem
                value="Inactive"
                data-testid={TestIds.organizations.editDialog.statusOption(
                  'Inactive'
                )}
              >
                Inactive
              </MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          data-testid={TestIds.organizations.editDialog.cancel}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          data-testid={TestIds.organizations.editDialog.submit}
        >
          {loading ? 'Updating...' : 'Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Organizations;

// ──────────────────────────────────────────────────
// End of File: client/src/components/Organizations.tsx
// ──────────────────────────────────────────────────

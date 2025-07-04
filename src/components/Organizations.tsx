/**
 * ──────────────────────────────────────────────────
 * File: client/src/components/Organizations.tsx
 * Description: Organizations management component for TondroAI CRM
 * Author: Muhammad Abubakar Khan
 * Created: 18-06-2025
 * Last Updated: 04-07-2025
 * ──────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
} from '@mui/icons-material';
import { debounce } from 'lodash';
import axios from 'axios';
import { apiHelpers } from '../services/api';
import {
  type Organization,
  type OrganizationsResponse,
  type CreateOrganizationRequest,
  type UpdateOrganizationRequest,
  type Product,
  ERROR_MESSAGES,
  type ProductSubscriptionRequest,
  type Subscription,
  type CreateSubscriptionRequest,
} from '../types';
import { getStatusBackgroundColor } from '../theme';
import { TestIds } from '../testIds';
import { formatTierName, getTierColor } from '../utils/tierFormatter';
import { getButtonProps } from '../utils/buttonStyles';
import DomainManagement from './DomainManagement';

// ────────────────────────────────────────
// Component State Interfaces
// ────────────────────────────────────────

interface OrganizationsState {
  organizations: Organization[];
  loading: boolean;
  error: string;
  abortController: AbortController | null;
}

interface FiltersState {
  status: string;
  search: string;
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

// ────────────────────────────────────────
// Utility Functions
// ────────────────────────────────────────

// Map frontend display values to backend API values
const mapStatusToApi = (displayStatus: string): string => {
  const statusMap: Record<string, string> = {
    Active: 'active',
    Pending: 'pending', // Changed from 'Trial' to 'Pending'
    Inactive: 'inactive',
  };
  return statusMap[displayStatus] || displayStatus;
};

// Map backend API values to frontend display values
/*
const mapStatusFromApi = (apiStatus: string): string => {
  const statusMap: Record<string, string> = {
    'active': 'Active',
    'suspended': 'Suspended',
    'pending': 'Trial', // Map 'pending' back to 'Trial' for display
    'inactive': 'Inactive',
  };
  return statusMap[apiStatus] || apiStatus;
};
*/
// ────────────────────────────────────────
// Main Organizations Component
// ────────────────────────────────────────

const Organizations: React.FC = () => {
  // State management
  const [organizations, setOrganizations] = useState<OrganizationsState>({
    organizations: [],
    loading: false,
    error: '',
    abortController: null,
  });

  const [filters, setFilters] = useState<FiltersState>({
    status: '',
    search: '',
  });

  const [pagination, setPagination] = useState<PaginationState>({
    page: 0,
    pageSize: 10,
    total: 0,
  });

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info',
  });

  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [allSubscriptions, setAllSubscriptions] = useState<Subscription[]>([]);

  // ────────────────────────────────────────
  // API Functions
  // ────────────────────────────────────────

  const fetchOrganizations = useCallback(async (): Promise<void> => {
    // Cancel previous request if it exists
    if (organizations.abortController) {
      organizations.abortController.abort();
    }

    const abortController = apiHelpers.createAbortController();
    setOrganizations(prev => ({
      ...prev,
      loading: true,
      error: '',
      abortController,
    }));

    try {
      const params = {
        page: pagination.page + 1, // Convert to 1-based for API
        limit: pagination.pageSize,
        ...(filters.status && { status: mapStatusToApi(filters.status) }), // Map status to API format
        ...(filters.search && { search: filters.search }),
      };

      const response = await apiHelpers.getOrganizations(
        params,
        abortController.signal
      );
      const data: OrganizationsResponse = response.data;

      setOrganizations(prev => ({
        ...prev,
        organizations: data.organizations,
        loading: false,
        error: '',
      }));

      setPagination(prev => ({
        ...prev,
        total: data.total,
        page: data.page - 1, // Convert back to 0-based for MUI
      }));
    } catch (error: any) {
      if (!axios.isCancel(error)) {
        console.error('Error fetching organizations:', error);
        setOrganizations(prev => ({
          ...prev,
          loading: false,
          error:
            error.response?.data?.message || 'Failed to fetch organizations',
        }));
      }
    }
  }, [pagination.page, pagination.pageSize, filters.status, filters.search]);

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
    async (formData: {
      name: string;
      domain: string; // Changed from organizationDomain
      initialAdminEmail: string;
      initialStatus?: 'Active' | 'Inactive' | 'Pending';
      initialSubscriptions: ProductSubscriptionRequest[];
    }): Promise<void> => {
      try {
        // Get current user from localStorage
        const userStr = localStorage.getItem('user');
        const currentUser = userStr ? JSON.parse(userStr) : null;

        console.log('🔍 Current user from localStorage:', currentUser);

        if (!currentUser) {
          throw new Error('User information not found. Please login again.');
        }

        // The actual user ID is in user_id, not id
        const userId = currentUser.user_id;

        if (!userId) {
          throw new Error(
            'User ID not found in user information. Please login again.'
          );
        }

        console.log('✅ Found user ID:', userId);

        // Try to extract numeric part from the user ID
        let createdByValue: number | undefined;
        const numericMatch = userId.match(/\d+/);
        if (numericMatch) {
          createdByValue = parseInt(numericMatch[0], 10);
          console.log('✅ Extracted numeric user ID:', createdByValue);
        } else {
          console.log(
            '⚠️ No numeric user ID found, proceeding without created_by'
          );
          createdByValue = undefined;
        }

        // Create the organization first (without subscriptions)
        const organizationRequestData = {
          name: formData.name,
          domain: formData.domain, // Changed from organizationDomain
          initialAdminEmail: formData.initialAdminEmail,
          initialStatus: formData.initialStatus || 'Active',
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

              console.log('📤 Creating subscription:', subscriptionRequestData);
              await apiHelpers.createSubscription(subscriptionRequestData);
              console.log('✅ Subscription created successfully');
            } catch (subscriptionError: any) {
              console.error('Error creating subscription:', subscriptionError);
              // Continue with other subscriptions even if one fails
            }
          }
        }

        setSnackbar({
          open: true,
          message: 'Organization and subscriptions created successfully',
          severity: 'success',
        });
        setCreateDialogOpen(false);
        fetchOrganizations();
        fetchAllSubscriptions(); // Refresh subscriptions to show newly created ones
      } catch (error: any) {
        console.error('Error creating organization:', error);
        setSnackbar({
          open: true,
          message:
            error.response?.data?.message || 'Failed to create organization',
          severity: 'error',
        });
      }
    },
    [
      fetchOrganizations,
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
        fetchOrganizations();
      } catch (error: any) {
        console.error('Error updating organization:', error);
        setSnackbar({
          open: true,
          message:
            error.response?.data?.message || 'Failed to update organization',
          severity: 'error',
        });
      }
    },
    [selectedOrg, fetchOrganizations, setSnackbar, setSelectedOrg, setEditMode]
  );

  // ────────────────────────────────────────
  // Event Handlers
  // ────────────────────────────────────────

  const handleFilterChange = useCallback(
    (newFilters: { status: string; search: string }): void => {
      setFilters(newFilters);
      setPagination(prev => ({ ...prev, page: 0 })); // Reset to first page
    },
    [setFilters, setPagination]
  );

  const handlePageChange = useCallback(
    (_event: unknown, newPage: number): void => {
      setPagination(prev => ({ ...prev, page: newPage }));
    },
    [setPagination]
  );

  const handlePageSizeChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newPageSize = parseInt(event.target.value, 10);
      setPagination(prev => ({
        ...prev,
        pageSize: newPageSize,
        page: 0, // Reset to first page
      }));
    },
    [setPagination]
  );

  const handleClearFilters = useCallback(() => {
    setFilters({ status: '', search: '' });
    setPagination(prev => ({ ...prev, page: 0 }));
  }, []);

  // ────────────────────────────────────────
  // Effects
  // ────────────────────────────────────────

  useEffect(() => {
    fetchOrganizations();
    fetchAllSubscriptions(); // Fetch all subscriptions once
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Add this useEffect to refetch organizations when filters or pagination change
  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // ────────────────────────────────────────
  // Filter Section Component
  // ────────────────────────────────────────

  interface FilterSectionProps {
    filters: FiltersState;
    onFiltersChange: (filters: FiltersState) => void;
    onClearFilters: () => void;
  }

  const FilterSection: React.FC<FilterSectionProps> = ({
    filters,
    onFiltersChange,
    onClearFilters,
  }) => {
    const [localSearch, setLocalSearch] = useState<string>(filters.search);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Sync local state with parent filters
    useEffect(() => {
      setLocalSearch(filters.search);
    }, [filters.search]);

    // Stable debounced search handler using useRef
    const debouncedSearchRef = useRef(
      debounce((searchValue: string) => {
        onFiltersChange({ ...filters, search: searchValue });
      }, 500)
    );

    // Update the debounced function when filters or onFiltersChange changes
    useEffect(() => {
      debouncedSearchRef.current = debounce((searchValue: string) => {
        onFiltersChange({ ...filters, search: searchValue });
      }, 500);
    }, [filters, onFiltersChange]);

    // Handle search input change
    const handleSearchChange = useCallback((value: string) => {
      setLocalSearch(value);
      debouncedSearchRef.current(value);
    }, []);

    // Handle clear filters
    const handleClearFilters = useCallback(() => {
      setLocalSearch('');
      onClearFilters();
    }, [onClearFilters]);

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
              onClick={handleClearFilters}
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
                inputRef={searchInputRef}
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
                  onChange={e =>
                    onFiltersChange({ ...filters, status: e.target.value })
                  }
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

  const OrganizationsTable: React.FC<{ products: Product[] }> = () => (
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
          <Button
            {...getButtonProps('create')}
            onClick={() => setCreateDialogOpen(true)}
            data-testid={TestIds.organizations.createButton}
          >
            Create Organization
          </Button>
        </Box>

        {organizations.loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress data-testid={TestIds.common.loadingSpinner} />
          </Box>
        ) : organizations.error ? (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            data-testid={TestIds.common.errorAlert}
          >
            {organizations.error}
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
                  {organizations.organizations.map(org => {
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
                            <Tooltip title="Edit Organization">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedOrg(org);
                                  setEditMode(true);
                                }}
                                data-testid={TestIds.organizations.edit(org.id)}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
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
    <Box data-testid={TestIds.organizations.page}>
      <Typography variant="h4" component="h1" gutterBottom>
        Organizations
      </Typography>

      <FilterSection
        filters={filters}
        onFiltersChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />

      <OrganizationsTable products={products} />

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
                inputProps={{
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
  onSubmit: (data: CreateOrganizationRequest) => Promise<void>;
  products: Product[];
}

const CreateOrganizationDialog: React.FC<CreateOrganizationDialogProps> = ({
  open,
  onClose,
  onSubmit,
  products,
}) => {
  const [formData, setFormData] = useState<{
    name: string;
    domain: string; // Changed from organizationDomain
    initialAdminEmail: string;
    initialSubscriptions: ProductSubscriptionRequest[];
    initialStatus: 'Active' | 'Inactive' | 'Pending';
  }>({
    name: '',
    domain: '', // Changed from organizationDomain
    initialAdminEmail: '',
    initialSubscriptions: [],
    initialStatus: 'Active',
  });
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
      setFormData({
        name: '',
        domain: '', // Changed from organizationDomain
        initialAdminEmail: '',
        initialSubscriptions: [],
        initialStatus: 'Active',
      });
      setErrors({});
    } catch (error: any) {
      console.error('Error in create dialog:', error);
      // Handle specific domain-related errors
      const errorMessage =
        error.response?.data?.message || 'Failed to create organization';
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
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      domain: '', // Changed from organizationDomain
      initialAdminEmail: '',
      initialSubscriptions: [],
      initialStatus: 'Active',
    });
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
          <FormControl fullWidth margin="normal">
            <InputLabel>Initial Status</InputLabel>
            <Select
              value={formData.initialStatus || 'Active'}
              onChange={e => handleChange('initialStatus', e.target.value)}
              label="Initial Status"
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

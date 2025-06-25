/**
 * ──────────────────────────────────────────────────
 * File: client/src/components/Organizations.tsx
 * Description: Organizations management component for TondroAI CRM
 * Author: Muhammad Abubakar Khan
 * Created: 18-06-2025
 * Last Updated: 25-06-2025
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

  // ────────────────────────────────────────
  // API Functions
  // ────────────────────────────────────────

  const fetchOrganizations = useCallback(async (): Promise<void> => {
    // Cancel previous request if it exists
    if (organizations.abortController) {
      organizations.abortController.abort();
    }

    const abortController = apiHelpers.createAbortController();
    setOrganizations((prev) => ({
      ...prev,
      loading: true,
      error: '',
      abortController,
    }));

    try {
      const params = {
        page: pagination.page + 1, // Convert to 1-based for API
        limit: pagination.pageSize,
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
      };

      const response = await apiHelpers.getOrganizations(
        params,
        abortController.signal
      );
      const data: OrganizationsResponse = response.data;

      setOrganizations((prev) => ({
        ...prev,
        organizations: data.organizations,
        loading: false,
        error: '',
      }));

      setPagination((prev) => ({
        ...prev,
        total: data.total,
        page: data.page - 1, // Convert back to 0-based for MUI
      }));
    } catch (error: any) {
      if (!axios.isCancel(error)) {
        console.error('Error fetching organizations:', error);
        setOrganizations((prev) => ({
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
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }, []);

  const handleCreateOrganization = useCallback(
    async (formData: CreateOrganizationRequest): Promise<void> => {
      try {
        await apiHelpers.createOrganization(formData);
        setSnackbar({
          open: true,
          message: 'Organization created successfully',
          severity: 'success',
        });
        setCreateDialogOpen(false);
        fetchOrganizations();
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
    [fetchOrganizations, setSnackbar, setCreateDialogOpen]
  );

  // ────────────────────────────────────────
  // Event Handlers
  // ────────────────────────────────────────

  const handleFilterChange = useCallback(
    (newFilters: { status: string; search: string }): void => {
      setFilters(newFilters);
      setPagination((prev) => ({ ...prev, page: 0 })); // Reset to first page
    },
    [setFilters, setPagination]
  );

  const handlePageChange = useCallback(
    (_event: unknown, newPage: number): void => {
      setPagination((prev) => ({ ...prev, page: newPage }));
    },
    [setPagination]
  );

  const handlePageSizeChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newPageSize = parseInt(event.target.value, 10);
      setPagination((prev) => ({
        ...prev,
        pageSize: newPageSize,
        page: 0, // Reset to first page
      }));
    },
    [setPagination]
  );

  const handleUpdateOrganization = useCallback(
    async (formData: UpdateOrganizationRequest): Promise<void> => {
      if (!selectedOrg) return;

      try {
        await apiHelpers.updateOrganization(
          selectedOrg.organizationId,
          formData
        );
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

  const handleClearFilters = useCallback(() => {
    setFilters({ status: '', search: '' });
    setPagination((prev) => ({ ...prev, page: 0 }));
  }, []);

  // ────────────────────────────────────────
  // Effects
  // ────────────────────────────────────────

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search organizations..."
                inputRef={searchInputRef}
                data-testid={TestIds.filterForm.search}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, status: e.target.value })
                  }
                  label="Status"
                  data-testid={TestIds.filterForm.status}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Suspended">Suspended</MenuItem>
                  <MenuItem value="Trial">Trial</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
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
                  {organizations.organizations.map((org) => (
                    <TableRow key={org.organizationId}>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {org.tenantName}
                        </Typography>
                      </TableCell>
                      <TableCell>{org.organizationDomain}</TableCell>
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
                        {org.subscriptions && org.subscriptions.length > 0 ? (
                          <Box>
                            {org.subscriptions.map((sub, index) => (
                              <Card
                                key={index}
                                sx={{ mb: 1, p: 1, backgroundColor: 'grey.50' }}
                              >
                                <Grid container spacing={1} alignItems="center">
                                  <Grid item xs={4}>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      component="div"
                                    >
                                      Product:
                                    </Typography>
                                    <Typography variant="body2" component="div">
                                      {(sub as any).product_name}
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
                                      label={formatTierName((sub as any).tier)}
                                      size="small"
                                      color={getTierColor((sub as any).tier)}
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
                                    <Typography variant="body2" component="div">
                                      {(sub as any).current_usage || 0} /{' '}
                                      {(sub as any).usage_limit || 'Unlimited'}
                                    </Typography>
                                  </Grid>
                                </Grid>
                              </Card>
                            ))}
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
                                org.organizationId
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
                              data-testid={TestIds.organizations.edit(
                                org.organizationId
                              )}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
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
        onSubmit={handleCreateOrganization}
        products={products}
      />

      {selectedOrg && !editMode && (
        <ViewOrganizationDialog
          organization={selectedOrg}
          onClose={() => setSelectedOrg(null)}
          onUpdate={() => setEditMode(true)}
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
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
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
    const newSubscription: ProductSubscriptionRequest = {
      product_id: '',
      tier_name: '',
      auto_renewal: true,
      ends_at: new Date().toISOString().split('T')[0], // Default to today in YYYY-MM-DD format
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
    newSubscriptions[index] = { ...newSubscriptions[index], [field]: value };
    onSubscriptionsChange(newSubscriptions);
  };

  const getTierOptions = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return [];

    // Generate tier options based on product name
    const productName = product.name.toLowerCase();
    if (productName.includes('transcript')) {
      return ['transcripts_tier_1', 'transcripts_tier_2', 'transcripts_tier_3'];
    } else if (productName.includes('admission')) {
      return ['admissions_tier_1', 'admissions_tier_2', 'admissions_tier_3'];
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
        <Card key={index} sx={{ mb: 2, p: 2 }} data-testid={TestIds.organizations.subscriptionForm.subscriptionCard(index)}>
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
              data-testid={TestIds.organizations.subscriptionForm.removeButton(index)}
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
                  onChange={(e) =>
                    updateSubscription(index, 'product_id', e.target.value)
                  }
                  label="Product"
                  data-testid={TestIds.organizations.subscriptionForm.productSelect(index)}
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
              <FormControl fullWidth>
                <InputLabel>Tier</InputLabel>
                <Select
                  value={subscription.tier_name}
                  onChange={(e) =>
                    updateSubscription(index, 'tier_name', e.target.value)
                  }
                  label="Tier"
                  disabled={!subscription.product_id}
                  data-testid={TestIds.organizations.subscriptionForm.tierSelect(index)}
                >
                  {getTierOptions(subscription.product_id).map((tier) => (
                    <MenuItem key={tier} value={tier}>
                      {formatTierName(tier)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Ends At"
                type="date"
                value={subscription.ends_at}
                onChange={(e) =>
                  updateSubscription(index, 'ends_at', e.target.value)
                }
                fullWidth
                placeholder="e.g., 2024-01-01"
                data-testid={TestIds.organizations.subscriptionForm.endDate(index)}
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
  const [formData, setFormData] = useState<CreateOrganizationRequest>({
    tenantName: '',
    organizationDomain: '',
    initialAdminEmail: '',
    initialSubscriptions: [],
    initialStatus: 'Active',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof CreateOrganizationRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubscriptionsChange = (
    subscriptions: ProductSubscriptionRequest[]
  ) => {
    setFormData((prev) => ({ ...prev, initialSubscriptions: subscriptions }));
  };

  const validateDomainName = (name: string): boolean => {
    const domainRegex =
      /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return domainRegex.test(name);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.tenantName?.trim()) {
      newErrors.tenantName = 'Tenant name is required';
    }

    if (!formData.organizationDomain?.trim()) {
      newErrors.organizationDomain = 'Organization domain is required';
    } else if (!validateDomainName(formData.organizationDomain)) {
      newErrors.organizationDomain =
        'Please enter a valid domain name (e.g., company.com)';
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
        (sub) => !sub.product_id || !sub.tier_name
      );

      if (invalidSubscriptions.length > 0) {
        newErrors.subscriptions =
          'Please complete all subscription details (product and tier are required)';
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
        tenantName: '',
        organizationDomain: '',
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
        setErrors((prev) => ({
          ...prev,
          organizationDomain: userFriendlyMessage,
        }));
      } else {
        setErrors((prev) => ({ ...prev, general: userFriendlyMessage }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      tenantName: '',
      organizationDomain: '',
      initialAdminEmail: '',
      initialSubscriptions: [],
      initialStatus: 'Active',
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth data-testid={TestIds.organizations.createDialog.container}>
      <DialogTitle data-testid={TestIds.organizations.createDialog.title}>Create New Organization</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {errors.general && (
            <Alert severity="error" sx={{ mb: 2 }} data-testid={TestIds.organizations.createDialog.error}>
              {errors.general}
            </Alert>
          )}

          <TextField
            label="Tenant Name"
            value={formData.tenantName}
            onChange={(e) => handleChange('tenantName', e.target.value)}
            fullWidth
            margin="normal"
            required
            error={!!errors.tenantName}
            helperText={errors.tenantName}
            data-testid={TestIds.organizations.createDialog.tenantName}
          />
          <TextField
            label="Organization Domain"
            value={formData.organizationDomain}
            onChange={(e) => handleChange('organizationDomain', e.target.value)}
            fullWidth
            margin="normal"
            required
            placeholder="example.com"
            error={!!errors.organizationDomain}
            helperText={
              errors.organizationDomain ||
              'Enter a unique domain name for the organization'
            }
            data-testid={TestIds.organizations.createDialog.organizationDomain}
          />
          <TextField
            label="Initial Admin Email"
            type="email"
            value={formData.initialAdminEmail}
            onChange={(e) => handleChange('initialAdminEmail', e.target.value)}
            fullWidth
            margin="normal"
            required
            error={!!errors.initialAdminEmail}
            helperText={errors.initialAdminEmail}
            data-testid={TestIds.organizations.createDialog.adminEmail}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Initial Status</InputLabel>
            <Select
              value={formData.initialStatus || 'Active'}
              onChange={(e) => handleChange('initialStatus', e.target.value)}
              label="Initial Status"
              data-testid={TestIds.organizations.createDialog.status}
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Suspended">Suspended</MenuItem>
              <MenuItem value="Trial">Trial</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
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
        <Button onClick={handleClose} data-testid={TestIds.organizations.createDialog.cancel}>Cancel</Button>
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
}

const ViewOrganizationDialog: React.FC<ViewOrganizationDialogProps> = ({
  organization,
  onClose,
  // onUpdate,
}) => {
  // const [metrics, setMetrics] = useState<OrganizationMetrics | null>(null);
  // const [loading, setLoading] = useState<boolean>(false);

  // const fetchMetrics = async (): Promise<void> => {
  //   try {
  //     setLoading(true);
  //     const response = await apiHelpers.getOrganizationMetrics(organization.organizationId);
  //     console.log('Organization metrics response:', response.data);
  //     setMetrics(response.data);
  //   } catch (error) {
  //     console.error('Error fetching metrics:', error);
  //     setMetrics({ error: 'Failed to load metrics' });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // useEffect(() => {
  //   fetchMetrics();
  // }, [organization.organizationId]);

  const [activeTab, setActiveTab] = useState<number>(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const renderOrganizationDetails = () => (
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
            {organization.organizationId}
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
            {organization.tenantName}
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
            {organization.organizationDomain}
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
            {new Date(organization.createdAt).toLocaleString()}
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography
            variant="subtitle2"
            color="text.secondary"
            gutterBottom
            component="div"
          >
            Subscriptions
          </Typography>
          {organization.subscriptions &&
          organization.subscriptions.length > 0 ? (
            <Box>
              {organization.subscriptions.map((sub, index) => (
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
                        {(sub as any).product_name ||
                          `Product ID: ${sub.product_id}`}
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
                          (sub as any).tier || sub.tier_name
                        )}
                        size="small"
                        color={getTierColor((sub as any).tier || sub.tier_name)}
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
                        label={(sub as any).status || sub.status}
                        size="small"
                        color={
                          (sub as any).status === 'active'
                            ? 'success'
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
                        {(sub as any).current_usage || 0} /{' '}
                        {(sub as any).usage_limit || 'Unlimited'}
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
                        {(sub as any).ends_at
                          ? new Date((sub as any).ends_at).toLocaleDateString()
                          : 'No end date'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Card>
              ))}
            </Box>
          ) : (
            <Typography variant="body1" color="text.secondary" component="div">
              No subscriptions
            </Typography>
          )}
        </Grid>
      </Grid>

      {/* Metrics section temporarily hidden
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress />
        </Box>
      ) : metrics && !metrics.error ? (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Additional Metrics
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Card>
                <CardContent>
                  <Typography variant="h4" color="primary">
                    {metrics.total_users || metrics.users_count || metrics.user_count || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Users
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card>
                <CardContent>
                  <Typography variant="h4" color="primary">
                    {metrics.active_subscriptions || metrics.subscriptions_count || metrics.subscription_count || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Subscriptions
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      ) : metrics?.error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {metrics.error}
        </Alert>
      ) : null}
      */}
    </Box>
  );

  const renderDomainManagement = () => (
    <Box sx={{ pt: 1 }}>
      <DomainManagement
        organizationId={organization.organizationId}
        organizationName={organization.tenantName}
      />
    </Box>
  );

  return (
    <Dialog open={!!organization} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Organization Details: {organization?.tenantName}
      </DialogTitle>
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
        <Button onClick={onClose}>Close</Button>
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
  const [formData, setFormData] = useState<UpdateOrganizationRequest>({
    tenantName: organization.tenantName,
    organizationDomain: organization.organizationDomain,
    status: organization.status,
  });
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (): Promise<void> => {
    if (!formData.tenantName?.trim() || !formData.organizationDomain?.trim()) {
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
    <Dialog open={!!organization} onClose={onClose} maxWidth="sm" fullWidth data-testid={TestIds.organizations.editDialog.container}>
      <DialogTitle data-testid={TestIds.organizations.editDialog.title}>Edit Organization</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <TextField
            fullWidth
            label="Tenant Name"
            value={formData.tenantName}
            onChange={(e) =>
              setFormData({ ...formData, tenantName: e.target.value })
            }
            margin="normal"
            required
            data-testid={TestIds.organizations.editDialog.tenantName}
          />
          <TextField
            fullWidth
            label="Organization Domain"
            value={formData.organizationDomain}
            onChange={(e) =>
              setFormData({ ...formData, organizationDomain: e.target.value })
            }
            margin="normal"
            required
            data-testid={TestIds.organizations.editDialog.organizationDomain}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as any })
              }
              label="Status"
              data-testid={TestIds.organizations.editDialog.status}
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Suspended">Suspended</MenuItem>
              <MenuItem value="Trial">Trial</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} data-testid={TestIds.organizations.editDialog.cancel}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading} data-testid={TestIds.organizations.editDialog.submit}>
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

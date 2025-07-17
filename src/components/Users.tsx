/**
 * ──────────────────────────────────────────────────
 * File: client/src/components/Users.tsx
 * Description: Users management page for TondroAI CRM
 * Author: Muhammad Abubakar Khan
 * Created: 18-06-2025
 * Last Updated: 10-07-2025
 * ──────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  IconButton,
  Chip,
  TablePagination,
  Snackbar,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { apiHelpers } from '../services/api';
import axios from 'axios';
import {
  type User,
  type OrganizationV2,
  type CreateUserRequest,
  type UpdateUserRequest,
  type SnackbarState,
  type Domain,
} from '../types';
import { getStatusBackgroundColor } from '../theme';
import { TestIds } from '../testIds';
import { getButtonProps } from '../utils/buttonStyles';
import { useUserRoles } from '../contexts/UserRolesContext';
import { debounce } from 'lodash';
import OrganizationsDropdown from './common/OrganizationsDropdown';

// ────────────────────────────────────────
// Helper Functions
// ────────────────────────────────────────

const getRoleColor = (
  role: string
): 'error' | 'warning' | 'info' | 'default' => {
  // Handle both backend format and display format
  const normalizedRole = role.toLowerCase().replace('_', ' ');

  switch (normalizedRole) {
    case 'super admin':
      return 'error';
    case 'tenant admin':
      return 'warning';
    default:
      return 'default';
  }
};

const getRoleDisplayName = (role: string): string => {
  switch (role) {
    case 'super_admin':
      return 'Super Admin';
    case 'tenant_admin':
      return 'Tenant Admin';
    case 'Super Admin':
      return 'Super Admin';
    case 'Tenant Admin':
      return 'Tenant Admin';
    default:
      return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
};

/*
const getRoleInternalValue = (displayName: string): string => {
  switch (displayName) {
    case 'Super Admin':
      return 'super_admin';
    case 'Tenant Admin':
      return 'tenant_admin';
    default:
      return displayName.toLowerCase().replace(' ', '_');
  }
};
*/

const getDomainName = (
  user: User,
  domains: Record<string, Domain[]>
): string => {
  // Flatten all domains from all organizations to search for user's assigned domain
  const allDomains = Object.values(domains).flat();

  // Find the domain assigned to this specific user
  const userDomain = allDomains.find(domain => domain.user_id === user.id);

  if (userDomain) {
    return userDomain.domain_name || 'Unknown';
  }

  // Fallback: if no direct assignment, show primary domain for their organization
  const orgId = user.organization_id;
  const orgDomains = domains[orgId] || [];

  const primaryDomain = orgDomains.find(d => d.is_primary);
  if (primaryDomain) {
    return primaryDomain.domain_name || 'Unknown';
  }

  // Final fallback: first available domain for organization
  if (orgDomains.length > 0) {
    return orgDomains[0]?.domain_name || 'Unknown';
  }

  return 'N/A';
};

// Get available roles that match the expected role values
const availableRoles = ['super_admin', 'tenant_admin'];

// ────────────────────────────────────────
// Main Component
// ────────────────────────────────────────

const Users: React.FC = () => {
  const { userRoles } = useUserRoles();
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationV2[]>([]);
  const [domains, setDomains] = useState<Record<string, Domain[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [filters, setFilters] = useState({
    organization_id: null as number | null, // Changed from 0 to null
    role: '',
    status: '',
    search: '',
  });
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 50,
    total: 0,
  });
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  const initialLoadRef = useRef<boolean>(false);

  // Single useEffect for initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      const token = localStorage.getItem('access_token');
      if (token) {
        fetchUsers();
        fetchOrganizations();
        fetchDomains();
        initialLoadRef.current = true;
      } else {
        setError('No authentication token found. Please login again.');
        setLoading(false);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (abortController) {
        abortController.abort();
      }
    };
  }, []); // Empty dependency array

  // Separate useEffect for filters/pagination changes
  useEffect(() => {
    // Only run if initial load is complete
    if (initialLoadRef.current) {
      const token = localStorage.getItem('access_token');
      if (token) {
        fetchUsers();
      }
    }
  }, [filters, pagination.page, pagination.pageSize]);

  const fetchUsers = async (): Promise<void> => {
    if (abortController) {
      abortController.abort();
    }
    const controller = apiHelpers.createAbortController();
    setAbortController(controller);
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Authentication token not found. Please login again.');
        setLoading(false);
        return;
      }

      // Convert organization_id from string format to integer for API
      const apiParams = {
        page: pagination.page + 1,
        page_size: pagination.pageSize,
        ...filters,
      };

      // Remove empty parameters
      Object.keys(apiParams).forEach(key => {
        if (apiParams[key as keyof typeof apiParams] === '')
          delete apiParams[key as keyof typeof apiParams];
      });

      // Convert parameters for API compatibility
      const finalApiParams = {
        ...apiParams,
        ...(apiParams.organization_id !== null &&
          apiParams.organization_id !== undefined && {
            organization_id: apiParams.organization_id,
          }),
        ...(apiParams.status && { status: apiParams.status.toLowerCase() }),
      } as any;

      // Try API filtering first, then fallback to frontend filtering
      try {
        const response = await apiHelpers.getUsers(
          finalApiParams,
          controller.signal
        );
        const usersData = response.data.items || response.data || [];
        setUsers(usersData);
        setPagination(prev => ({
          ...prev,
          total:
            response.data.total ||
            (response.data.items
              ? response.data.items.length
              : usersData.length),
        }));
      } catch (error: any) {
        // If API filtering fails, fall back to frontend filtering
        if (error.response?.status === 500 || error.response?.status === 400) {
          console.log(
            'API filtering failed, falling back to frontend filtering...'
          );

          // Remove all filters and fetch all users
          const {
            status,
            role,
            organization_id,
            search,
            ...paramsWithoutFilters
          } = apiParams;
          const response = await apiHelpers.getUsers(
            paramsWithoutFilters,
            controller.signal
          );
          const allUsers = response.data.items || response.data || [];

          // Apply filters on the frontend
          let filteredUsers = allUsers;

          // Apply status filter
          if (status) {
            filteredUsers = filteredUsers.filter(
              user => user.status.toLowerCase() === status.toLowerCase()
            );
          }

          // Apply role filter
          if (role) {
            filteredUsers = filteredUsers.filter(
              user => user.role.toLowerCase() === role.toLowerCase()
            );
          }

          // Apply organization filter
          if (organization_id) {
            filteredUsers = filteredUsers.filter(
              user => user.organization_id === organization_id
            );
          }

          // Apply search filter
          if (search) {
            const searchLower = search.toLowerCase();
            filteredUsers = filteredUsers.filter(
              user =>
                user.email.toLowerCase().includes(searchLower) ||
                user.first_name.toLowerCase().includes(searchLower) ||
                user.last_name.toLowerCase().includes(searchLower)
            );
          }

          setUsers(filteredUsers);
          setPagination(prev => ({
            ...prev,
            total: filteredUsers.length,
          }));
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      if (axios.isCancel(error)) {
        return;
      }
      console.error('Error fetching users:', error);
      if (error.response && error.response.status === 401) {
        setError('Authentication failed. Please login again.');
      } else {
        setError('Failed to load users. Please try again.');
      }
    } finally {
      setLoading(false);
      setAbortController(null);
    }
  };

  const fetchOrganizations = async (): Promise<void> => {
    try {
      const response = await apiHelpers.getOrganizations();
      const orgs: OrganizationV2[] = (response.data as any).organizations || [];
      setOrganizations(orgs);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const fetchDomains = async (): Promise<void> => {
    try {
      const response = await apiHelpers.getDomains();
      // Fix: Use the correct response structure - domains are in response.data.domains
      const allDomains =
        response.data.domains || (response.data as any).items || [];

      // Group domains by organization_id
      const domainsByOrg: Record<string, Domain[]> = {};

      allDomains.forEach(domain => {
        const orgId = domain.organization_id;
        if (!domainsByOrg[orgId]) {
          domainsByOrg[orgId] = [];
        }
        domainsByOrg[orgId].push(domain);
      });

      setDomains(domainsByOrg);
    } catch (error) {
      console.error('Error fetching domains:', error);
      // Don't set error state as domains are not critical for page functionality
    }
  };

  const handleCreateUser = async (
    formData: CreateUserRequest
  ): Promise<void> => {
    try {
      // Step 1: Create user without domain_id
      const userData = {
        organization_id: formData.organization_id,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
      };

      const userResponse = await apiHelpers.createUser(userData as any);
      const newUserId = userResponse.data.id;

      // Step 2: Update the selected domain with the new user_id
      if (formData.domain_id) {
        try {
          await apiHelpers.updateDomain(String(formData.domain_id), {
            user_id: newUserId,
          });
        } catch (domainError) {
          console.error('Failed to assign domain to user:', domainError);
          // Optionally delete the user if domain assignment fails
          // await apiHelpers.deleteUser(newUserId);
          throw new Error('User created but domain assignment failed');
        }
      }

      setSnackbar({
        open: true,
        message: 'User created and domain assigned successfully',
        severity: 'success',
      });
      setCreateDialogOpen(false);
      fetchUsers();
      fetchDomains(); // Refresh domains to show updated user assignments
    } catch (error: any) {
      console.error('Error creating user:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to create user',
        severity: 'error',
      });
    }
  };

  const handleDeleteUser = async (
    id: number,
    reason: string = ''
  ): Promise<void> => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await apiHelpers.deleteUser(id, reason);
      setSnackbar({
        open: true,
        message: 'User deleted successfully',
        severity: 'success',
      });
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete user',
        severity: 'error',
      });
    }
  };

  const handleFilterChange = (field: string, value: string | number): void => {
    setFilters(prev => ({
      ...prev,
      [field]: field === 'organization_id' && value === 0 ? null : value,
    }));
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const handlePageChange = (_event: unknown, newPage: number): void => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setPagination(prev => ({
      ...prev,
      pageSize: parseInt(event.target.value, 10),
      page: 0,
    }));
  };

  const handleUpdateUser = async (
    formData: UpdateUserRequest
  ): Promise<void> => {
    if (!selectedUser) return;

    try {
      // Step 1: Update user without domain_id - only include fields that have values
      const userData: UpdateUserRequest = {};

      if (formData.organization_id !== undefined) {
        userData.organization_id = formData.organization_id;
      }
      if (formData.email !== undefined) {
        userData.email = formData.email;
      }
      if (formData.first_name !== undefined) {
        userData.first_name = formData.first_name;
      }
      if (formData.last_name !== undefined) {
        userData.last_name = formData.last_name;
      }
      if (formData.role !== undefined) {
        userData.role = formData.role;
      }
      if (formData.status !== undefined) {
        userData.status = formData.status;
      }

      await apiHelpers.updateUser(selectedUser.id, userData);

      // Step 2: Handle domain assignment if domain selection changed
      // Find the current domain assigned to this user
      //const allDomains = Object.values(domains).flat();
      //const currentUserDomain = allDomains.find(domain => domain.user_id === selectedUser.id);

      // Get the selected domain from the edit dialog state
      // We need to access the selectedDomainId from the EditUserDialog component
      // For now, we'll handle this in the EditUserDialog's handleSubmit

      setSnackbar({
        open: true,
        message: 'User updated successfully',
        severity: 'success',
      });
      setSelectedUser(null);
      setEditMode(false);
      fetchUsers();
      fetchDomains(); // Refresh domains to show updated user assignments
    } catch (error: any) {
      console.error('Error updating user:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to update user',
        severity: 'error',
      });
    }
  };

  const handleClearFilters = () => {
    setFilters({
      organization_id: null, // Changed from 0 to null
      role: '',
      status: '',
      search: '',
    });
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  return (
    <Box data-testid={TestIds.users.page}>
      <Typography variant="h4" component="h1" gutterBottom>
        Users
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

      <FilterSection
        filters={filters}
        organizations={organizations}
        userRoles={userRoles}
        handleFilterChange={handleFilterChange}
        handleClearFilters={handleClearFilters}
      />

      <UsersTable
        users={users}
        organizations={organizations}
        domains={domains}
        loading={loading}
        error={error}
        pagination={pagination}
        handlePageChange={handlePageChange}
        handlePageSizeChange={handlePageSizeChange}
        handleDeleteUser={handleDeleteUser}
        setSelectedUser={setSelectedUser}
        setCreateDialogOpen={setCreateDialogOpen}
        setEditMode={setEditMode}
      />

      <CreateUserDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateUser}
        organizations={organizations}
        domains={domains}
      />

      {selectedUser && (
        <>
          {!editMode && (
            <ViewUserDialog
              user={selectedUser}
              onClose={() => {
                setSelectedUser(null);
                setEditMode(false);
              }}
              onUpdate={fetchUsers}
              organizations={organizations}
              domains={domains}
              setEditMode={setEditMode}
            />
          )}
          {editMode && (
            <EditUserDialog
              user={selectedUser}
              onClose={() => {
                setSelectedUser(null);
                setEditMode(false);
              }}
              onSubmit={handleUpdateUser}
              organizations={organizations}
              domains={domains}
              userRoles={userRoles}
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

export default Users;

// ──────────────────────────────────────────────────
// End of File: client/src/components/Users.tsx
// ──────────────────────────────────────────────────

// ────────────────────────────────────────
// Filter Section Component
// ────────────────────────────────────────

interface FilterSectionProps {
  filters: {
    organization_id: number | null; // Changed from number to number | null
    role: string;
    status: string;
    search: string;
  };
  organizations: OrganizationV2[]; // Only OrganizationV2
  userRoles: string[];
  handleFilterChange: (field: string, value: string | number) => void;
  handleClearFilters: () => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  filters,
  organizations,
  handleFilterChange,
  handleClearFilters,
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
      handleFilterChange('search', searchValue);
    }, 500)
  );

  // Update the debounced function when filters or handleFilterChange changes
  useEffect(() => {
    debouncedSearchRef.current = debounce((searchValue: string) => {
      handleFilterChange('search', searchValue);
    }, 500);
  }, [filters, handleFilterChange]);

  // Handle search input change
  const handleSearchChange = useCallback((value: string) => {
    setLocalSearch(value);
    debouncedSearchRef.current(value);
  }, []);

  // Handle clear filters
  const handleClearFiltersLocal = useCallback(() => {
    setLocalSearch('');
    handleClearFilters();
  }, [handleClearFilters]);

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
            onClick={handleClearFiltersLocal}
            data-testid={TestIds.filterForm.clearButton}
          >
            Clear
          </Button>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <OrganizationsDropdown
              value={filters.organization_id || 0}
              onChange={value => handleFilterChange('organization_id', value)}
              label="Organization"
              testIdPrefix="filter-form-organization"
              showAllOption={true}
              allOptionText="All Organizations"
              margin="none"
              organizations={organizations as any}
              fetchFromApi={false}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={e =>
                  handleFilterChange('status', e.target.value as string)
                }
                label="Status"
                data-testid={TestIds.filterForm.status}
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
                <MenuItem
                  value="invited"
                  data-testid={TestIds.filterForm.statusOption('invited')}
                >
                  Invited
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Search"
              value={localSearch}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search users by email or name..."
              inputRef={searchInputRef}
              data-testid={TestIds.filterForm.search}
              inputProps={{
                'data-testid': TestIds.filterForm.search,
                'aria-label': 'Search users input',
              }}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

// ────────────────────────────────────────
// Users Table Component
// ────────────────────────────────────────

interface UsersTableProps {
  users: User[];
  organizations: OrganizationV2[]; // Only OrganizationV2
  domains: Record<string, Domain[]>;
  loading: boolean;
  error: string;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  handlePageChange: (event: unknown, newPage: number) => void;
  handlePageSizeChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleDeleteUser: (id: number) => void;
  setSelectedUser: (user: User) => void;
  setCreateDialogOpen: (open: boolean) => void;
  setEditMode: (edit: boolean) => void;
}

const UsersTable: React.FC<UsersTableProps> = ({
  users,
  organizations,
  domains,
  loading,
  error,
  pagination,
  handlePageChange,
  handlePageSizeChange,
  handleDeleteUser,
  setSelectedUser,
  setCreateDialogOpen,
  setEditMode,
}) => {
  return (
    <Card data-testid={TestIds.users.table}>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h6">Users ({pagination.total})</Typography>
          <Box>
            <Button
              {...getButtonProps('create')}
              onClick={() => setCreateDialogOpen(true)}
              data-testid={TestIds.users.createButton}
            >
              Create User
            </Button>
          </Box>
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
                    <TableCell>Email</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Organization</TableCell>
                    <TableCell>Domain</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {user.first_name} {user.last_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {organizations.find(
                          org => org.id === user.organization_id // Direct number comparison
                        )
                          ? organizations.find(
                              org => org.id === user.organization_id
                            )!.name
                          : 'Unknown'}
                      </TableCell>
                      <TableCell>{getDomainName(user, domains)}</TableCell>
                      <TableCell>
                        <Chip
                          label={getRoleDisplayName(user.role)}
                          color={getRoleColor(user.role)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.status}
                          style={{
                            backgroundColor: getStatusBackgroundColor(
                              user.status
                            ),
                            color: '#ffffff',
                          }}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedUser(user);
                              setEditMode(false);
                            }}
                            data-testid={TestIds.users.viewDetails(user.id)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedUser(user);
                              setEditMode(true);
                            }}
                            data-testid={TestIds.users.edit(user.id)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteUser(user.id)}
                            data-testid={TestIds.users.deactivate(user.id)}
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
};

// ────────────────────────────────────────
// Create User Dialog Component
// ────────────────────────────────────────

interface CreateUserDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserRequest) => Promise<void>;
  organizations: OrganizationV2[];
  domains: Record<string, Domain[]>; // Add this prop
}

const CreateUserDialog: React.FC<CreateUserDialogProps> = ({
  open,
  onClose,
  onSubmit,
  organizations,
  domains, // Add this prop
}) => {
  const [formData, setFormData] = useState<CreateUserRequest>({
    organization_id: 0,
    domain_id: 0,
    email: '',
    first_name: '',
    last_name: '',
    role: 'tenant_admin',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [availableDomains, setAvailableDomains] = useState<Domain[]>([]); // Rename to match EditUserDialog
  const [domainsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update available domains when organization changes - use pre-fetched data
  useEffect(() => {
    if (formData.organization_id) {
      const orgDomains = domains[formData.organization_id] || [];
      setAvailableDomains(orgDomains);

      // Only set default domain if no domain is currently selected
      if (!formData.domain_id) {
        // Find the primary domain and set it as default
        const primaryDomain = orgDomains.find(domain => domain.is_primary);
        if (primaryDomain) {
          setFormData(prev => ({
            ...prev,
            domain_id: Number(primaryDomain.id),
          }));
        } else if (orgDomains.length > 0) {
          // If no primary domain found, select the first domain
          setFormData(prev => ({
            ...prev,
            domain_id: Number(orgDomains[0]?.id || 0),
          }));
        } else {
          // No domains available
          setFormData(prev => ({ ...prev, domain_id: 0 }));
        }
      }
    } else {
      setAvailableDomains([]);
      setFormData(prev => ({ ...prev, domain_id: 0 }));
    }
  }, [formData.organization_id, domains]);

  // Remove the fetchDomains function - no longer needed

  const handleSubmit = async (): Promise<void> => {
    // Clear previous errors
    setErrors({});

    // Validate required fields
    const newErrors: Record<string, string> = {};

    if (!formData.organization_id) {
      newErrors.organization_id = 'Organization is required';
    }

    if (!formData.domain_id) {
      newErrors.domain_id = 'Domain is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      // Convert data for API - API expects integer organization_id and display name for role
      const apiData = {
        organization_id: formData.organization_id,
        domain_id: formData.domain_id,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
      };

      await onSubmit(apiData as unknown as CreateUserRequest);
      setFormData({
        organization_id: 0,
        domain_id: 0,
        email: '',
        first_name: '',
        last_name: '',
        role: 'tenant_admin',
      });
      setErrors({});
    } catch (error) {
      console.error('Error in create dialog:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      organization_id: 0,
      domain_id: 0,
      email: '',
      first_name: '',
      last_name: '',
      role: 'tenant_admin',
    });
    setErrors({});
    setAvailableDomains([]); // Clear available domains on close
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      data-testid={TestIds.users.createDialog.container}
    >
      <DialogTitle data-testid={TestIds.users.createDialog.title}>
        Create New User
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <FormControl
            fullWidth
            margin="normal"
            required
            error={!!errors.organization_id}
          >
            <OrganizationsDropdown
              value={formData.organization_id}
              onChange={value =>
                setFormData({ ...formData, organization_id: Number(value) })
              }
              label="Organization"
              required={true}
              testIdPrefix="users-create-organization"
              showAllOption={false}
              organizations={organizations as any}
              fetchFromApi={false}
              margin="none"
            />
            {errors.organization_id && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                {errors.organization_id}
              </Typography>
            )}
          </FormControl>

          <FormControl
            fullWidth
            margin="normal"
            required
            error={!!errors.domain_id}
          >
            <InputLabel>Domain</InputLabel>
            <Select
              value={
                domainsLoading
                  ? ''
                  : availableDomains.length > 0
                    ? String(formData.domain_id || '')
                    : ''
              }
              onChange={e =>
                setFormData({
                  ...formData,
                  domain_id: Number(e.target.value),
                })
              }
              label="Domain"
              disabled={!formData.organization_id || domainsLoading}
              data-testid={TestIds.users.createDialog.domain}
              inputProps={{
                'aria-label': 'Domain selection',
              }}
            >
              {domainsLoading ? (
                <MenuItem disabled>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} />
                    Loading domains...
                  </Box>
                </MenuItem>
              ) : availableDomains.length === 0 ? (
                <MenuItem disabled>No domains available</MenuItem>
              ) : (
                availableDomains.map(domain => (
                  <MenuItem
                    key={domain.id}
                    value={domain.id}
                    data-testid={TestIds.users.createDialog.domainOption(
                      domain.id
                    )}
                  >
                    {(() => {
                      let domainName = '';
                      if (
                        domain.domain_name &&
                        typeof domain.domain_name === 'string'
                      ) {
                        domainName = domain.domain_name;
                      } else if (
                        domain.name &&
                        typeof domain.name === 'string'
                      ) {
                        domainName = domain.name;
                      }
                      const cleanDomainName = domainName.trim();

                      return (
                        <>
                          {cleanDomainName || 'Unknown Domain'}
                          {(domain.is_primary && ' (Primary)') || ''}
                        </>
                      );
                    })()}
                  </MenuItem>
                ))
              )}
            </Select>
            {errors.domain_id && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                {errors.domain_id}
              </Typography>
            )}
          </FormControl>

          <TextField
            fullWidth
            margin="normal"
            label="Email"
            type="email"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            required
            error={!!errors.email}
            helperText={errors.email}
            data-testid={TestIds.users.createDialog.email}
            inputProps={{
              'data-testid': TestIds.users.createDialog.email,
              'aria-label': 'User email input',
            }}
          />

          <TextField
            fullWidth
            margin="normal"
            label="First Name"
            value={formData.first_name}
            onChange={e =>
              setFormData({ ...formData, first_name: e.target.value })
            }
            data-testid={TestIds.users.createDialog.firstName}
            inputProps={{
              'data-testid': TestIds.users.createDialog.firstName,
              'aria-label': 'User first name input',
            }}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Last Name"
            value={formData.last_name}
            onChange={e =>
              setFormData({ ...formData, last_name: e.target.value })
            }
            data-testid={TestIds.users.createDialog.lastName}
            inputProps={{
              'data-testid': TestIds.users.createDialog.lastName,
              'aria-label': 'User last name input',
            }}
          />

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Role</InputLabel>
            <Select
              value={formData.role}
              onChange={e =>
                setFormData({
                  ...formData,
                  role: e.target.value as 'super_admin' | 'tenant_admin',
                })
              }
              label="Role"
              data-testid={TestIds.users.createDialog.role}
              inputProps={{
                'aria-label': 'Role selection',
              }}
            >
              {availableRoles.map(role => (
                <MenuItem
                  key={role}
                  value={role}
                  data-testid={TestIds.users.createDialog.roleOption(role)}
                >
                  {getRoleDisplayName(role)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          disabled={loading}
          data-testid={TestIds.users.createDialog.cancel}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          data-testid={TestIds.users.createDialog.submit}
        >
          {loading ? <CircularProgress size={20} /> : 'Create User'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ────────────────────────────────────────
// View User Dialog Component
// ────────────────────────────────────────

interface ViewUserDialogProps {
  user: User;
  onClose: () => void;
  onUpdate: () => void;
  organizations: OrganizationV2[]; // Only OrganizationV2
  domains: Record<string, Domain[]>;
  setEditMode: (edit: boolean) => void;
}

const ViewUserDialog: React.FC<ViewUserDialogProps> = ({
  user,
  onClose,
  // onUpdate,
  organizations,
  domains,
  setEditMode,
}) => {
  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      data-testid={TestIds.users.viewDialog.container}
    >
      <DialogTitle data-testid={TestIds.users.viewDialog.title}>
        User Details: {user?.first_name} {user?.last_name}
      </DialogTitle>
      <DialogContent>
        {user && (
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {user.email}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  First Name
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {user.first_name || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Last Name
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {user.last_name || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Organization
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {organizations.find(
                    org => org.id === user.organization_id // Direct number comparison
                  )
                    ? organizations.find(
                        org => org.id === user.organization_id
                      )!.name
                    : 'Unknown'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Domain
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {getDomainName(user, domains)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Role
                </Typography>
                <Chip
                  label={getRoleDisplayName(user.role)}
                  color={getRoleColor(user.role)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label={user.status}
                  style={{
                    backgroundColor: getStatusBackgroundColor(user.status),
                    color: '#ffffff',
                  }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Created At
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {new Date(user.created_at).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Updated At
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {new Date(user.updated_at).toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            // Set edit mode to true to switch to edit dialog
            setEditMode(true);
          }}
          data-testid={TestIds.users.viewDialog.editButton}
        >
          Edit
        </Button>
        <Button
          onClick={onClose}
          data-testid={TestIds.users.viewDialog.closeButton}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ────────────────────────────────────────
// Edit User Dialog Component
// ────────────────────────────────────────

interface EditUserDialogProps {
  user: User;
  onClose: () => void;
  onSubmit: (data: UpdateUserRequest) => Promise<void>;
  organizations: OrganizationV2[]; // Only OrganizationV2
  domains: Record<string, Domain[]>;
  userRoles: string[];
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({
  user,
  onClose,
  onSubmit,
  organizations,
  domains,
}) => {
  const [formData, setFormData] = useState<UpdateUserRequest>({
    organization_id: user.organization_id || 0,
    email: user.email,
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    role: user.role,
    status: user.status,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [availableDomains, setAvailableDomains] = useState<Domain[]>([]);

  // Find the domain assigned to this user from the domains API response
  const findUserAssignedDomain = (): number | null => {
    // Flatten all domains from all organizations
    const allDomains = Object.values(domains).flat();

    // Find domain where user_id matches the current user's ID
    const assignedDomain = allDomains.find(
      domain => domain.user_id === user.id
    );

    return assignedDomain ? Number(assignedDomain.id) : null;
  };

  const [selectedDomainId, setSelectedDomainId] = useState<number | null>(
    findUserAssignedDomain()
  );

  // Update available domains when organization changes
  useEffect(() => {
    if (formData.organization_id) {
      const orgDomains = domains[formData.organization_id] || [];
      setAvailableDomains(orgDomains);

      // If no domain is currently selected, try to find user's assigned domain in this organization
      if (!selectedDomainId) {
        const userAssignedDomain = orgDomains.find(
          domain => domain.user_id === user.id
        );
        if (userAssignedDomain) {
          setSelectedDomainId(Number(userAssignedDomain.id));
        }
      }
    } else {
      setAvailableDomains([]);
    }
  }, [formData.organization_id, domains, user.id, selectedDomainId]);

  const handleSubmit = async (): Promise<void> => {
    if (!formData.email?.trim() || !formData.organization_id) {
      alert('Please fill in all required fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email!)) {
      alert('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      // Convert data for API - API expects integer organization_id
      const apiData = {
        organization_id: formData.organization_id,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
        status: formData.status,
      };

      await onSubmit(apiData as unknown as UpdateUserRequest);
    } catch (error) {
      console.error('Error in edit dialog:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      data-testid={TestIds.users.editDialog.container}
    >
      <DialogTitle data-testid={TestIds.users.editDialog.title}>
        Edit User
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Organization</InputLabel>
            <Select
              value={formData.organization_id || ''}
              onChange={e =>
                setFormData({
                  ...formData,
                  organization_id: Number(e.target.value) || 0,
                })
              }
              label="Organization"
              data-testid={TestIds.users.editDialog.organization}
              inputProps={{
                'data-testid': TestIds.users.editDialog.organization,
                'aria-label': 'Organization selection',
              }}
            >
              {organizations.map(org => (
                <MenuItem
                  key={org.id}
                  value={org.id}
                  data-testid={TestIds.users.editDialog.organizationOption(
                    org.id
                  )}
                >
                  {org.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Domain</InputLabel>
            <Select
              value={selectedDomainId ? String(selectedDomainId) : ''}
              onChange={e => {
                const newDomainId = Number(e.target.value);
                setSelectedDomainId(newDomainId);
              }}
              label="Domain"
              disabled={availableDomains.length === 0}
              data-testid={TestIds.users.editDialog.domain}
              inputProps={{
                'data-testid': TestIds.users.editDialog.domain,
                'aria-label': 'Domain selection',
              }}
            >
              {availableDomains.map(domain => (
                <MenuItem key={domain.id} value={String(domain.id)}>
                  {(() => {
                    // Get the domain name from either domain_name or name field
                    let domainName = '';
                    if (
                      domain.domain_name &&
                      typeof domain.domain_name === 'string'
                    ) {
                      domainName = domain.domain_name;
                    } else if (domain.name && typeof domain.name === 'string') {
                      domainName = domain.name;
                    }

                    // Simple domain name cleaning - just trim whitespace
                    const cleanDomainName = domainName.trim();

                    return (
                      <>
                        {cleanDomainName || 'Unknown Domain'}
                        {(domain.is_primary && ' (Primary)') || ''}
                      </>
                    );
                  })()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            margin="normal"
            required
            data-testid={TestIds.users.editDialog.email}
            inputProps={{
              'data-testid': TestIds.users.editDialog.email,
              'aria-label': 'User email input',
            }}
          />
          <TextField
            fullWidth
            label="First Name"
            value={formData.first_name}
            onChange={e =>
              setFormData({ ...formData, first_name: e.target.value })
            }
            margin="normal"
            data-testid={TestIds.users.editDialog.firstName}
            inputProps={{
              'data-testid': TestIds.users.editDialog.firstName,
              'aria-label': 'User first name input',
            }}
          />
          <TextField
            fullWidth
            label="Last Name"
            value={formData.last_name}
            onChange={e =>
              setFormData({ ...formData, last_name: e.target.value })
            }
            margin="normal"
            data-testid={TestIds.users.editDialog.lastName}
            inputProps={{
              'data-testid': TestIds.users.editDialog.lastName,
              'aria-label': 'User last name input',
            }}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select
              value={formData.role || ''}
              onChange={e =>
                setFormData({
                  ...formData,
                  role: e.target.value as 'super_admin' | 'tenant_admin',
                })
              }
              label="Role"
              data-testid={TestIds.users.editDialog.role}
              inputProps={{
                'data-testid': TestIds.users.editDialog.role,
                'aria-label': 'Role selection',
              }}
            >
              {availableRoles.map(role => (
                <MenuItem
                  key={role}
                  value={role}
                  data-testid={TestIds.users.editDialog.roleOption(role)}
                >
                  {getRoleDisplayName(role)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              value={formData.status || ''}
              onChange={e =>
                setFormData({
                  ...formData,
                  status: e.target.value as
                    | 'Active'
                    | 'Inactive'
                    | 'Pending'
                    | 'Invited',
                })
              }
              label="Status"
              data-testid={TestIds.users.editDialog.status}
              inputProps={{
                'data-testid': TestIds.users.editDialog.status,
                'aria-label': 'Status selection',
              }}
            >
              <MenuItem
                value="active"
                data-testid={TestIds.users.editDialog.statusOption('active')}
              >
                Active
              </MenuItem>
              <MenuItem
                value="inactive"
                data-testid={TestIds.users.editDialog.statusOption('inactive')}
              >
                Inactive
              </MenuItem>
              <MenuItem
                value="invited"
                data-testid={TestIds.users.editDialog.statusOption('invited')}
              >
                Invited
              </MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} data-testid={TestIds.users.editDialog.cancel}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          data-testid={TestIds.users.editDialog.submit}
        >
          {loading ? 'Updating...' : 'Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

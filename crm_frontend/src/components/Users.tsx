/**
 * ──────────────────────────────────────────────────
 * File: client/src/components/Users.tsx
 * Description: Users management page for TondroAI CRM
 * Author: Muhammad Abubakar Khan
 * Created: 18-06-2025
 * Last Updated: 26-06-2025
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
  type Organization,
  type CreateUserRequest,
  type UpdateUserRequest,
  type SnackbarState,
  type Domain
} from '../types';
import { getStatusBackgroundColor } from '../theme';
import { TestIds } from '../testIds';
import { getButtonProps } from '../utils/buttonStyles';
import { useUserRoles } from '../contexts/UserRolesContext';
import { debounce } from 'lodash';

// ────────────────────────────────────────
// Helper Functions
// ────────────────────────────────────────

const getRoleColor = (
  role: string
): 'error' | 'warning' | 'info' | 'default' => {
  switch (role) {
    case 'Super Admin':
      return 'error';
    case 'Tenant Admin':
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
    default:
      return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
};

// const getRoleInternalValue = (displayName: string): string => {
//   switch (displayName) {
//     case 'Super Admin':
//       return 'super_admin';
//     case 'Tenant Admin':
//       return 'tenant_admin';
//     default:
//       return displayName.toLowerCase().replace(' ', '_');
//   }
// };

const convertOrgIdToString = (orgId: string | number): string => {
  if (typeof orgId === 'string') {
    return orgId.startsWith('org_') ? orgId : `org_${orgId.padStart(6, '0')}`;
  }
  return `org_${orgId.toString().padStart(6, '0')}`;
};

const convertOrgIdToInteger = (orgId: string): number => {
  if (orgId.startsWith('org_')) {
    return parseInt(orgId.replace('org_', ''), 10);
  }
  return parseInt(orgId, 10);
};

const getDomainName = (user: User, domains: Record<string, Domain[]>): string => {
  if (!user.domain_id) return 'N/A';
  
  const orgId = convertOrgIdToString(user.organization_id);
  const orgDomains = domains[orgId] || [];
  
  const domain = orgDomains.find(d => Number(d.id) === user.domain_id);
  
  return domain ? domain.domain_name : 'Unknown';
};

// Get available roles that match the expected role values
const availableRoles = ['super_admin', 'tenant_admin'];

// ────────────────────────────────────────
// Main Component
// ────────────────────────────────────────

const Users: React.FC = () => {
  const { userRoles } = useUserRoles();
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [domains, setDomains] = useState<Record<string, Domain[]>>({}); // Store domains by organization ID
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [filters, setFilters] = useState({
    organization_id: '',
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

  // This runs only once when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      const token = localStorage.getItem('jwt_token');
      if (token) {
        fetchUsers();
        fetchOrganizations(); // Only called once
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

  // This runs only when filters/pagination change
  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      fetchUsers(); // Only fetch users, not organizations
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
      const token = localStorage.getItem('jwt_token');
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
        if (apiParams[key as keyof typeof apiParams] === '') delete apiParams[key as keyof typeof apiParams];
      });
      
      // Convert parameters for API compatibility
      const finalApiParams = {
        ...apiParams,
        ...(apiParams.organization_id && { organization_id: convertOrgIdToInteger(apiParams.organization_id) }),
        ...(apiParams.status && { status: apiParams.status.toLowerCase() })
      } as any;
      
      // Try API filtering first, then fallback to frontend filtering
      try {
        const response = await apiHelpers.getUsers(finalApiParams, controller.signal);
        const usersData = response.data.items || response.data || [];
        setUsers(usersData);
        setPagination(prev => ({
          ...prev,
          total: response.data.total || (response.data.items ? response.data.items.length : 0)
        }));
      } catch (error: any) {
        // If API filtering fails, fall back to frontend filtering
        if (error.response?.status === 500 || error.response?.status === 400) {
          console.log('API filtering failed, falling back to frontend filtering...');
          
          // Remove all filters and fetch all users
          const { status, role, organization_id, search, ...paramsWithoutFilters } = apiParams;
          const response = await apiHelpers.getUsers(paramsWithoutFilters, controller.signal);
          const allUsers = response.data.items || response.data || [];
          
          // Apply filters on the frontend
          let filteredUsers = allUsers;
          
          // Apply status filter
          if (status) {
            filteredUsers = filteredUsers.filter(user => 
              user.status.toLowerCase() === status.toLowerCase()
            );
          }
          
          // Apply role filter
          if (role) {
            filteredUsers = filteredUsers.filter(user => 
              user.role.toLowerCase() === role.toLowerCase()
            );
          }
          
          // Apply organization filter
          if (organization_id) {
            filteredUsers = filteredUsers.filter(user => 
              convertOrgIdToString(user.organization_id) === convertOrgIdToString(organization_id)
            );
          }
          
          // Apply search filter
          if (search) {
            const searchLower = search.toLowerCase();
            filteredUsers = filteredUsers.filter(user => 
              user.email.toLowerCase().includes(searchLower) ||
              user.first_name.toLowerCase().includes(searchLower) ||
              user.last_name.toLowerCase().includes(searchLower)
            );
          }
          
          setUsers(filteredUsers);
          setPagination(prev => ({
            ...prev,
            total: filteredUsers.length
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
      const orgs = response.data.organizations || [];
      
      // Remove duplicate organizations based on organizationId
      const uniqueOrgs = orgs.filter((org, index, self) => 
        index === self.findIndex(o => o.organizationId === org.organizationId)
      );
      
      setOrganizations(uniqueOrgs);
      
      // Fetch domains for each organization
      const domainsData: Record<string, Domain[]> = {};
      for (const org of uniqueOrgs) {
        try {
          const domainsResponse = await apiHelpers.getUserDomains(org.organizationId);
          domainsData[org.organizationId] = domainsResponse.data.domains || [];
        } catch (error) {
          console.error(`Error fetching domains for organization ${org.organizationId}:`, error);
          domainsData[org.organizationId] = [];
        }
      }
      setDomains(domainsData);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const handleCreateUser = async (
    formData: CreateUserRequest
  ): Promise<void> => {
    try {
      await apiHelpers.createUser(formData);
      setSnackbar({
        open: true,
        message: 'User created successfully',
        severity: 'success',
      });
      setCreateDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      setSnackbar({
        open: true,
        message: 'Failed to create user',
        severity: 'error',
      });
    }
  };

  const handleDeleteUser = async (
    id: string,
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

  const handleFilterChange = (field: string, value: string): void => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPagination((prev) => ({ ...prev, page: 0 }));
  };

  const handlePageChange = (_event: unknown, newPage: number): void => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setPagination((prev) => ({
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
      await apiHelpers.updateUser(selectedUser.id, formData);
      setSnackbar({
        open: true,
        message: 'User updated successfully',
        severity: 'success',
      });
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update user',
        severity: 'error',
      });
    }
  };

  const handleClearFilters = () => {
    setFilters({
      organization_id: '',
      role: '',
      status: '',
      search: '',
    });
    setPagination((prev) => ({ ...prev, page: 0 }));
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
      />

      <CreateUserDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateUser}
        organizations={organizations}
        userRoles={userRoles}
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
    organization_id: string;
    role: string;
    status: string;
    search: string;
  };
  organizations: Organization[];
  userRoles: string[];
  handleFilterChange: (field: string, value: string) => void;
  handleClearFilters: () => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({ filters, organizations, userRoles, handleFilterChange, handleClearFilters }) => {
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
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Button variant="outlined" color="secondary" onClick={handleClearFiltersLocal} data-testid={TestIds.filterForm.clearButton}>
            Clear
          </Button>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Organization</InputLabel>
              <Select
                value={filters.organization_id}
                onChange={e => handleFilterChange('organization_id', e.target.value)}
                label="Organization"
                data-testid={TestIds.filterForm.organization}
                inputProps={{
                  'data-testid': TestIds.filterForm.organization,
                  'aria-label': 'Organization filter'
                }}
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
              <InputLabel>Role</InputLabel>
              <Select
                value={filters.role}
                onChange={e => handleFilterChange('role', e.target.value as string)}
                label="Role"
                data-testid={TestIds.filterForm.role}
                inputProps={{
                  'data-testid': TestIds.filterForm.role,
                  'aria-label': 'Role filter'
                }}
              >
                <MenuItem value="">All</MenuItem>
                {userRoles.map((role) => (
                  <MenuItem key={role} value={role}>
                    {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                onChange={e => handleFilterChange('status', e.target.value as string)}
                label="Status"
                data-testid={TestIds.filterForm.status}
                inputProps={{
                  'data-testid': TestIds.filterForm.status,
                  'aria-label': 'Status filter'
                }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="invited">Invited</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
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
                'aria-label': 'Search users input'
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
  organizations: Organization[];
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
  handleDeleteUser: (id: string) => void;
  setSelectedUser: (user: User) => void;
  setCreateDialogOpen: (open: boolean) => void;
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
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {user.first_name} {user.last_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {organizations.find(org => org.organizationId === convertOrgIdToString(user.organization_id))?.tenantName || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {getDomainName(user, domains)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.role}
                          color={getRoleColor(user.role)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.status}
                          style={{
                            backgroundColor: getStatusBackgroundColor(user.status),
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
                            }}
                            data-testid={TestIds.users.viewDetails(user.id)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedUser(user);
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
  organizations: Organization[];
  userRoles: string[];
}

const CreateUserDialog: React.FC<CreateUserDialogProps> = ({
  open,
  onClose,
  onSubmit,
  organizations,
  // userRoles,
}) => {
  const [formData, setFormData] = useState<CreateUserRequest>({
    organization_id: '',
    domain_id: 0,
    email: '',
    first_name: '',
    last_name: '',
    role: 'tenant_admin'
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [domainsLoading, setDomainsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch domains when organization changes
  useEffect(() => {
    if (formData.organization_id) {
      fetchDomains(formData.organization_id);
    } else {
      setDomains([]);
      setFormData(prev => ({ ...prev, domain_id: 0 }));
    }
  }, [formData.organization_id]);

  const fetchDomains = async (organizationId: string) => {
    setDomainsLoading(true);
    try {
      const response = await apiHelpers.getUserDomains(organizationId);
      const domainsData = response.data.domains || [];
      console.log('Fetched domains data:', domainsData);
      setDomains(domainsData);
      
      // Find the primary domain and set it as default
      const primaryDomain = domainsData.find(domain => domain.is_primary);
      if (primaryDomain) {
        setFormData(prev => ({ ...prev, domain_id: Number(primaryDomain.id) }));
      } else if (domainsData.length > 0) {
        // If no primary domain found, select the first domain
        setFormData(prev => ({ ...prev, domain_id: Number(domainsData[0].id) }));
      } else {
        // No domains available
        setFormData(prev => ({ ...prev, domain_id: 0 }));
      }
    } catch (error) {
      console.error('Error fetching domains:', error);
      setErrors(prev => ({ ...prev, domains: 'Failed to load domains' }));
      setDomains([]);
      setFormData(prev => ({ ...prev, domain_id: 0 }));
    } finally {
      setDomainsLoading(false);
    }
  };

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
        organization_id: convertOrgIdToInteger(formData.organization_id).toString(),
        domain_id: formData.domain_id,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role ? getRoleDisplayName(formData.role) : undefined // Convert internal value to display name
      };
      
      await onSubmit(apiData as unknown as CreateUserRequest);
      setFormData({
        organization_id: '',
        domain_id: 0,
        email: '',
        first_name: '',
        last_name: '',
        role: 'tenant_admin'
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
      organization_id: '',
      domain_id: 0,
      email: '',
      first_name: '',
      last_name: '',
      role: 'tenant_admin'
    });
    setErrors({});
    setDomains([]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth data-testid={TestIds.users.createDialog.container}>
      <DialogTitle data-testid={TestIds.users.createDialog.title}>Create New User</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <FormControl fullWidth margin="normal" required error={!!errors.organization_id}>
            <InputLabel>Organization</InputLabel>
            <Select
              value={formData.organization_id}
              onChange={(e) =>
                setFormData({ ...formData, organization_id: e.target.value })
              }
              label="Organization"
              data-testid={TestIds.users.createDialog.organization}
              inputProps={{
                'data-testid': TestIds.users.createDialog.organization,
                'aria-label': 'Organization selection'
              }}
            >
              {organizations.map((org) => (
                <MenuItem key={org.organizationId} value={org.organizationId}>
                  {org.tenantName}
                </MenuItem>
              ))}
            </Select>
            {errors.organization_id && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                {errors.organization_id}
              </Typography>
            )}
          </FormControl>

          <FormControl fullWidth margin="normal" required error={!!errors.domain_id}>
            <InputLabel>Domain</InputLabel>
            <Select
              value={domainsLoading ? '' : (domains.length > 0 ? formData.domain_id : '')}
              onChange={(e) => setFormData({ ...formData, domain_id: e.target.value as number })}
              label="Domain"
              disabled={!formData.organization_id || domainsLoading}
              data-testid={TestIds.users.createDialog.domain}
              inputProps={{
                'data-testid': TestIds.users.createDialog.domain,
                'aria-label': 'Domain selection'
              }}
            >
              {domainsLoading ? (
                <MenuItem disabled>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} />
                    Loading domains...
                  </Box>
                </MenuItem>
              ) : domains.length === 0 ? (
                <MenuItem disabled>No domains available</MenuItem>
              ) : (
                domains.map((domain) => (
                  <MenuItem key={domain.id} value={domain.id}>
                    {(() => {
                      // Get the domain name from either domain_name or name field
                      
                      let domainName = '';
                      if (domain.domain_name && typeof domain.domain_name === 'string') {
                        domainName = domain.domain_name;
                      } else if (domain.name && typeof domain.name === 'string') {
                        domainName = domain.name;
                      }
                      // log the domain name
                      console.log('Domain name:', domainName);
                      // Simple domain name cleaning - just trim whitespace
                      const cleanDomainName = domainName.trim();
                      
                      return (
                        <>
                          {cleanDomainName || 'Unknown Domain'}
                          {domain.is_primary && ' (Primary)' || ''}
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
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            error={!!errors.email}
            helperText={errors.email}
            data-testid={TestIds.users.createDialog.email}
            inputProps={{
              'data-testid': TestIds.users.createDialog.email,
              'aria-label': 'User email input'
            }}
          />

          <TextField
            fullWidth
            margin="normal"
            label="First Name"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            data-testid={TestIds.users.createDialog.firstName}
            inputProps={{
              'data-testid': TestIds.users.createDialog.firstName,
              'aria-label': 'User first name input'
            }}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Last Name"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            data-testid={TestIds.users.createDialog.lastName}
            inputProps={{
              'data-testid': TestIds.users.createDialog.lastName,
              'aria-label': 'User last name input'
            }}
          />

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Role</InputLabel>
            <Select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' | 'viewer' | 'tenant_admin' | 'tenant_support' | 'tenant_user' })}
              label="Role"
              data-testid={TestIds.users.createDialog.role}
              inputProps={{
                'data-testid': TestIds.users.createDialog.role,
                'aria-label': 'Role selection'
              }}
            >
              {availableRoles.map((role) => (
                <MenuItem key={role} value={role}>
                  {getRoleDisplayName(role)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading} data-testid={TestIds.users.createDialog.cancel}>
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
  organizations: Organization[];
  domains: Record<string, Domain[]>;
  setEditMode: (edit: boolean) => void;
}

const ViewUserDialog: React.FC<ViewUserDialogProps> = ({ 
  user, 
  onClose, 
  // onUpdate, 
  organizations,
  domains,
  setEditMode
}) => {
  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth data-testid={TestIds.users.viewDialog.container}>
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
                  {organizations.find(org => org.organizationId === convertOrgIdToString(user.organization_id))?.tenantName || 'Unknown'}
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
                  label={user.role}
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
        <Button onClick={() => {
          // Set edit mode to true to switch to edit dialog
          setEditMode(true);
        }} data-testid={TestIds.users.viewDialog.editButton}>Edit</Button>
        <Button onClick={onClose} data-testid={TestIds.users.viewDialog.closeButton}>Close</Button>
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
  organizations: Organization[];
  domains: Record<string, Domain[]>;
  userRoles: string[];
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({
  user,
  onClose,
  onSubmit,
  organizations,
  domains,
  userRoles
}) => {
  const [formData, setFormData] = useState<UpdateUserRequest>({
    organization_id: convertOrgIdToString(user.organization_id), // Convert to string format for dropdown
    email: user.email,
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    role: user.role, // Use the original role value directly
    status: user.status // Add status to form data
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [availableDomains, setAvailableDomains] = useState<Domain[]>([]);

  // Update available domains when organization changes
  useEffect(() => {
    if (formData.organization_id) {
      const orgDomains = domains[formData.organization_id] || [];
      setAvailableDomains(orgDomains);
    } else {
      setAvailableDomains([]);
    }
  }, [formData.organization_id, domains]);

  // Find the current user's domain in available domains
  const currentDomain = availableDomains.find(d => Number(d.id) === user.domain_id);

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
        organization_id: convertOrgIdToInteger(formData.organization_id || '').toString(),
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
        status: formData.status
      };
      
      await onSubmit(apiData as unknown as UpdateUserRequest);
    } catch (error) {
      console.error('Error in edit dialog:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth data-testid={TestIds.users.editDialog.container}>
      <DialogTitle data-testid={TestIds.users.editDialog.title}>Edit User</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Organization</InputLabel>
            <Select
              value={formData.organization_id}
              onChange={(e) =>
                setFormData({ ...formData, organization_id: e.target.value })
              }
              label="Organization"
              data-testid={TestIds.users.editDialog.organization}
              inputProps={{
                'data-testid': TestIds.users.editDialog.organization,
                'aria-label': 'Organization selection'
              }}
            >
              {organizations.map((org) => (
                <MenuItem key={org.organizationId} value={org.organizationId}>
                  {org.tenantName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Domain</InputLabel>
            <Select
              value={currentDomain ? String(currentDomain.id) : ''}
              onChange={(e) => {
                // Note: domain_id is not part of UpdateUserRequest, so this is for display only
                console.log('Domain selected:', e.target.value);
              }}
              label="Domain"
              disabled={availableDomains.length === 0}
              data-testid={TestIds.users.editDialog.domain}
              inputProps={{
                'data-testid': TestIds.users.editDialog.domain,
                'aria-label': 'Domain selection'
              }}
            >
              {availableDomains.map((domain) => (
                <MenuItem key={domain.id} value={String(domain.id)}>
                  {(() => {
                    // Get the domain name from either domain_name or name field
                    let domainName = '';
                    if (domain.domain_name && typeof domain.domain_name === 'string') {
                      domainName = domain.domain_name;
                    } else if (domain.name && typeof domain.name === 'string') {
                      domainName = domain.name;
                    }
                    
                    // Simple domain name cleaning - just trim whitespace
                    const cleanDomainName = domainName.trim();
                    
                    return (
                      <>
                        {cleanDomainName || 'Unknown Domain'}
                        {domain.is_primary && ' (Primary)' || ""}
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
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            margin="normal"
            required
            data-testid={TestIds.users.editDialog.email}
            inputProps={{
              'data-testid': TestIds.users.editDialog.email,
              'aria-label': 'User email input'
            }}
          />
          <TextField
            fullWidth
            label="First Name"
            value={formData.first_name}
            onChange={(e) =>
              setFormData({ ...formData, first_name: e.target.value })
            }
            margin="normal"
            data-testid={TestIds.users.editDialog.firstName}
            inputProps={{
              'data-testid': TestIds.users.editDialog.firstName,
              'aria-label': 'User first name input'
            }}
          />
          <TextField
            fullWidth
            label="Last Name"
            value={formData.last_name}
            onChange={(e) =>
              setFormData({ ...formData, last_name: e.target.value })
            }
            margin="normal"
            data-testid={TestIds.users.editDialog.lastName}
            inputProps={{
              'data-testid': TestIds.users.editDialog.lastName,
              'aria-label': 'User last name input'
            }}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select
              value={formData.role || ''}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' | 'viewer' | 'tenant_admin' | 'tenant_support' | 'tenant_user' })}
              label="Role"
              data-testid={TestIds.users.editDialog.role}
              inputProps={{
                'data-testid': TestIds.users.editDialog.role,
                'aria-label': 'Role selection'
              }}
            >
              {userRoles.map((role) => (
                <MenuItem key={role} value={role}>
                  {getRoleDisplayName(role)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              value={formData.status || ''}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Inactive' | 'Pending' | 'Invited' })}
              label="Status"
              data-testid={TestIds.users.editDialog.status}
              inputProps={{
                'data-testid': TestIds.users.editDialog.status,
                'aria-label': 'Status selection'
              }}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>              
              <MenuItem value="invited">Invited</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} data-testid={TestIds.users.editDialog.cancel}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading} data-testid={TestIds.users.editDialog.submit}>
          {loading ? 'Updating...' : 'Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

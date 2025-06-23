/**
 * ──────────────────────────────────────────────────
 * File: client/src/components/Users.tsx
 * Description: Users management page for TondroAI CRM
 * Author: Muhammad Abubakar Khan
 * Created: 18-06-2025
 * Last Updated: 23-06-2025
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
  Delete as DeleteIcon
} from '@mui/icons-material';
import { apiHelpers } from '@/services/api';
import axios from 'axios';
import {
  User,
  Organization,
  CreateUserRequest,
  UpdateUserRequest,
  SnackbarState,
  SeverityType,
  Domain
} from '@/types';
import { getStatusColor, getStatusBackgroundColor } from '@/theme';
import { TestIds } from '../testIds';
import { getButtonProps } from '../utils/buttonStyles';
import { useUserRoles } from '../contexts/UserRolesContext';

// ────────────────────────────────────────
// Helper Functions
// ────────────────────────────────────────

const getRoleColor = (role: string): 'error' | 'warning' | 'info' | 'default' => {
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
  const theme = useTheme();
  const { userRoles } = useUserRoles();
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [domains, setDomains] = useState<Record<string, Domain[]>>({}); // Store domains by organization ID
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [filters, setFilters] = useState({
    organization_id: '',
    role: '',
    status: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 50,
    total: 0
  });
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [bulkCreateDialogOpen, setBulkCreateDialogOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    // Add a small delay to ensure token is available after login
    const timer = setTimeout(() => {
      const token = localStorage.getItem('jwt_token');
      if (token) {
        fetchUsers();
        fetchOrganizations();
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
      const params = {
        page: pagination.page + 1,
        page_size: pagination.pageSize,
        ...filters
      };
      Object.keys(params).forEach(key => {
        if (params[key as keyof typeof params] === '') delete params[key as keyof typeof params];
      });
      const response = await apiHelpers.getUsers(params, controller.signal);
      const usersData = response.data.items || response.data || [];
      setUsers(usersData);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || (response.data.items ? response.data.items.length : 0)
      }));
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
      setOrganizations(orgs);
      
      // Fetch domains for each organization
      const domainsData: Record<string, Domain[]> = {};
      for (const org of orgs) {
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

  const handleCreateUser = async (formData: CreateUserRequest): Promise<void> => {
    try {
      await apiHelpers.createUser(formData);
      setSnackbar({ open: true, message: 'User created successfully', severity: 'success' });
      setCreateDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      setSnackbar({ open: true, message: 'Failed to create user', severity: 'error' });
    }
  };

  const handleBulkCreateUsers = async (formData: any): Promise<void> => {
    try {
      const formattedData = {
        organization_id: formData.organization_id,
        users: formData.users.map((user: any) => ({
          organization_id: formData.organization_id,
          domain_id: formData.domain_id,
          email: user.email,
          first_name: user.first_name || null,
          last_name: user.last_name || null,
          role: user.role || 'tenant_admin',
          timezone: 'UTC',
          preferences: {}
        })),
        send_invitations: true
      };
      
      // Extract the users array from the formatted data
      const usersArray = formattedData.users.map((user: any) => ({
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role || 'tenant_admin',
        organization_id: formattedData.organization_id,
        domain_id: formData.domain_id
      }));
      
      await apiHelpers.bulkCreateUsers(usersArray);
      setSnackbar({ open: true, message: 'Users created successfully', severity: 'success' });
      setBulkCreateDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error creating users:', error);
      setSnackbar({ open: true, message: 'Failed to create users', severity: 'error' });
    }
  };

  const handleDeleteUser = async (id: string, reason: string = ''): Promise<void> => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await apiHelpers.deleteUser(id, reason);
      setSnackbar({ open: true, message: 'User deleted successfully', severity: 'success' });
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      setSnackbar({ open: true, message: 'Failed to delete user', severity: 'error' });
    }
  };

  const handleUpdateRole = async (id: string, role: string): Promise<void> => {
    try {
      await apiHelpers.updateUserRole(id, role);
      setSnackbar({ open: true, message: 'Role updated successfully', severity: 'success' });
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      setSnackbar({ open: true, message: 'Failed to update role', severity: 'error' });
    }
  };

  const handleUpdateStatus = async (id: string, status: string): Promise<void> => {
    try {
      await apiHelpers.updateUserStatus(id, status);
      setSnackbar({ open: true, message: 'Status updated successfully', severity: 'success' });
      fetchUsers();
    } catch (error) {
      console.error('Error updating status:', error);
      setSnackbar({ open: true, message: 'Failed to update status', severity: 'error' });
    }
  };

  const handleRecordLogin = async (id: string): Promise<void> => {
    try {
      await apiHelpers.recordUserLogin(id);
      setSnackbar({ open: true, message: 'Login recorded successfully', severity: 'success' });
    } catch (error) {
      console.error('Error recording login:', error);
      setSnackbar({ open: true, message: 'Failed to record login', severity: 'error' });
    }
  };

  const handleFilterChange = (field: string, value: string): void => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const handlePageChange = (event: unknown, newPage: number): void => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setPagination(prev => ({
      ...prev,
      pageSize: parseInt(event.target.value, 10),
      page: 0
    }));
  };

  const handleUpdateUser = async (formData: UpdateUserRequest): Promise<void> => {
    if (!selectedUser) return;
    
    try {
      await apiHelpers.updateUser(selectedUser.id, formData);
      setSnackbar({ open: true, message: 'User updated successfully', severity: 'success' });
      setSelectedUser(null);
      setEditMode(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      setSnackbar({ open: true, message: 'Failed to update user', severity: 'error' });
    }
  };

  const handleClearFilters = () => {
    setFilters({
      organization_id: '',
      role: '',
      status: '',
      search: ''
    });
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  return (
    <Box data-testid={TestIds.users.page}>
      <Typography variant="h4" component="h1" gutterBottom>
        Users
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} data-testid={TestIds.common.errorAlert}>
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
        setEditMode={setEditMode}
        setCreateDialogOpen={setCreateDialogOpen}
      />
      
      <CreateUserDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateUser}
        organizations={organizations}
        userRoles={userRoles}
      />
      
      <BulkCreateUsersDialog
        open={bulkCreateDialogOpen}
        onClose={() => setBulkCreateDialogOpen(false)}
        onSubmit={handleBulkCreateUsers}
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
          data-testid={snackbar.severity === 'success' ? TestIds.common.successAlert : TestIds.common.errorAlert}
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

const FilterSection: React.FC<FilterSectionProps> = ({ filters, organizations, userRoles, handleFilterChange, handleClearFilters }) => (
  <Card sx={{ mb: 3 }} data-testid={TestIds.filterForm.container}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Button variant="outlined" color="secondary" onClick={handleClearFilters} data-testid={TestIds.filterForm.clearButton}>
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
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            label="Search"
            value={filters.search}
            onChange={e => handleFilterChange('search', e.target.value)}
            placeholder="Filter by email or name"
            data-testid={TestIds.filterForm.search}
          />
        </Grid>
      </Grid>
    </CardContent>
  </Card>
);

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
  handlePageSizeChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleDeleteUser: (id: string) => void;
  setSelectedUser: (user: User) => void;
  setEditMode: (edit: boolean) => void;
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
  setEditMode,
  setCreateDialogOpen
}) => {
  const theme = useTheme();
  return (
    <Card data-testid={TestIds.users.table}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Users ({pagination.total})
          </Typography>
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
          <Alert severity="error" sx={{ mb: 2 }} data-testid={TestIds.common.errorAlert}>
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
                            backgroundColor: getStatusBackgroundColor(theme, user.status),
                            color: '#ffffff'
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
  organizations: Organization[];
  userRoles: string[];
}

const CreateUserDialog: React.FC<CreateUserDialogProps> = ({ 
  open, 
  onClose, 
  onSubmit, 
  organizations,
  userRoles
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
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New User</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <FormControl fullWidth margin="normal" required error={!!errors.organization_id}>
            <InputLabel>Organization</InputLabel>
            <Select
              value={formData.organization_id}
              onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
              label="Organization"
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
                      
                      // Comprehensive domain name cleaning
                      const cleanDomainName = domainName
                        .replace(/^0+/, '') // Remove leading zeros
                        .replace(/^\.+/, '') // Remove leading dots
                        .replace(/\.+$/, '') // Remove trailing dots
                        .replace(/0+\./g, '.') // Remove zeros before dots (e.g., "0.api" -> ".api")
                        .replace(/\.0+/g, '.') // Remove zeros after dots (e.g., "api.0" -> "api.")
                        .replace(/^0+([a-zA-Z])/g, '$1') // Remove leading zeros before letters
                        .replace(/([a-zA-Z])0+\./g, '$1.') // Remove zeros before dots after letters
                        .trim(); // Remove whitespace
                      
                      return (
                        <>
                          {cleanDomainName || 'Unknown Domain'}
                          {domain.is_primary && ' (Primary)'}
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
          />

          <TextField
            fullWidth
            margin="normal"
            label="First Name"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Last Name"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
          />

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Role</InputLabel>
            <Select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              label="Role"
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
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading}
          data-testid={TestIds.users.createButton}
        >
          {loading ? <CircularProgress size={20} /> : 'Create User'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ────────────────────────────────────────
// Bulk Create Users Dialog Component
// ────────────────────────────────────────

interface BulkUserData {
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface BulkCreateUsersDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { organization_id: string; domain_id: number; users: BulkUserData[] }) => Promise<void>;
  organizations: Organization[];
  userRoles: string[];
}

const BulkCreateUsersDialog: React.FC<BulkCreateUsersDialogProps> = ({ 
  open, 
  onClose, 
  onSubmit, 
  organizations,
  userRoles
}) => {
  const [formData, setFormData] = useState<{
    organization_id: string;
    domain_id: number;
    users: BulkUserData[];
  }>({
    organization_id: '',
    domain_id: 0,
    users: [{ email: '', first_name: '', last_name: '', role: 'tenant_admin' } as BulkUserData]
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

  const addUser = (): void => {
    setFormData(prev => ({
      ...prev,
      users: [...prev.users, { email: '', first_name: '', last_name: '', role: 'tenant_admin' }]
    }));
  };

  const removeUser = (index: number): void => {
    setFormData(prev => ({
      ...prev,
      users: prev.users.filter((_, i) => i !== index)
    }));
  };

  const updateUser = (index: number, field: keyof BulkUserData, value: string): void => {
    setFormData(prev => ({
      ...prev,
      users: prev.users.map((user, i) => 
        i === index ? { ...user, [field]: value } : user
      )
    }));
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

    const validUsers = formData.users.filter(user => user.email.trim());
    if (validUsers.length === 0) {
      newErrors.users = 'Please add at least one user with an email';
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
        users: validUsers.map(user => ({
          ...user,
          role: getRoleDisplayName(user.role)
        }))
      };
      
      await onSubmit(apiData as unknown as { organization_id: string; domain_id: number; users: BulkUserData[] });
      setFormData({
        organization_id: '',
        domain_id: 0,
        users: [{ email: '', first_name: '', last_name: '', role: 'tenant_admin' }]
      });
      setErrors({});
    } catch (error) {
      console.error('Error in bulk create dialog:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      organization_id: '',
      domain_id: 0,
      users: [{ email: '', first_name: '', last_name: '', role: 'tenant_admin' }]
    });
    setErrors({});
    setDomains([]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Bulk Create Users</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <FormControl fullWidth margin="normal" required error={!!errors.organization_id}>
            <InputLabel>Organization</InputLabel>
            <Select
              value={formData.organization_id}
              onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
              label="Organization"
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
                      
                      // Comprehensive domain name cleaning
                      const cleanDomainName = domainName
                        .replace(/^0+/, '') // Remove leading zeros
                        .replace(/^\.+/, '') // Remove leading dots
                        .replace(/\.+$/, '') // Remove trailing dots
                        .replace(/0+\./g, '.') // Remove zeros before dots (e.g., "0.api" -> ".api")
                        .replace(/\.0+/g, '.') // Remove zeros after dots (e.g., "api.0" -> "api.")
                        .replace(/^0+([a-zA-Z])/g, '$1') // Remove leading zeros before letters
                        .replace(/([a-zA-Z])0+\./g, '$1.') // Remove zeros before dots after letters
                        .trim(); // Remove whitespace
                      
                      return (
                        <>
                          {cleanDomainName || 'Unknown Domain'}
                          {domain.is_primary && ' (Primary)'}
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
          
          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            Users ({formData.users.length})
          </Typography>
          
          {formData.users.map((user, index) => (
            <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2">User {index + 1}</Typography>
                {formData.users.length > 1 && (
                  <Button
                    size="small"
                    color="error"
                    onClick={() => removeUser(index)}
                  >
                    Remove
                  </Button>
                )}
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={user.email}
                    onChange={(e) => updateUser(index, 'email', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={user.first_name}
                    onChange={(e) => updateUser(index, 'first_name', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={user.last_name}
                    onChange={(e) => updateUser(index, 'last_name', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Role</InputLabel>
                    <Select
                      value={user.role}
                      onChange={(e) => updateUser(index, 'role', e.target.value)}
                      label="Role"
                    >
                      {availableRoles.map((role) => (
                        <MenuItem key={role} value={role}>
                          {getRoleDisplayName(role)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          ))}
          
          <Button
            variant="outlined"
            onClick={addUser}
            sx={{ mt: 2 }}
          >
            Add Another User
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Users'}
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
  onUpdate, 
  organizations,
  domains,
  setEditMode
}) => {
  const theme = useTheme();
  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
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
                    backgroundColor: getStatusBackgroundColor(theme, user.status),
                    color: '#ffffff'
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
        }}>Edit</Button>
        <Button onClick={onClose}>Close</Button>
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
    role: getRoleInternalValue(user.role) as any // Convert display name to internal value
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
      // Convert data for API - API expects integer organization_id and display name for role
      const apiData = {
        organization_id: convertOrgIdToInteger(formData.organization_id || '').toString(),
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role ? getRoleDisplayName(formData.role) : undefined // Convert internal value to display name
      };
      
      await onSubmit(apiData as unknown as UpdateUserRequest);
    } catch (error) {
      console.error('Error in edit dialog:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit User</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Organization</InputLabel>
            <Select
              value={formData.organization_id}
              onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
              label="Organization"
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
              value={user.domain_id || ''}
              onChange={(e) => {
                // Note: domain_id is not part of UpdateUserRequest, so this is for display only
                console.log('Domain selected:', e.target.value);
              }}
              label="Domain"
              disabled={availableDomains.length === 0}
            >
              {availableDomains.map((domain) => (
                <MenuItem key={domain.id} value={domain.id}>
                  {domain.domain_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="First Name"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Last Name"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              label="Role"
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
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 
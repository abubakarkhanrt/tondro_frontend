/**
 * ──────────────────────────────────────────────────
 * File: client/src/components/Users.tsx
 * Description: Users management page for TondroAI CRM
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
  SeverityType
} from '@/types';
import { getStatusColor, getStatusBackgroundColor } from '@/theme';
import { TestIds } from '../testIds';
import { getButtonProps } from '../utils/buttonStyles';
import { useUserRoles } from '../contexts/UserRolesContext';

// ────────────────────────────────────────
// Utility Functions
// ────────────────────────────────────────

const getRoleColor = (role: string): 'error' | 'warning' | 'info' | 'default' => {
  switch (role) {
    case 'tenant_admin': return 'error';
    case 'tenant_support': return 'warning';
    case 'tenant_user': return 'info';
    default: return 'default';
  }
};

// Helper function to convert numeric organization ID to string format
const convertOrgIdToString = (orgId: string | number): string => {
  if (typeof orgId === 'string' && orgId.startsWith('org_')) {
    return orgId; // Already in correct format
  }
  // Convert numeric ID to string format (e.g., 1 -> "org_000001")
  const numId = typeof orgId === 'string' ? parseInt(orgId, 10) : orgId;
  return `org_${numId.toString().padStart(6, '0')}`;
};

// ────────────────────────────────────────
// Main Component
// ────────────────────────────────────────

const Users: React.FC = () => {
  const theme = useTheme();
  const { userRoles } = useUserRoles();
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
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
      setOrganizations(response.data.organizations || []);
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
          email: user.email,
          first_name: user.first_name || null,
          last_name: user.last_name || null,
          role: user.role || 'tenant_user',
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
        role: user.role || 'tenant_user',
        organization_id: formattedData.organization_id
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
          <ViewUserDialog
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onUpdate={fetchUsers}
            organizations={organizations}
          />
          <EditUserDialog
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onSubmit={handleUpdateUser}
            organizations={organizations}
            userRoles={userRoles}
          />
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
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Organization</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {user.first_name} {user.last_name}
                        </Typography>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {organizations.find(org => org.organizationId === convertOrgIdToString(user.organization_id))?.tenantName || 'Unknown'}
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
    email: '',
    first_name: '',
    last_name: '',
    role: 'tenant_user'
  });
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (): Promise<void> => {
    if (!formData.email.trim() || !formData.organization_id) {
      alert('Please fill in all required fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      setFormData({
        organization_id: '',
        email: '',
        first_name: '',
        last_name: '',
        role: 'tenant_user'
      });
    } catch (error) {
      console.error('Error in create dialog:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New User</DialogTitle>
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
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            margin="normal"
            required
            placeholder="user@example.com"
          />
          <TextField
            fullWidth
            label="First Name"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            margin="normal"
            placeholder="John"
          />
          <TextField
            fullWidth
            label="Last Name"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            margin="normal"
            placeholder="Doe"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              label="Role"
            >
              {userRoles.map((role) => (
                <MenuItem key={role} value={role}>
                  {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
          {loading ? 'Creating...' : 'Create'}
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
  onSubmit: (data: { organization_id: string; users: BulkUserData[] }) => Promise<void>;
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
  const [formData, setFormData] = useState({
    organization_id: '',
    users: [{ email: '', first_name: '', last_name: '', role: 'tenant_user' } as BulkUserData]
  });
  const [loading, setLoading] = useState<boolean>(false);

  const addUser = (): void => {
    setFormData(prev => ({
      ...prev,
      users: [...prev.users, { email: '', first_name: '', last_name: '', role: 'tenant_user' }]
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
    if (!formData.organization_id) {
      alert('Please select an organization');
      return;
    }

    const validUsers = formData.users.filter(user => user.email.trim());
    if (validUsers.length === 0) {
      alert('Please add at least one user with an email');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        users: validUsers
      });
      setFormData({
        organization_id: '',
        users: [{ email: '', first_name: '', last_name: '', role: 'tenant_user' }]
      });
    } catch (error) {
      console.error('Error in bulk create dialog:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Bulk Create Users</DialogTitle>
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
                      {userRoles.map((role) => (
                        <MenuItem key={role} value={role}>
                          {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
}

const ViewUserDialog: React.FC<ViewUserDialogProps> = ({ 
  user, 
  onClose, 
  onUpdate, 
  organizations 
}) => {
  const theme = useTheme();
  return (
    <Dialog open={!!user} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        User Details: {user?.first_name} {user?.last_name}
      </DialogTitle>
      <DialogContent>
        {user && (
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {user.first_name} {user.last_name}
                </Typography>
              </Grid>
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
                  Organization
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {organizations.find(org => org.organizationId === convertOrgIdToString(user.organization_id))?.tenantName || 'Unknown'}
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
                  Created
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {new Date(user.created_at).toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onUpdate}>Edit</Button>
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
  userRoles: string[];
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({ 
  user, 
  onClose, 
  onSubmit, 
  organizations,
  userRoles
}) => {
  const [formData, setFormData] = useState<UpdateUserRequest>({
    organization_id: user.organization_id,
    email: user.email,
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    role: user.role
  });
  const [loading, setLoading] = useState<boolean>(false);

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
      await onSubmit(formData);
    } catch (error) {
      console.error('Error in edit dialog:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!user} onClose={onClose} maxWidth="sm" fullWidth>
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
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              label="Role"
            >
              {userRoles.map((role) => (
                <MenuItem key={role} value={role}>
                  {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
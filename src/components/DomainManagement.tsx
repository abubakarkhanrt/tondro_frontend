/**
 * ──────────────────────────────────────────────────
 * File: client/src/components/DomainManagement.tsx
 * Description: Domain management component for organizations
 * Author: Muhammad Abubakar Khan
 * Created: 18-06-2025
 * Last Updated: 07-07-2025
 * ──────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  Tooltip,
  Switch,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Domain as DomainIcon,
} from '@mui/icons-material';
import { apiHelpers } from '../services/api';
import {
  type Domain,
  type CreateDomainRequest,
  type UpdateDomainRequest,
  ERROR_MESSAGES,
} from '../types';
import { getStatusColor } from '../theme';
import { TestIds } from '../testIds';
import { useAuth } from '@/contexts/AuthContext';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { useAlert } from '@/contexts/AlertContext';

interface DomainManagementProps {
  organizationId: string;
  organizationName: string;
}

const DomainManagement: React.FC<DomainManagementProps> = ({
  organizationId,
}) => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const { showAlert } = useAlert();

  const fetchDomains = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiHelpers.getOrganizationDomains(organizationId);
      // Handle the new paginated API response structure
      const responseData = response.data as any;
      if (
        responseData &&
        responseData.items &&
        Array.isArray(responseData.items)
      ) {
        // Extract domains from the paginated response
        const domainsArray = responseData.items;
        setDomains(domainsArray);
      } else {
        // Fallback for unexpected response format
        console.warn('Unexpected domains response format:', responseData);
        setDomains([]);
      }
    } catch (error: any) {
      setError(getApiErrorMessage(error, 'Failed to fetch domains'));
      // Set empty array on error to prevent map errors
      setDomains([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  const handleCreateDomain = async (formData: CreateDomainRequest) => {
    try {
      await apiHelpers.createDomain(formData);
      showAlert('Domain created successfully!');
      setCreateDialogOpen(false);
      fetchDomains();
    } catch (error: any) {
      const errorMessage = getApiErrorMessage(error, 'Failed to create domain');
      const userFriendlyMessage =
        ERROR_MESSAGES[errorMessage as keyof typeof ERROR_MESSAGES] ||
        errorMessage;
      showAlert(userFriendlyMessage, 'error');
    }
  };

  const handleUpdateDomain = async (
    domainId: string,
    formData: UpdateDomainRequest
  ) => {
    try {
      await apiHelpers.updateDomain(domainId, formData);
      showAlert('Domain updated successfully!');
      setEditDialogOpen(false);
      setSelectedDomain(null);
      fetchDomains();
    } catch (error: any) {
      const errorMessage = getApiErrorMessage(error, 'Failed to update domain');
      const userFriendlyMessage =
        ERROR_MESSAGES[errorMessage as keyof typeof ERROR_MESSAGES] ||
        errorMessage;
      showAlert(userFriendlyMessage, 'error');
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    try {
      await apiHelpers.deleteDomain(domainId);
      showAlert('Domain deleted successfully!');
      fetchDomains();
    } catch (error: any) {
      const errorMessage = getApiErrorMessage(error, 'Failed to delete domain');
      const userFriendlyMessage =
        ERROR_MESSAGES[errorMessage as keyof typeof ERROR_MESSAGES] ||
        errorMessage;
      showAlert(userFriendlyMessage, 'error');
    }
  };

  const validateDomainName = (name: string): boolean => {
    const domainRegex =
      /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return domainRegex.test(name);
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="h6">Domain Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          data-testid={TestIds.addDomainButton}
        >
          Add Domain
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Domain Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.isArray(domains) &&
                domains.map(domain => (
                  <TableRow key={domain.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DomainIcon sx={{ mr: 1, fontSize: 16 }} />
                        {domain.domain_name || domain.name}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={domain.is_primary ? 'Primary' : 'Secondary'}
                        color={domain.is_primary ? 'primary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={domain.status}
                        color={getStatusColor(domain.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(domain.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Edit Domain">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedDomain(domain);
                              setEditDialogOpen(true);
                            }}
                            data-testid={TestIds.editDomainButton}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Domain">
                          {Boolean(domain.is_primary) &&
                          Array.isArray(domains) &&
                          domains.filter(d => Boolean(d.is_primary)).length ===
                            1 ? (
                            <span>
                              <IconButton size="small" disabled={true}>
                                <DeleteIcon />
                              </IconButton>
                            </span>
                          ) : (
                            <IconButton
                              size="small"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Delete domain "${domain.domain_name || domain.name}"?`
                                  )
                                ) {
                                  handleDeleteDomain(String(domain.id));
                                }
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              {(!Array.isArray(domains) || domains.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="textSecondary">
                      No domains found. Add your first domain to get started.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create Domain Dialog */}
      <CreateDomainDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateDomain}
        organizationId={organizationId}
        validateDomainName={validateDomainName}
      />

      {/* Edit Domain Dialog */}
      <EditDomainDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedDomain(null);
        }}
        onSubmit={data => {
          if (selectedDomain) {
            return handleUpdateDomain(String(selectedDomain.id), data);
          }
          return Promise.resolve();
        }}
        domain={selectedDomain}
        validateDomainName={validateDomainName}
      />
    </Box>
  );
};

// Create Domain Dialog Component
interface CreateDomainDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDomainRequest) => Promise<void>;
  organizationId: string;
  validateDomainName: (name: string) => boolean;
}

const CreateDomainDialog: React.FC<CreateDomainDialogProps> = ({
  open,
  onClose,
  onSubmit,
  organizationId,
  validateDomainName,
}) => {
  const { user } = useAuth();
  const { showAlert } = useAlert();

  const [formData, setFormData] = useState<CreateDomainRequest>({
    organization_id: organizationId,
    domain_name: '',
    is_primary: false,
    user_id: user?.id,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof CreateDomainRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.domain_name.trim()) {
      newErrors.domain_name = 'Domain name is required';
    } else if (!validateDomainName(formData.domain_name)) {
      newErrors.domain_name = 'Please enter a valid domain name';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (!user?.id) {
      showAlert('User ID not found. Please log in again.', 'error');
      return;
    }

    setLoading(true);
    try {
      // Ensure user_id is included in the payload
      const payload = {
        ...formData,
        user_id: user.id, // Get fresh user ID
      };
      await onSubmit(payload);
      setFormData({
        organization_id: organizationId,
        domain_name: '',
        is_primary: false,
        user_id: user.id,
      });
      setErrors({});
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      organization_id: organizationId,
      domain_name: '',
      is_primary: false,
      user_id: user?.id,
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Domain</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Domain Name"
              value={formData.domain_name}
              onChange={e => handleChange('domain_name', e.target.value)}
              error={!!errors.domain_name}
              helperText={
                errors.domain_name || 'Enter domain name (e.g., company.com)'
              }
              disabled={loading}
              data-testid={TestIds.domainNameInput}
            />
          </Grid>
          {/* Set as Primary Domain control hidden as requested
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_primary}
                  onChange={(e) => handleChange('is_primary', e.target.checked)}
                  disabled={loading}
                />
              }
              label="Set as Primary Domain"
            />
          </Grid>
          */}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.domain_name.trim()}
          data-testid={TestIds.createDomainButton}
        >
          {loading ? <CircularProgress size={20} /> : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Edit Domain Dialog Component
interface EditDomainDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: UpdateDomainRequest) => Promise<void>;
  domain: Domain | null;
  validateDomainName: (name: string) => boolean;
}

const EditDomainDialog: React.FC<EditDomainDialogProps> = ({
  open,
  onClose,
  onSubmit,
  domain,
  validateDomainName,
}) => {
  const { user } = useAuth();

  const [formData, setFormData] = useState<UpdateDomainRequest>({
    domain_name: '',
    is_primary: false,
    status: 'active',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (domain) {
      setFormData({
        domain_name: domain.name || domain.domain_name || '',
        is_primary: Boolean(domain.is_primary),
        status: domain.status,
      });
    }
  }, [domain]);

  const handleChange = (field: keyof UpdateDomainRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.domain_name?.trim()) {
      newErrors.domain_name = 'Domain name is required';
    } else if (!validateDomainName(formData.domain_name)) {
      newErrors.domain_name = 'Please enter a valid domain name';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (!user?.id) {
      console.error('User ID not found for domain update');
      return;
    }

    setLoading(true);
    try {
      const updatePayload = {
        ...formData,
        user_id: user.id,
      };
      console.log('Sending update payload with user_id:', updatePayload);
      await onSubmit(updatePayload);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  if (!domain) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Domain</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Domain Name"
              value={formData.domain_name}
              onChange={e => handleChange('domain_name', e.target.value)}
              error={!!errors.domain_name}
              helperText={errors.domain_name}
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12} sx={{ display: 'none' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(formData.is_primary)}
                  onChange={e => handleChange('is_primary', e.target.checked)}
                  disabled={loading}
                />
              }
              label="Primary Domain"
            />
          </Grid>
          <Grid item xs={12} sx={{ display: 'none' }}>
            <TextField
              select
              fullWidth
              label="Status"
              value={formData.status}
              onChange={e => handleChange('status', e.target.value)}
              disabled={loading}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          data-testid={TestIds.updateDomainButton}
        >
          {loading ? <CircularProgress size={20} /> : 'Update'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DomainManagement;

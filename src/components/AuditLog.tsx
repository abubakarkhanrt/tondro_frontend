/**
 * ──────────────────────────────────────────────────
 * File: client/src/components/AuditLog.tsx
 * Description: Audit log management page for TondroAI CRM
 * Author: Muhammad Abubakar Khan
 * Created: 18-06-2025
 * Last Updated: 27-06-2025
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
  TextField,
  InputAdornment,
  Collapse,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search,
} from '@mui/icons-material';
import { apiHelpers } from '../services/api';
import { type AuditLog as AuditLogType } from '../types/index';
import { TestIds } from '../testIds';
import { useEntityState, usePagination, useEntityData } from '../hooks';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { useAlert } from '@/contexts/AlertContext';

// ────────────────────────────────────────
// Main Component
// ────────────────────────────────────────

const AuditLog: React.FC = () => {
  const {
    entityState,
    setEntityState,
    pagination,
    setPagination,
    filters,
    setFilters,
    selectedEntity: selectedLog,
    setSelectedEntity: setSelectedLog,
  } = useEntityState<AuditLogType>(
    {
      entity_type: '',
      action: '',
    },
    50
  );

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const { showAlert } = useAlert();

  const { fetchData: fetchAuditLogs } = useEntityData(
    entityState,
    setEntityState,
    setPagination,
    {
      fetchFunction: async options =>
        apiHelpers.getAuditLogs(options?.params, options?.signal),
      filters,
      pagination,
    }
  );

  useEffect(() => {
    fetchAuditLogs();
  }, [filters, pagination.page, pagination.pageSize]);

  const fetchAuditLogDetails = async (
    id: string
  ): Promise<AuditLogType | null> => {
    try {
      const response = await apiHelpers.getAuditLog(id);
      return response.data;
    } catch (error: any) {
      showAlert(
        getApiErrorMessage(error, 'Failed to fetch audit log details'),
        'error'
      );
      return null;
    }
  };

  const handleFilterChange = (field: string, value: string): void => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const handleClearFilters = (): void => {
    setFilters({
      entity_type: '',
      action: '',
    });
    setPagination(prev => ({ ...prev, page: 0 }));
  };

  const paginationHandlers = usePagination(pagination, setPagination);

  const toggleRowExpansion = (id: string): void => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getActionColor = (
    action: string
  ): 'success' | 'primary' | 'error' | 'info' | 'warning' | 'default' => {
    switch (action) {
      case 'create':
        return 'success';
      case 'update':
        return 'primary';
      case 'delete':
        return 'error';
      case 'login':
        return 'info';
      case 'logout':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getEntityTypeColor = (
    entityType: string
  ): 'primary' | 'secondary' | 'success' | 'warning' | 'default' => {
    switch (entityType) {
      case 'organization':
        return 'primary';
      case 'user':
        return 'secondary';
      case 'subscription':
        return 'success';
      case 'product':
        return 'warning';
      default:
        return 'default';
    }
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
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Entity Type</InputLabel>
              <Select
                value={filters.entity_type}
                onChange={e =>
                  handleFilterChange('entity_type', e.target.value)
                }
                label="Entity Type"
                data-testid={TestIds.filterForm.entityType}
              >
                <MenuItem
                  value=""
                  data-testid={TestIds.filterForm.entityTypeOptionAll}
                >
                  All
                </MenuItem>
                <MenuItem
                  value="organization"
                  data-testid={TestIds.filterForm.entityTypeOption(
                    'organization'
                  )}
                >
                  Organization
                </MenuItem>
                <MenuItem
                  value="user"
                  data-testid={TestIds.filterForm.entityTypeOption('user')}
                >
                  User
                </MenuItem>
                <MenuItem
                  value="subscription"
                  data-testid={TestIds.filterForm.entityTypeOption(
                    'subscription'
                  )}
                >
                  Subscription
                </MenuItem>
                <MenuItem
                  value="product"
                  data-testid={TestIds.filterForm.entityTypeOption('product')}
                >
                  Product
                </MenuItem>
                <MenuItem
                  value="cv_analysis"
                  data-testid={TestIds.filterForm.entityTypeOption(
                    'cv_analysis'
                  )}
                >
                  CV Analysis
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Action</InputLabel>
              <Select
                value={filters.action}
                onChange={e => handleFilterChange('action', e.target.value)}
                label="Action"
                data-testid={TestIds.filterForm.action}
              >
                <MenuItem
                  value=""
                  data-testid={TestIds.filterForm.actionOptionAll}
                >
                  All
                </MenuItem>
                <MenuItem
                  value="create"
                  data-testid={TestIds.filterForm.actionOption('create')}
                >
                  Create
                </MenuItem>
                <MenuItem
                  value="update"
                  data-testid={TestIds.filterForm.actionOption('update')}
                >
                  Update
                </MenuItem>
                <MenuItem
                  value="delete"
                  data-testid={TestIds.filterForm.actionOption('delete')}
                >
                  Delete
                </MenuItem>
                <MenuItem
                  value="login"
                  data-testid={TestIds.filterForm.actionOption('login')}
                >
                  Login
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  // ────────────────────────────────────────
  // Audit Log Table Component
  // ────────────────────────────────────────

  const AuditLogTable: React.FC = () => (
    <Card data-testid={TestIds.auditLog.table}>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h6">Audit Log ({pagination.total})</Typography>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
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
                    <TableCell>Entity Type</TableCell>
                    <TableCell>Entity ID</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Performed By</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entityState.data.map(log => (
                    <React.Fragment key={log.id}>
                      <TableRow>
                        <TableCell>
                          <Chip
                            label={log.entity_type}
                            color={getEntityTypeColor(log.entity_type)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{log.entity_id}</TableCell>
                        <TableCell>
                          <Chip
                            label={log.action}
                            color={getActionColor(log.action)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{log.performed_by}</TableCell>
                        <TableCell>
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => toggleRowExpansion(String(log.id))}
                              data-testid={TestIds.auditLog.expandDetails(
                                String(log.id)
                              )}
                            >
                              {expandedRows.has(String(log.id)) ? (
                                <ExpandLessIcon />
                              ) : (
                                <ExpandMoreIcon />
                              )}
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => setSelectedLog(log)}
                              data-testid={TestIds.auditLog.viewDetails(
                                String(log.id)
                              )}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell
                          style={{ paddingBottom: 0, paddingTop: 0 }}
                          colSpan={6}
                        >
                          <Collapse
                            in={expandedRows.has(String(log.id))}
                            timeout="auto"
                            unmountOnExit
                          >
                            <Box sx={{ margin: 1 }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Details:
                              </Typography>
                              <pre
                                style={{
                                  backgroundColor: '#f5f5f5',
                                  padding: '8px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  overflow: 'auto',
                                }}
                              >
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
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

  return (
    <Box data-testid={TestIds.auditLog.page}>
      <Typography variant="h4" component="h1" gutterBottom>
        Audit Log
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
      <AuditLogTable />

      <ViewAuditLogDialog
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
        onFetchDetails={fetchAuditLogDetails}
      />
    </Box>
  );
};

// ────────────────────────────────────────
// View Audit Log Dialog Component
// ────────────────────────────────────────

interface ViewAuditLogDialogProps {
  log: AuditLogType | null;
  onClose: () => void;
  onFetchDetails: (id: string) => Promise<AuditLogType | null>;
}

const ViewAuditLogDialog: React.FC<ViewAuditLogDialogProps> = ({
  log,
  onClose,
  onFetchDetails,
}) => {
  const [detailedLog, setDetailedLog] = useState<AuditLogType | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Reset and fetch data when log changes
  useEffect(() => {
    if (!log) {
      setDetailedLog(null);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadDetails = async () => {
      setLoading(true);
      setDetailedLog(log); // Set initial data immediately

      try {
        const freshLog = await onFetchDetails(String(log.id));
        if (isMounted && freshLog) {
          setDetailedLog(freshLog);
        }
      } catch (error) {
        // Keep the original log data if fetch fails
        if (isMounted) {
          setDetailedLog(log);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDetails();

    return () => {
      isMounted = false;
    };
  }, [log?.id, onFetchDetails]);

  // Don't render anything if no log is provided
  if (!log) return null;

  return (
    <Dialog
      open={!!log}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      data-testid={TestIds.auditLog.viewDialog.container}
    >
      <DialogTitle data-testid={TestIds.auditLog.viewDialog.title}>
        Audit Log Details: {detailedLog?.id || log.id}
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : detailedLog ? (
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  ID
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {detailedLog.id}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Entity Type
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {detailedLog.entity_type}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Entity ID
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {detailedLog.entity_id}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Action
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {detailedLog.action}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Performed By
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {detailedLog.performed_by}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {new Date(detailedLog.created_at).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Details
                </Typography>
                <pre
                  style={{
                    backgroundColor: '#f5f5f5',
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    overflow: 'auto',
                  }}
                >
                  {detailedLog.details
                    ? JSON.stringify(detailedLog.details, null, 2)
                    : 'No details recorded'}
                </pre>
              </Grid>
            </Grid>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <Typography>No data available</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          data-testid={TestIds.auditLog.viewDialog.closeButton}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AuditLog;

// ──────────────────────────────────────────────────
// End of File: client/src/components/AuditLog.tsx
// ──────────────────────────────────────────────────

/**
 * ──────────────────────────────────────────────────
 * File: client/src/components/AuditLog.tsx
 * Description: Audit log management page for TondroAI CRM
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
  Chip, TablePagination, Snackbar, Collapse, SelectChangeEvent
} from '@mui/material';
import { 
  Visibility as VisibilityIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { apiHelpers } from '@/services/api';
import { AuditLog as AuditLogType } from '@/types';
import { TestIds } from '../testIds';

// ────────────────────────────────────────
// Type Definitions
// ────────────────────────────────────────

interface FiltersState {
  entity_type: string;
  action: string;
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
// Main Component
// ────────────────────────────────────────

const AuditLog: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLogType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FiltersState>({
    entity_type: '',
    action: ''
  });
  const [pagination, setPagination] = useState<PaginationState>({
    page: 0,
    pageSize: 50,
    total: 0
  });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedLog, setSelectedLog] = useState<AuditLogType | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchAuditLogs();
  }, [filters, pagination.page, pagination.pageSize]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiHelpers.getAuditLog({
        page: pagination.page + 1,
        page_size: pagination.pageSize,
        ...filters
      });
      
      setAuditLogs(response.data.items || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0
      }));
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
      setError('Failed to fetch audit logs');
      if (error.response && error.response.status === 401) {
        // Handle unauthorized access
        setError('Unauthorized access');
      }
    } finally {
      setLoading(false);
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

  const toggleRowExpansion = (id: string): void => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getActionColor = (action: string): 'success' | 'primary' | 'error' | 'info' | 'warning' | 'default' => {
    switch (action) {
      case 'create': return 'success';
      case 'update': return 'primary';
      case 'delete': return 'error';
      case 'login': return 'info';
      case 'logout': return 'warning';
      default: return 'default';
    }
  };

  const getEntityTypeColor = (entityType: string): 'primary' | 'secondary' | 'success' | 'warning' | 'default' => {
    switch (entityType) {
      case 'organization': return 'primary';
      case 'user': return 'secondary';
      case 'subscription': return 'success';
      case 'product': return 'warning';
      default: return 'default';
    }
  };

  // ────────────────────────────────────────
  // Filter Section Component
  // ────────────────────────────────────────

  const FilterSection: React.FC = () => (
    <Card sx={{ mb: 3 }} data-testid={TestIds.filterForm.container}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Entity Type</InputLabel>
              <Select
                value={filters.entity_type}
                onChange={(e) => handleFilterChange('entity_type', e.target.value)}
                label="Entity Type"
                data-testid={TestIds.filterForm.entityType}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="organization">Organization</MenuItem>
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="subscription">Subscription</MenuItem>
                <MenuItem value="product">Product</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Action</InputLabel>
              <Select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                label="Action"
                data-testid={TestIds.filterForm.action}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="create">Create</MenuItem>
                <MenuItem value="update">Update</MenuItem>
                <MenuItem value="delete">Delete</MenuItem>
                <MenuItem value="login">Login</MenuItem>
                <MenuItem value="logout">Logout</MenuItem>
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Audit Log ({pagination.total})
          </Typography>
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
                    <TableCell>Entity Type</TableCell>
                    <TableCell>Entity ID</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Performed By</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {auditLogs.map((log) => (
                    <React.Fragment key={log.id}>
                      <TableRow>
                        <TableCell>
                          <Chip
                            label={log.resource_type}
                            color={getEntityTypeColor(log.resource_type)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{log.resource_id}</TableCell>
                        <TableCell>
                          <Chip
                            label={log.action}
                            color={getActionColor(log.action)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{log.user_id}</TableCell>
                        <TableCell>
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => toggleRowExpansion(log.id)}
                              data-testid={TestIds.auditLog.expandDetails(log.id)}
                            >
                              {expandedRows.has(log.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => setSelectedLog(log)}
                              data-testid={TestIds.auditLog.viewDetails(log.id)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                          <Collapse in={expandedRows.has(log.id)} timeout="auto" unmountOnExit>
                            <Box sx={{ margin: 1 }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Details:
                              </Typography>
                              <pre style={{ 
                                backgroundColor: '#f5f5f5', 
                                padding: '8px', 
                                borderRadius: '4px',
                                fontSize: '12px',
                                overflow: 'auto'
                              }}>
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
    <Box data-testid={TestIds.auditLog.page}>
      <Typography variant="h4" component="h1" gutterBottom>
        Audit Log
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} data-testid={TestIds.common.errorAlert}>
          {error}
        </Alert>
      )}
      
      <FilterSection />
      <AuditLogTable />
      
      {selectedLog && (
        <ViewAuditLogDialog
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
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

// ────────────────────────────────────────
// View Audit Log Dialog Component
// ────────────────────────────────────────

interface ViewAuditLogDialogProps {
  log: AuditLogType;
  onClose: () => void;
}

const ViewAuditLogDialog: React.FC<ViewAuditLogDialogProps> = ({ log, onClose }) => {
  return (
    <Dialog open={!!log} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Audit Log Details: {log?.id}
      </DialogTitle>
      <DialogContent>
        {log && (
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  ID
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {log.id}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Entity Type
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {log.resource_type}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Entity ID
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {log.resource_id}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Action
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {log.action}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Performed By
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {log.user_id}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {new Date(log.created_at).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Changes
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {log.details ? JSON.stringify(log.details, null, 2) : 'No changes recorded'}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AuditLog;

// ──────────────────────────────────────────────────
// End of File: client/src/components/AuditLog.tsx
// ────────────────────────────────────────────────── 
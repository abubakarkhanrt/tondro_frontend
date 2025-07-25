/**
 * ──────────────────────────────────────────────────
 * File: src/components/Jobs.tsx
 * Description: Displays a list of all processing jobs for the user.
 * Author: Muhammad Abubakar Khan
 * Created: 11-07-2024
 * Last Updated: 18-07-2025
 * ──────────────────────────────────────────────────
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Card,
  CardContent,
  TablePagination,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { transcriptsApiHelpers } from '../services/transcriptsApi';
import type { Job } from '../types';
import { TestIds } from '../testIds';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';

// ────────────────────────────────────────
// Main Component
// ────────────────────────────────────────

const Jobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ────────────────────────────────────────
  // Data Fetching
  // ────────────────────────────────────────

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await transcriptsApiHelpers.getJobsList();
      setJobs(response.data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // ────────────────────────────────────────
  // Pagination Handlers
  // ────────────────────────────────────────

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // ────────────────────────────────────────
  // Helper Functions
  // ────────────────────────────────────────

  const formatTimestamp = (timestamp: string | null): string => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusChipColor = (
    status: string
  ): 'success' | 'primary' | 'error' | 'default' => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'primary';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  // ────────────────────────────────────────
  // Render Logic
  // ────────────────────────────────────────

  if (loading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}
        data-testid={TestIds.jobs.loadingSpinner}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" data-testid={TestIds.jobs.errorAlert}>
        {error}
      </Alert>
    );
  }

  const paginatedJobs = jobs.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box data-testid={TestIds.jobs.pageContainer}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="h4" component="h1">
          Jobs
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchJobs}
          data-testid={TestIds.jobs.refreshButton}
        >
          Refresh
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer
            component={Paper}
            data-testid={TestIds.jobs.jobsTable}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Job ID</TableCell>
                  <TableCell>Submitted</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedJobs.map(job => (
                  <TableRow
                    key={job.job_id}
                    data-testid={TestIds.jobs.jobRow(job.job_id)}
                  >
                    <TableCell>Job #{job.job_id}</TableCell>
                    <TableCell>
                      {formatTimestamp(job.upload_timestamp)}
                    </TableCell>
                    <TableCell>
                      {job.processing_duration_seconds !== null
                        ? `${job.processing_duration_seconds.toFixed(1)}s`
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={job.status}
                        color={getStatusChipColor(job.status)}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={jobs.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export { Jobs };

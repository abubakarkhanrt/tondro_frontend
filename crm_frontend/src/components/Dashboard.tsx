/**
 * ──────────────────────────────────────────────────
 * File: client/src/components/Dashboard.tsx
 * Description: Main dashboard with entity summaries for TondroAI CRM
 * Author: Muhammad Abubakar Khan
 * Created: 18-06-2025
 * Last Updated: 20-06-2025
 * ──────────────────────────────────────────────────
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import { apiHelpers } from '../services/api';
import axios from 'axios';
import { TestIds } from '../testIds';

// ────────────────────────────────────────
// Type Definitions
// ────────────────────────────────────────

interface SummaryData {
  organizations: any;
  users: any;
  subscriptions: any;
  products: any;
  root: any;
  health: any;
  status: any;
}

interface SummaryCardProps {
  title: string;
  data: any;
  loading: boolean;
  color: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error';
  path: string;
  icon: string;
}

// ────────────────────────────────────────
// Main Component
// ────────────────────────────────────────

const Dashboard: React.FC = () => {
  const [summaryData, setSummaryData] = useState<SummaryData>({
    organizations: null,
    users: null,
    subscriptions: null,
    products: null,
    root: null,
    health: null,
    status: null,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Add a longer delay to ensure token is available after login
    const timer = setTimeout(() => {
      const token = localStorage.getItem('jwt_token');
      if (token && token !== 'undefined' && token !== 'null') {
        fetchSummaryData();
      } else {
        setError('No authentication token found. Please login again.');
        setLoading(false);
      }
    }, 500); // Increased delay to ensure token is set

    return () => {
      clearTimeout(timer);
      // Cancel any ongoing requests when component unmounts
      if (abortController) {
        abortController.abort();
      }
    };
  }, []);

  const fetchSummaryData = async (): Promise<void> => {
    // Cancel any existing request
    if (abortController) {
      abortController.abort();
    }

    // Create new abort controller
    const controller = apiHelpers.createAbortController();
    setAbortController(controller);

    setLoading(true);
    setError('');

    try {
      // Double-check token before making request
      const token = localStorage.getItem('jwt_token');
      if (!token || token === 'undefined' || token === 'null') {
        setError('Authentication token not found. Please login again.');
        setLoading(false);
        return;
      }

      // Fetch summary data for each entity type
      const orgsData = await apiHelpers
        .getOrganizations({ page: 1, limit: 1 }, controller.signal)
        .catch((err) => ({ error: err.message }));
      const usersData = await apiHelpers
        .getUsers({ page: 1, page_size: 1 }, controller.signal)
        .catch((err) => ({ error: err.message }));
      const subsData = await apiHelpers
        .getSubscriptions({ page: 1, page_size: 1 }, controller.signal)
        .catch((err) => ({ error: err.message }));
      const productsData = await apiHelpers
        .getProducts(controller.signal)
        .catch((err) => ({ error: err.message }));

      // Fetch health check data through proxy
      const rootData = await apiHelpers
        .getRoot(controller.signal)
        .catch((err) => ({ error: err.message }));
      const healthData = await apiHelpers
        .getHealth(controller.signal)
        .catch((err) => ({ error: err.message }));
      const statusData = await apiHelpers
        .getStatus(controller.signal)
        .catch((err) => ({ error: err.message }));

      setSummaryData({
        organizations:
          'error' in orgsData ? { error: orgsData.error } : orgsData,
        users: 'error' in usersData ? { error: usersData.error } : usersData,
        subscriptions:
          'error' in subsData ? { error: subsData.error } : subsData,
        products:
          'error' in productsData
            ? { error: productsData.error }
            : productsData,
        root: 'error' in rootData ? { error: rootData.error } : rootData,
        health:
          'error' in healthData ? { error: healthData.error } : healthData,
        status:
          'error' in statusData ? { error: statusData.error } : statusData,
      });
    } catch (error: any) {
      // Don't show error for cancelled requests
      if (axios.isCancel(error)) {
        return;
      }

      console.error('Error fetching summary data:', error);
      if (error.response && error.response.status === 401) {
        setError('Authentication failed. Please login again.');
      } else {
        setError('Failed to load dashboard data. Please try again.');
      }
    } finally {
      setLoading(false);
      setAbortController(null);
    }
  };

  const handleViewDetails = (path: string): void => {
    router.push(path);
  };

  // ────────────────────────────────────────
  // Summary Card Component
  // ────────────────────────────────────────

  const SummaryCard: React.FC<SummaryCardProps> = ({
    title,
    data,
    loading,
    color,
    path,
    icon,
  }) => {
    // Fix data access pattern - check for different possible structures
    let count = 0;
    let isError = false;
    let statusText = '';
    let errorMessage = '';

    if (data) {
      if (data.error) {
        isError = true;
        errorMessage = data.error;
      } else if (data.count !== undefined) {
        count = data.count;
      } else if (data.total !== undefined) {
        count = data.total;
      } else if (data.data?.total !== undefined) {
        count = data.data.total;
      } else if (Array.isArray(data.data)) {
        count = data.data.length;
      } else if (Array.isArray(data)) {
        count = data.length;
      } else if (data.status) {
        statusText = data.status;
      } else if (data.data?.status) {
        statusText = data.data.status;
      }
    }

    // Special handling for organizations API error
    const isOrganizationsError = title === 'Organizations' && isError;

    return (
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent
          sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box
              sx={{
                backgroundColor: `${color}.light`,
                color: `${color}.main`,
                borderRadius: '50%',
                width: 48,
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2,
              }}
            >
              {icon}
            </Box>
            <Typography variant="h6" component="h2">
              {title}
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress
                size={24}
                data-testid={TestIds.common.loadingSpinner}
              />
            </Box>
          ) : isError ? (
            <Box sx={{ mt: 1 }}>
              {isOrganizationsError ? (
                <>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 'bold', mb: 1 }}
                    >
                      Organizations API Update Required
                    </Typography>
                    <Typography variant="body2">
                      The backend needs to be updated to support the new domain
                      management features.
                    </Typography>
                  </Alert>
                  <Box
                    sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 2 }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      align="center"
                    >
                      Expected: Total organizations count with domain management
                    </Typography>
                  </Box>
                </>
              ) : (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {errorMessage ||
                    'Unable to load data. Please check your connection.'}
                </Alert>
              )}
              <Typography variant="body2" color="text.secondary">
                {title === 'API Status'
                  ? 'API status information'
                  : title === 'Health Check'
                    ? 'Service health status'
                    : title === 'Service Info'
                      ? 'Service information'
                      : `Total ${title.toLowerCase()} count`}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              {statusText ? (
                <>
                  <Typography
                    variant="h6"
                    component="div"
                    sx={{ mb: 1, color: `${color}.main` }}
                  >
                    {statusText}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {title === 'API Status'
                      ? 'API is operational'
                      : title === 'Health Check'
                        ? 'Service is healthy'
                        : 'Service is running'}
                  </Typography>
                </>
              ) : (
                <>
                  <Typography
                    variant="h3"
                    component="div"
                    sx={{ mb: 1, color: `${color}.main` }}
                  >
                    {count.toLocaleString()}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Total {title.toLowerCase()}
                  </Typography>
                </>
              )}
            </Box>
          )}

          <Button
            variant="outlined"
            color={color}
            onClick={() => handleViewDetails(path)}
            sx={{ mt: 'auto', alignSelf: 'flex-start' }}
            disabled={loading}
            data-testid={`dashboard-${title.toLowerCase()}-view-details`}
          >
            View Details
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh',
        }}
      >
        <CircularProgress data-testid={TestIds.common.loadingSpinner} />
      </Box>
    );
  }

  return (
    <Box data-testid={TestIds.dashboard.page}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          data-testid={TestIds.common.errorAlert}
        >
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Organizations"
            data={summaryData.organizations}
            loading={loading}
            color="primary"
            path="/organizations"
            icon="🏢"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Users"
            data={summaryData.users}
            loading={loading}
            color="secondary"
            path="/users"
            icon="👥"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Subscriptions"
            data={summaryData.subscriptions}
            loading={loading}
            color="success"
            path="/subscriptions"
            icon="📋"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Products"
            data={summaryData.products}
            loading={loading}
            color="info"
            path="/products"
            icon="📦"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <SummaryCard
            title="API Status"
            data={summaryData.status}
            loading={loading}
            color="warning"
            path="/status"
            icon="🔌"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <SummaryCard
            title="Health Check"
            data={summaryData.health}
            loading={loading}
            color="success"
            path="/health"
            icon="❤️"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <SummaryCard
            title="Service Info"
            data={summaryData.root}
            loading={loading}
            color="info"
            path="/info"
            icon="ℹ️"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;

// ──────────────────────────────────────────────────
// End of File: client/src/components/Dashboard.tsx
// ──────────────────────────────────────────────────

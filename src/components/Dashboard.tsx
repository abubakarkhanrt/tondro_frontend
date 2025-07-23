/**
 * ──────────────────────────────────────────────────
 * File: src/components/Dashboard.tsx
 * Description: Main dashboard with entity summaries for TondroAI CRM
 * Author: Muhammad Abubakar Khan
 * Created: 18-06-2025
 * Last Updated: 03-07-2025
 * ──────────────────────────────────────────────────
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { TestIds } from '../testIds';
import { apiHelpers } from '../services/api';
import type {
  OrganizationsResponse,
  ErrorResponse,
  PaginatedSubscriptionsResponse,
  Product,
  ProductsResponse,
} from '@/types';
import { handleAppLogout } from '@/services/apiErrorUtils';

// ────────────────────────────────────────
// Dashboard Types
// ────────────────────────────────────────

interface SummaryData {
  organizations: OrganizationsResponse | ErrorResponse | null;
  users: unknown | ErrorResponse | null;
  subscriptions: PaginatedSubscriptionsResponse | ErrorResponse | null;
  products: Product[] | ProductsResponse | ErrorResponse | null;
  root: unknown | ErrorResponse | null;
  health: unknown | ErrorResponse | null;
  status: unknown | ErrorResponse | null;
}

interface DashboardState {
  data: SummaryData;
  loading: boolean;
  error: string;
}

interface SummaryCardProps {
  title: string;
  data: SummaryData[keyof SummaryData];
  loading: boolean;
  color: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error';
  path: string;
  icon: string;
}

// ────────────────────────────────────────
// Main Component
// ────────────────────────────────────────

const Dashboard: React.FC = () => {
  const [summaryState, setSummaryState] = useState<DashboardState>({
    data: {
      organizations: null,
      users: null,
      subscriptions: null,
      products: null,
      root: null,
      health: null,
      status: null,
    },
    loading: true,
    error: '',
  });

  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchSummaryData();

    return () => {
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
    const controller = new AbortController();
    setAbortController(controller);

    setSummaryState(prev => ({ ...prev, loading: true, error: '' }));

    try {
      // Double-check token before making request
      const token = localStorage.getItem('access_token');
      if (!token || token === 'undefined' || token === 'null') {
        handleAppLogout(true);
      }

      // Fetch summary data for each entity type using component-specific services
      const [
        orgsData,
        usersData,
        subsData,
        productsData,
        rootData,
        healthData,
        statusData,
      ] = await Promise.all([
        apiHelpers
          .getOrganizations({}, controller.signal)
          .catch((err: Error) => ({ error: err.message })),
        apiHelpers
          .getUsers({}, controller.signal)
          .catch((err: Error) => ({ error: err.message })),
        apiHelpers
          .getSubscriptions({}, controller.signal)
          .catch((err: Error) => ({ error: err.message })),
        apiHelpers
          .getProducts(controller.signal)
          .catch((err: Error) => ({ error: err.message })),
        apiHelpers
          .getRoot(controller.signal)
          .catch((err: Error) => ({ error: err.message })),
        apiHelpers
          .getHealth(controller.signal)
          .catch((err: Error) => ({ error: err.message })),
        apiHelpers
          .getStatus(controller.signal)
          .catch((err: Error) => ({ error: err.message })),
      ]);

      setSummaryState(prev => ({
        ...prev,
        data: {
          organizations:
            'error' in orgsData ? { error: orgsData.error } : orgsData.data,
          users:
            'error' in usersData ? { error: usersData.error } : usersData.data,
          subscriptions:
            'error' in subsData
              ? { error: subsData.error }
              : Array.isArray(subsData.data)
                ? {
                    items: subsData.data,
                    total: subsData.data.length,
                    page: 1,
                    page_size: 100,
                    total_pages: 1,
                  }
                : subsData.data,
          products:
            'error' in productsData
              ? { error: productsData.error }
              : productsData.data,
          root: 'error' in rootData ? { error: rootData.error } : rootData.data,
          health:
            'error' in healthData
              ? { error: healthData.error }
              : healthData.data,
          status:
            'error' in statusData
              ? { error: statusData.error }
              : statusData.data,
        },
        loading: false,
      }));
    } catch (error: unknown) {
      // Don't show error for cancelled requests
      if (
        error &&
        typeof error === 'object' &&
        'name' in error &&
        error.name === 'AbortError'
      ) {
        return;
      }

      console.error('Error fetching summary data:', error);
      const apiError = error as { response?: { status: number } };
      let errorMessage = 'Failed to load dashboard data. Please try again.';
      if (apiError.response?.status === 401) {
        errorMessage = 'Authentication failed. Please login again.';
      }

      setSummaryState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
    } finally {
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
      if (data && typeof data === 'object' && 'error' in data) {
        isError = true;
        errorMessage = data.error as string;
      } else if (
        data &&
        typeof data === 'object' &&
        'count' in data &&
        typeof data.count === 'number'
      ) {
        count = data.count as number;
      } else if (
        data &&
        typeof data === 'object' &&
        'total' in data &&
        typeof data.total === 'number'
      ) {
        count = data.total as number;
      } else if (
        data &&
        typeof data === 'object' &&
        'data' in data &&
        data.data &&
        typeof data.data === 'object' &&
        'total' in data.data &&
        typeof data.data.total === 'number'
      ) {
        count = data.data.total;
      } else if (
        data &&
        typeof data === 'object' &&
        'data' in data &&
        Array.isArray(data.data)
      ) {
        count = data.data.length;
      } else if (Array.isArray(data)) {
        count = data.length;
      } else if (
        data &&
        typeof data === 'object' &&
        'items' in data &&
        Array.isArray(data.items)
      ) {
        count = data.items.length;
      } else if (
        data &&
        typeof data === 'object' &&
        'status' in data &&
        typeof data.status === 'string'
      ) {
        statusText = data.status;
      } else if (
        data &&
        typeof data === 'object' &&
        'data' in data &&
        data.data &&
        typeof data.data === 'object' &&
        'status' in data.data &&
        typeof data.data.status === 'string'
      ) {
        statusText = data.data.status;
      }
    }

    // Special handling for organizations API error
    const isOrganizationsError = title === 'Organizations' && isError;

    // Check if this card should show the View Details button
    const shouldShowViewDetails = ![
      'API Status',
      'Health Check',
      'Service Info',
    ].includes(title);

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

          {/* Conditionally render the View Details button */}
          {shouldShowViewDetails && (
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
          )}
        </CardContent>
      </Card>
    );
  };

  if (summaryState.loading) {
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

      {summaryState.error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          data-testid={TestIds.common.errorAlert}
        >
          {summaryState.error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Organizations"
            data={summaryState.data.organizations}
            loading={summaryState.loading}
            color="primary"
            path="/organizations"
            icon="🏢"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Users"
            data={summaryState.data.users}
            loading={summaryState.loading}
            color="secondary"
            path="/users"
            icon="👥"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Subscriptions"
            data={summaryState.data.subscriptions}
            loading={summaryState.loading}
            color="success"
            path="/subscriptions"
            icon="📋"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Products"
            data={summaryState.data.products}
            loading={summaryState.loading}
            color="info"
            path="/products"
            icon="📦"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <SummaryCard
            title="API Status"
            data={summaryState.data.status}
            loading={summaryState.loading}
            color="warning"
            path="/status"
            icon="🔌"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <SummaryCard
            title="Health Check"
            data={summaryState.data.health}
            loading={summaryState.loading}
            color="success"
            path="/health"
            icon="❤️"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <SummaryCard
            title="Service Info"
            data={summaryState.data.root}
            loading={summaryState.loading}
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

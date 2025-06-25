/**
 * ──────────────────────────────────────────────────
 * File: src/components/Dashboard.tsx
 * Description: Main dashboard with entity summaries for TondroAI CRM
 * Author: Muhammad Abubakar Khan
 * Created: 18-06-2025
 * Last Updated: 24-06-2025
 * ──────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback } from 'react';
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
import { TestIds } from '../testIds';
import {
  OrganizationsService,
  type OrganizationsResponse,
} from '../services/organizations';
import {
  UsersService,
  type PaginatedResponse as UsersPaginatedResponse,
  type User,
} from '../services/users';
import {
  SubscriptionsService,
  type PaginatedSubscriptionsResponse,
} from '../services/subscriptions';
import { ProductsService, type Product } from '../services/products';
import {
  HealthService,
  type HealthResponse,
  type StatusResponse,
} from '../services/health';
import { createAbortController } from '../lib/api-client';
import type { ErrorResponse } from '../types/shared';

// ────────────────────────────────────────
// Dashboard Types
// ────────────────────────────────────────

interface SummaryData {
  organizations: OrganizationsResponse | ErrorResponse | null;
  users: UsersPaginatedResponse<User> | ErrorResponse | null;
  subscriptions: PaginatedSubscriptionsResponse | ErrorResponse | null;
  products: Product[] | ErrorResponse | null;
  root: HealthResponse | ErrorResponse | null;
  health: HealthResponse | ErrorResponse | null;
  status: StatusResponse | ErrorResponse | null;
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

  const fetchSummaryData = useCallback(async (): Promise<void> => {
    // Cancel any existing request
    if (abortController) {
      abortController.abort();
    }

    // Create new abort controller
    const controller = createAbortController();
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

      // Fetch summary data for each entity type using component-specific services
      const orgsData = await OrganizationsService.getOrganizations(
        { page: 1, limit: 1 },
        controller.signal
      ).catch((err: Error) => ({ error: err.message }));
      const usersData = await UsersService.getUsers(
        { page: 1, page_size: 1 },
        controller.signal
      ).catch((err: Error) => ({ error: err.message }));
      const subsData = await SubscriptionsService.getSubscriptions(
        { page: 1, page_size: 1 },
        controller.signal
      ).catch((err: Error) => ({ error: err.message }));
      const productsData = await ProductsService.getProducts(
        controller.signal
      ).catch((err: Error) => ({ error: err.message }));

      // Fetch health check data through health service
      const rootData = await HealthService.getRoot(controller.signal).catch(
        (err: Error) => ({ error: err.message })
      );
      const healthData = await HealthService.getHealth(controller.signal).catch(
        (err: Error) => ({ error: err.message })
      );
      const statusData = await HealthService.getStatus(controller.signal).catch(
        (err: Error) => ({ error: err.message })
      );

      setSummaryData({
        organizations:
          'error' in orgsData ? { error: orgsData.error } : orgsData.data,
        users:
          'error' in usersData ? { error: usersData.error } : usersData.data,
        subscriptions:
          'error' in subsData ? { error: subsData.error } : subsData.data,
        products:
          'error' in productsData
            ? { error: productsData.error }
            : productsData.data,
        root: 'error' in rootData ? { error: rootData.error } : rootData.data,
        health:
          'error' in healthData ? { error: healthData.error } : healthData.data,
        status:
          'error' in statusData ? { error: statusData.error } : statusData.data,
      });
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
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { status: number } };
        if (apiError.response?.status === 401) {
          setError('Authentication failed. Please login again.');
        } else {
          setError('Failed to load dashboard data. Please try again.');
        }
      } else {
        setError('Failed to load dashboard data. Please try again.');
      }
    } finally {
      setLoading(false);
      setAbortController(null);
    }
  }, []);

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
      if ('error' in data) {
        isError = true;
        errorMessage = data.error;
      } else if ('count' in data && typeof data.count === 'number') {
        count = data.count;
      } else if ('total' in data && typeof data.total === 'number') {
        count = data.total;
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
      } else if ('status' in data && typeof data.status === 'string') {
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

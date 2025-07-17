/**
 * ──────────────────────────────────────────────────
 * File: pages/_app.tsx
 * Description: Next.js App component with global theme and message handling
 * Author: Muhammad Abubakar Khan
 * Created: 18-06-2025
 * Last Updated: 01-07-2025
 * ──────────────────────────────────────────────────
 */

import type { AppProps } from 'next/app';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Container,
  Alert,
  Snackbar,
} from '@mui/material';
import { useState, useEffect } from 'react';
import theme from '../src/theme';
import { TestIds } from '../src/testIds';
import { validateEnvironment } from '../src/utils/envValidation';
import Navigation from '../src/components/Navigation';
import ErrorBoundary from '../src/components/ErrorBoundary';

// Extend Window interface to include our custom properties
declare global {
  interface Window {
    showError: (message: string) => void;
    showSuccess: (message: string) => void;
  }
}

// Validate environment on app startup
if (typeof window !== 'undefined') {
  validateEnvironment();
}

export default function App({ Component, pageProps }: AppProps) {
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const showError = (message: string): void => {
    setError(message);
    setTimeout(() => setError(''), 10000);
  };

  const showSuccess = (message: string): void => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  useEffect(() => {
    window.showError = showError;
    window.showSuccess = showSuccess;
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <Box
          style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
          }}
        >
          <Navigation />
          <Container
            component="main"
            style={{ flexGrow: 1, paddingTop: 24, paddingBottom: 24 }}
          >
            <Component {...pageProps} />
          </Container>
        </Box>
        {/* Global Error/Success Messages */}
        <Snackbar
          open={!!error}
          autoHideDuration={10000}
          onClose={() => setError('')}
        >
          <Alert
            onClose={() => setError('')}
            severity="error"
            style={{ width: '100%' }}
            data-testid={TestIds.common.errorAlert}
          >
            {error}
          </Alert>
        </Snackbar>
        <Snackbar
          open={!!success}
          autoHideDuration={3000}
          onClose={() => setSuccess('')}
        >
          <Alert
            onClose={() => setSuccess('')}
            severity="success"
            style={{ width: '100%' }}
            data-testid={TestIds.common.successAlert}
          >
            {success}
          </Alert>
        </Snackbar>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

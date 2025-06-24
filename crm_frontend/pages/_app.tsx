import type { AppProps } from 'next/app';
import { ThemeProvider, CssBaseline, Box, Container, Alert, Snackbar } from '@mui/material';
import { useState, useEffect } from 'react';
import theme from '../src/theme';
import { TestIds } from '../src/testIds';
import { validateEnvironment } from '../src/config/env';
import Navigation from '../src/components/Navigation';

export default function App({ Component, pageProps }: AppProps) {
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const showError = (message: string): void => {
    setError(message);
    setTimeout(() => setError(''), 5000);
  };

  const showSuccess = (message: string): void => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  useEffect(() => {
    (window as any).showError = showError;
    (window as any).showSuccess = showSuccess;
    validateEnvironment();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navigation />
        <Container component="main" style={{ flexGrow: 1, paddingTop: 24, paddingBottom: 24 }}>
          <Component {...pageProps} />
        </Container>
      </Box>
      {/* Global Error/Success Messages */}
      <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError('')}>
        <Alert onClose={() => setError('')} severity="error" style={{ width: '100%' }} data-testid={TestIds.common.errorAlert}>
          {error}
        </Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess('')}>
        <Alert onClose={() => setSuccess('')} severity="success" style={{ width: '100%' }} data-testid={TestIds.common.successAlert}>
          {success}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
} 
/**
 * ──────────────────────────────────────────────────
 * File: client/src/components/ErrorBoundary.tsx
 * Description: Simple error boundary following Next.js documentation
 * Author: Muhammad Abubakar Khan
 * Created: 04-07-2025
 * Last Updated: 04-07-2025
 * ──────────────────────────────────────────────────
 */

import React from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';

interface ErrorBoundaryState {
  hasError: boolean;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // You can use your own error logging service here
    console.log({ error, errorInfo });
  }

  render(): React.ReactNode {
    // Check if the error is thrown
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            p: 3,
            textAlign: 'center',
          }}
        >
          <Alert severity="error" sx={{ mb: 2, maxWidth: 600 }}>
            <Typography variant="h6" gutterBottom>
              Oops, there is an error!
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Something went wrong. Please try again or refresh the page.
            </Typography>
            <Button
              variant="contained"
              onClick={() => this.setState({ hasError: false })}
              sx={{ mr: 1 }}
            >
              Try again?
            </Button>
            <Button
              variant="outlined"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </Alert>
        </Box>
      );
    }

    // Return children components in case of no error
    return this.props.children;
  }
}

export default ErrorBoundary;

// ──────────────────────────────────────────────────
// End of File: client/src/components/ErrorBoundary.tsx
// ────────────────────────────────────────────────── 
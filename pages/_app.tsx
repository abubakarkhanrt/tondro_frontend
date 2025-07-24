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
import { ThemeProvider, CssBaseline, Box, Container } from '@mui/material';
import theme from '../src/theme';
import { validateEnvironment } from '../src/utils/envValidation';
import Navigation from '../src/components/Navigation';
import ErrorBoundary from '../src/components/ErrorBoundary';
import { AuthProvider } from '../src/contexts/AuthContext';
import { AuthGuard } from '../src/components/AuthGuard';
import { AlertProvider } from '../src/contexts/AlertContext';

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

// Define which routes are public and don't need the AuthGuard.
const publicRoutes = ['/login', '/register', '/forgot-password', '/404'];

export default function App({ Component, pageProps, router }: AppProps) {
  // Check if the current route is public
  const isPublicRoute = publicRoutes.includes(router.pathname);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AlertProvider>
          <ErrorBoundary>
            {/* If it's a public route, just render the component. */}
            {/* Otherwise, wrap it in the AuthGuard. */}
            {isPublicRoute ? (
              <Component {...pageProps} />
            ) : (
              <AuthGuard>
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
              </AuthGuard>
            )}
          </ErrorBoundary>
        </AlertProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

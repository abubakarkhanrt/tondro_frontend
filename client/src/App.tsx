/**
 * ──────────────────────────────────────────────────
 * File: client/src/App.tsx
 * Description: Main React application with routing for TondroAI CRM
 * Author: Muhammad Abubakar Khan
 * Created: 18-06-2025
 * Last Updated: 23-06-2025
 * ──────────────────────────────────────────────────
 */

import React, { useState, useEffect, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Switch, Route, Redirect, useHistory } from 'react-router-dom';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Alert,
  Snackbar
} from '@mui/material';
import theme from './theme';
import { ENV_CONFIG, validateEnvironment } from './config/env';

// Import components
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Organizations from './components/Organizations';
import Users from './components/Users';
import Subscriptions from './components/Subscriptions';
import Products from './components/Products';
import AuditLog from './components/AuditLog';
import ReusableDemo from './components/ReusableDemo';

// Import context
import { UserRolesProvider } from './contexts/UserRolesContext';

// Import test IDs
import { TestIds } from './testIds';

// ────────────────────────────────────────
// Type Definitions
// ────────────────────────────────────────

interface ProtectedRouteProps {
  children: ReactNode;
}

interface MenuItem {
  text: string;
  path: string;
}

// ────────────────────────────────────────
// Protected Route Component
// ────────────────────────────────────────

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const token = localStorage.getItem('jwt_token');
  return token ? <>{children}</> : <Redirect to="/login" />;
};

// ────────────────────────────────────────
// Navigation Component
// ────────────────────────────────────────

const Navigation: React.FC = () => {
  const history = useHistory();
  const [, forceUpdate] = useState({});

  // Force re-render when token changes
  useEffect(() => {
    const checkToken = (): void => {
      forceUpdate({});
    };

    // Check token on mount and after a short delay
    checkToken();
    const timeoutId = setTimeout(checkToken, 100);

    // Listen for storage events
    window.addEventListener('storage', checkToken);
    
    // Also listen for custom logout events
    window.addEventListener('logout', checkToken);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('storage', checkToken);
      window.removeEventListener('logout', checkToken);
    };
  }, []);

  const handleLogout = (): void => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_email');
    
    // Force re-render of navigation
    forceUpdate({});
    
    // Dispatch storage event to notify other components
    window.dispatchEvent(new Event('storage'));
    
    // Dispatch custom logout event
    window.dispatchEvent(new Event('logout'));
    
    // Redirect to login
    history.push('/login');
  };

  const menuItems: MenuItem[] = [
    { text: 'Dashboard', path: '/dashboard' },
    { text: 'Organizations', path: '/organizations' },
    { text: 'Users', path: '/users' },
    { text: 'Subscriptions', path: '/subscriptions' },
    { text: 'Products', path: '/products' },
    { text: 'Audit Log', path: '/audit-log' },
  ];

  // Get token directly from localStorage on each render
  const token = localStorage.getItem('jwt_token');

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" style={{ flexGrow: 1 }}>
          TondroAI CRM
        </Typography>
        {token && (
          <>
            {menuItems.map((item) => (
              <Button
                key={item.path}
                color="inherit"
                onClick={() => history.push(item.path)}
                style={{ marginLeft: 8, marginRight: 8 }}
                data-testid={TestIds.navigation[item.path.slice(1) as keyof typeof TestIds.navigation]}
              >
                {item.text}
              </Button>
            ))}
            <Button 
              color="inherit" 
              onClick={handleLogout}
              data-testid={TestIds.navigation.logout}
            >
              Logout
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

// ────────────────────────────────────────
// Environment Validation
// ────────────────────────────────────────

// Validate environment on app startup
validateEnvironment();

// Log environment configuration in development
if (ENV_CONFIG.IS_DEVELOPMENT && ENV_CONFIG.DEBUG) {
  console.log('🚀 TondroAI CRM App Starting...');
  console.log('📊 Environment Configuration:', {
    API_BASE_URL: ENV_CONFIG.API_BASE_URL,
    NODE_ENV: ENV_CONFIG.NODE_ENV,
    DEBUG: ENV_CONFIG.DEBUG,
    ENABLE_AUDIT_LOG: ENV_CONFIG.ENABLE_AUDIT_LOG,
    ENABLE_DOMAIN_MANAGEMENT: ENV_CONFIG.ENABLE_DOMAIN_MANAGEMENT,
  });
}

// ────────────────────────────────────────
// Main App Component
// ────────────────────────────────────────

const App: React.FC = () => {
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

  // Make error/success handlers available globally
  (window as any).showError = showError;
  (window as any).showSuccess = showSuccess;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <UserRolesProvider>
          <Box style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navigation />
            <Container component="main" style={{ flexGrow: 1, paddingTop: 24, paddingBottom: 24 }}>
              <Switch>
                <Route path="/login" component={Login} />
                <Route path="/dashboard" render={() => (
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                )} />
                <Route path="/organizations" render={() => (
                  <ProtectedRoute>
                    <Organizations />
                  </ProtectedRoute>
                )} />
                <Route path="/users" render={() => (
                  <ProtectedRoute>
                    <Users />
                  </ProtectedRoute>
                )} />
                <Route path="/subscriptions" render={() => (
                  <ProtectedRoute>
                    <Subscriptions />
                  </ProtectedRoute>
                )} />
                <Route path="/products" render={() => (
                  <ProtectedRoute>
                    <Products />
                  </ProtectedRoute>
                )} />
                <Route path="/audit-log" render={() => (
                  <ProtectedRoute>
                    <AuditLog />
                  </ProtectedRoute>
                )} />
                <Route exact path="/" render={() => <Redirect to="/dashboard" />} />
                <Route render={() => <Redirect to="/dashboard" />} />
              </Switch>
            </Container>
          </Box>
          {/* Global Error/Success Messages */}
          <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError('')}>
            <Alert 
              onClose={() => setError('')} 
              severity="error" 
              style={{ width: '100%' }}
              data-testid={TestIds.common.errorAlert}
            >
              {error}
            </Alert>
          </Snackbar>
          <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess('')}>
            <Alert 
              onClose={() => setSuccess('')} 
              severity="success" 
              style={{ width: '100%' }}
              data-testid={TestIds.common.successAlert}
            >
              {success}
            </Alert>
          </Snackbar>
        </UserRolesProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

// Mount the app using React 18 createRoot API
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);

// ──────────────────────────────────────────────────
// End of File: client/src/App.tsx
// ────────────────────────────────────────────────── 
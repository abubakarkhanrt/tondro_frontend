/**
 * ──────────────────────────────────────────────────
 * File: client/src/components/Login.tsx
 * Description: Authentication component for TondroAI CRM
 * Author: Muhammad Abubakar Khan
 * Created: 18-06-2025
 * Last Updated: 20-06-2025
 * ──────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { apiHelpers } from '@/services/api';
import { TestIds } from '../testIds';

// ────────────────────────────────────────
// Type Definitions
// ────────────────────────────────────────

interface LoginFormData {
  username: string;
  password: string;
}

// ────────────────────────────────────────
// Main Component
// ────────────────────────────────────────

const Login: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: ''
  });
  const history = useHistory();
  const [forgotDialogOpen, setForgotDialogOpen] = useState<boolean>(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    // Validate form
    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Simulate login validation (you can add actual validation logic here)
      // For now, we'll just check if credentials are provided and then use mock token
      console.log('Login attempt with:', { username: formData.username, password: '***' });
      
      // Use the same mock token logic as the original button
      const response = await apiHelpers.getMockToken();
      localStorage.setItem('jwt_token', response.data.token);
      localStorage.setItem('user_email', formData.username); // Store the email for display
      (window as any).showSuccess?.(`Welcome, ${formData.username}!`);
      
      // Trigger a storage event to notify Navigation component
      window.dispatchEvent(new Event('storage'));
      
      history.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '80vh' 
    }}>
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            TondroAI CRM
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Sign in to access the CRM system
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {/* Login Form */}
          <Box component="form" onSubmit={handleFormSubmit}>
            <TextField
              fullWidth
              label="Username or Email"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              margin="normal"
              required
              disabled={loading}
              autoComplete="username"
              data-testid={TestIds.login.username}
            />
            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              margin="normal"
              required
              disabled={loading}
              autoComplete="current-password"
              data-testid={TestIds.login.password}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
              sx={{ mt: 3 }}
              data-testid={TestIds.login.submit}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </Box>
          <Box mt={2} textAlign="center">
            <Button 
              color="primary" 
              onClick={() => setForgotDialogOpen(true)}
              data-testid={TestIds.login.forgotCredentials}
            >
              Forgot username or password?
            </Button>
          </Box>
        </CardContent>
      </Card>
      <Dialog 
        open={forgotDialogOpen} 
        onClose={() => setForgotDialogOpen(false)}
        data-testid={TestIds.login.forgotDialog}
      >
        <DialogTitle>Forgot Credentials</DialogTitle>
        <DialogContent>
          <Typography>
            Please contact your administrator to reset your username or password.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setForgotDialogOpen(false)} 
            color="primary"
            data-testid={TestIds.login.forgotDialogClose}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Login;

// ──────────────────────────────────────────────────
// End of File: client/src/components/Login.tsx
// ────────────────────────────────────────────────── 
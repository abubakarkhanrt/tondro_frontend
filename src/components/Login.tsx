/**
 * ──────────────────────────────────────────────────
 * File: client/src/components/Login.tsx
 * Description: Authentication component for TondroAI CRM with MFA
 * Author: Muhammad Abubakar Khan
 * Created: 18-06-2025
 * Last Updated: 05-07-2025
 * ──────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import { useRouter } from 'next/router';
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
  DialogActions,
} from '@mui/material';
import { QRCodeCanvas as QRCode } from 'qrcode.react';
import { apiAuthHelpers } from '../services/authApi';
import { TestIds } from '../testIds';
import { useAuth } from '@/contexts/AuthContext';

// ────────────────────────────────────────
// Type Definitions
// ────────────────────────────────────────

interface LoginFormData {
  username: string;
  password: string;
}

type LoginStep = 'credentials' | 'mfa_setup' | 'mfa_verify';

interface MfaSetupData {
  secret_key: string;
  otp_uri: string;
}

// ────────────────────────────────────────
// Main Component
// ────────────────────────────────────────

const Login: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
  });
  const router = useRouter();
  const [forgotDialogOpen, setForgotDialogOpen] = useState<boolean>(false);
  const { setAppAccess } = useAuth();

  // State for MFA flow
  const [loginStep, setLoginStep] = useState<LoginStep>('credentials');
  const [mfaSetupData, setMfaSetupData] = useState<MfaSetupData | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSuccessfulLogin = (data: any): void => {
    // Store token and user info
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('token_type', data.token_type);
    localStorage.setItem('user', JSON.stringify(data.user));

    setAppAccess(data.user);

    (window as any).showSuccess?.(`Welcome, ${formData.username}!`);

    // Trigger a storage event to notify other components like Navigation
    window.dispatchEvent(new Event('storage'));

    router.push('/dashboard');
  };

  const handleFormSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();

    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const csrfResponse = await apiAuthHelpers.getCsrfToken();
      const token = csrfResponse.data?.csrf_token;
      if (!token) {
        setError('Failed to retrieve security token. Please try again.');
        setLoading(false);
        return;
      }
      setCsrfToken(token);

      const response = await apiAuthHelpers.login(
        {
          email: formData.username,
          password: formData.password,
        },
        undefined,
        { 'X-CSRF-Token': token }
      );

      const { mfa_enrollment_required, mfa_required, access_token, user } =
        response.data;

      // Scenario 3: No MFA required, direct login
      if (!mfa_enrollment_required && !mfa_required && access_token) {
        handleSuccessfulLogin(response.data);
        return;
      }

      const currentUserId = user?.id;
      if (!currentUserId) {
        setError('User ID not found. Cannot proceed with MFA.');
        setLoading(false);
        return;
      }
      setUserId(currentUserId);

      // Scenario 1: MFA enrollment is required
      if (mfa_enrollment_required) {
        const mfaResponse = await apiAuthHelpers.setupMfa(
          currentUserId,
          undefined,
          { 'X-CSRF-Token': token }
        );
        setMfaSetupData(mfaResponse.data);
        setLoginStep('mfa_setup');
      }
      // Scenario 2: MFA verification is required
      else if (mfa_required) {
        setLoginStep('mfa_verify');
      }
    } catch (error: unknown) {
      console.error('❌ Login error:', error);
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      const errorMessage =
        axiosError.response?.data?.message ||
        'Login failed. Please check your credentials and try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    if (!totpCode.trim() || !userId) {
      setError('Please enter the verification code.');
      return;
    }
    if (!csrfToken) {
      setError('CSRF token is missing. Please try logging in again.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');

    try {
      let response;
      const payload = {
        user_id: userId,
        totp_code: totpCode,
        device_id: 'webapp',
      };
      const headers = { 'X-CSRF-Token': csrfToken };

      if (loginStep === 'mfa_setup') {
        response = await apiAuthHelpers.verifyEnrollment(
          payload,
          undefined,
          headers
        );
      } else {
        response = await apiAuthHelpers.verifyMFA(payload, undefined, headers);
      }

      handleSuccessfulLogin(response.data);
    } catch (error: unknown) {
      console.error('❌ MFA verification error:', error);
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      const errorMessage =
        axiosError.response?.data?.message ||
        'MFA verification failed. Please check the code and try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ────────────────────────────────────────
  // Render Functions for Login Steps
  // ────────────────────────────────────────

  const renderCredentialsForm = () => (
    <>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        TondroAI CRM
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        align="center"
        sx={{ mb: 3 }}
      >
        Sign in to access the CRM system
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Box component="form" onSubmit={handleFormSubmit}>
        <TextField
          fullWidth
          label="Username"
          name="username"
          value={formData.username}
          onChange={handleInputChange}
          margin="normal"
          disabled={loading}
          autoComplete="username"
          data-testid={TestIds.login.username}
          inputProps={{
            'data-testid': TestIds.login.username,
            'aria-label': 'Username input',
          }}
        />
        <TextField
          fullWidth
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleInputChange}
          margin="normal"
          disabled={loading}
          autoComplete="current-password"
          data-testid={TestIds.login.password}
          inputProps={{
            'data-testid': TestIds.login.password,
            'aria-label': 'Password input',
          }}
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
    </>
  );

  const renderMfaSetupForm = () => (
    <>
      <Typography variant="h5" component="h1" gutterBottom align="center">
        Set Up Multi-Factor Authentication
      </Typography>
      <Typography variant="body1" align="center" sx={{ mb: 2 }}>
        Scan the QR code with your authenticator app (e.g., Google
        Authenticator), then enter the 6-digit code below to verify.
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {mfaSetupData?.otp_uri && (
        <Box textAlign="center" my={2} data-testid={TestIds.mfa.setupQrCode}>
          <QRCode value={mfaSetupData.otp_uri} size={180} />
          <Typography variant="caption" display="block" mt={1}>
            Can&apos;t scan? Enter this key manually:
            <br />
            <strong>{mfaSetupData.secret_key}</strong>
          </Typography>
        </Box>
      )}
      <Box component="form" onSubmit={handleMfaSubmit}>
        <TextField
          fullWidth
          label="Verification Code"
          value={totpCode}
          onChange={e => setTotpCode(e.target.value)}
          margin="normal"
          disabled={loading}
          autoFocus
          inputProps={{ 'data-testid': TestIds.mfa.setupOtpInput }}
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
          sx={{ mt: 2 }}
          data-testid={TestIds.mfa.setupSubmit}
        >
          {loading ? 'Verifying...' : 'Verify & Complete Setup'}
        </Button>
      </Box>
    </>
  );

  const renderMfaVerifyForm = () => (
    <>
      <Typography variant="h5" component="h1" gutterBottom align="center">
        Two-Factor Verification
      </Typography>
      <Typography variant="body1" align="center" sx={{ mb: 2 }}>
        Enter the 6-digit code from your authenticator app to continue.
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Box component="form" onSubmit={handleMfaSubmit}>
        <TextField
          fullWidth
          label="Verification Code"
          value={totpCode}
          onChange={e => setTotpCode(e.target.value)}
          margin="normal"
          disabled={loading}
          autoFocus
          inputProps={{ 'data-testid': TestIds.mfa.verifyOtpInput }}
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
          sx={{ mt: 2 }}
          data-testid={TestIds.mfa.verifySubmit}
        >
          {loading ? 'Verifying...' : 'Submit'}
        </Button>
      </Box>
    </>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%', overflow: 'hidden' }}>
        <CardContent sx={{ p: 4 }}>
          {loginStep === 'credentials' && renderCredentialsForm()}
          {loginStep === 'mfa_setup' && renderMfaSetupForm()}
          {loginStep === 'mfa_verify' && renderMfaVerifyForm()}
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
            Please contact your administrator to reset your username or
            password.
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

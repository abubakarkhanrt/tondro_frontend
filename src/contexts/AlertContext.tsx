/**
 * ──────────────────────────────────────────────────
 * File: src/contexts/AlertContext.tsx
 * Description: Provides a global context for displaying Snackbar alerts.
 * Author: Muhammad Abubakar Khan
 * Created: 03-07-2024
 * Last Updated: 03-07-2024
 * ──────────────────────────────────────────────────
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { Snackbar, Alert } from '@mui/material';
import type { AlertColor } from '@mui/material';
import { TestIds } from '@/testIds';

// ────────────────────────────────────────
// Types
// ────────────────────────────────────────
interface AlertState {
  message: string;
  severity: AlertColor;
}

interface AlertContextType {
  showAlert: (message: string, severity?: AlertColor) => void;
}

// ────────────────────────────────────────
// Context Definition
// ────────────────────────────────────────
const AlertContext = createContext<AlertContextType | undefined>(undefined);

// ────────────────────────────────────────
// Provider Component
// ────────────────────────────────────────
interface AlertProviderProps {
  children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [alertState, setAlertState] = useState<AlertState>({
    message: '',
    severity: 'info',
  });

  const handleClose = (
    _event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  const showAlert = useCallback(
    (message: string, severity: AlertColor = 'success') => {
      setAlertState({ message, severity });
      setOpen(true);
    },
    []
  );

  const contextValue = {
    showAlert,
  };

  return (
    <AlertContext.Provider value={contextValue}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={alertState.severity === 'error' ? 7000 : 4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ mt: 5, mb: 3 }}
      >
        <Alert
          onClose={handleClose}
          severity={alertState.severity}
          variant="filled"
          sx={{ width: '100%' }}
          data-testid={
            alertState.severity === 'error'
              ? TestIds.common.errorAlert
              : TestIds.common.successAlert
          }
        >
          {alertState.message}
        </Alert>
      </Snackbar>
    </AlertContext.Provider>
  );
};

// ────────────────────────────────────────
// Custom Hook
// ────────────────────────────────────────
export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

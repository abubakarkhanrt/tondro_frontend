/**
 * ──────────────────────────────────────────────────
 * File: client/src/theme.ts
 * Description: Material-UI theme configuration for TondroAI CRM
 * Author: Muhammad Abubakar Khan
 * Created: 18-06-2025
 * Last Updated: 20-06-2025
 * ──────────────────────────────────────────────────
 */

import { createTheme, Theme } from '@mui/material/styles';

// Extend the palette to include status colors
declare module '@mui/material/styles' {
  interface Palette {
    status: {
      active: string;
      inactive: string;
      pending: string;
      cancelled: string;
      expired: string;
      trial: string;
      invited: string;
      suspended: string;
    };
  }
  interface PaletteOptions {
    status?: {
      active?: string;
      inactive?: string;
      pending?: string;
      cancelled?: string;
      expired?: string;
      trial?: string;
      invited?: string;
      suspended?: string;
    };
  }
}

const theme: Theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    status: {
      active: '#43a047',    // green
      inactive: '#e53935',  // red
      pending: '#fbc02d',   // yellow
      cancelled: '#e53935', // red
      expired: '#e53935',   // red
      trial: '#1e88e5',     // blue
      invited: '#fbc02d',   // yellow
      suspended: '#ff9800', // orange
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 300,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 300,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 400,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 400,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 400,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.43,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  spacing: 8,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#f5f5f5',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
        },
      },
    },
  },
});

// Helper to get status color from theme
export const getStatusColor = (theme: Theme, status: string): 'primary' | 'secondary' | 'default' | 'error' | 'info' | 'success' | 'warning' => {
  const key = status.toLowerCase();
  
  switch (key) {
    case 'active':
      return 'success';
    case 'inactive':
    case 'cancelled':
    case 'expired':
      return 'error';
    case 'pending':
    case 'invited':
      return 'warning';
    case 'trial':
      return 'info';
    case 'suspended':
      return 'warning';
    default:
      return 'default';
  }
};

// Helper to get hex color for background styling
export const getStatusBackgroundColor = (theme: Theme, status: string): string => {
  const key = status.toLowerCase();
  
  switch (key) {
    case 'active':
      return '#43a047';    // green
    case 'inactive':
    case 'cancelled':
    case 'expired':
      return '#e53935';    // red
    case 'pending':
    case 'invited':
      return '#fbc02d';    // yellow
    case 'trial':
      return '#1e88e5';    // blue
    case 'suspended':
      return '#ff9800';    // orange
    default:
      return '#757575';    // gray
  }
};

export default theme;

// ──────────────────────────────────────────────────
// End of File: client/src/theme.ts
// ────────────────────────────────────────────────── 
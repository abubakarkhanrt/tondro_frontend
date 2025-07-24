/**
 * ──────────────────────────────────────────────────
 * File: src/components/FullPageLoader.tsx
 * Description: A full-page loading indicator with a professional look.
 * Author: Muhammad Abubakar Khan
 * Created: 26-07-2024
 * Last Updated: 26-07-2024
 * ──────────────────────────────────────────────────
 */
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * Renders a full-page centered circular loading indicator with a message.
 * It's designed to provide a good user experience during page transitions
 * or data fetching.
 * @returns {JSX.Element} A Box component containing a CircularProgress indicator.
 */
const FullPageLoader = (): JSX.Element => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: 'background.default',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: theme => theme.zIndex.modal + 1,
      }}
    >
      <CircularProgress size={60} thickness={4} />
      <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
        Loading...
      </Typography>
    </Box>
  );
};

export default FullPageLoader;

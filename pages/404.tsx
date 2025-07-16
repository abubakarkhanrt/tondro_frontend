/**
 * ──────────────────────────────────────────────────
 * File: pages/404.tsx
 * Description: Enterprise interactive 404 page for Next.js
 * Author: Muhammad Abubakar Khan
 * Created: 04-07-2025
 * Last Updated: 04-07-2025
 * ──────────────────────────────────────────────────
 */

import { Box, Typography, Button, Stack, Paper } from '@mui/material';
import { useRouter } from 'next/router';

export default function Custom404() {
  const router = useRouter();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: { xs: 2, sm: 4 },
          maxWidth: 480,
          width: '100%',
          textAlign: 'center',
        }}
      >
        {/* Warning Sign SVG Illustration */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
          <svg
            width="120"
            height="120"
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <g>
              <polygon
                points="60,28 100,92 20,92"
                fill="#FFB300"
                stroke="#FFA000"
                strokeWidth="2"
              />
              <rect x="56" y="50" width="8" height="24" rx="4" fill="#fff" />
              <rect x="56" y="80" width="8" height="8" rx="4" fill="#fff" />
            </g>
          </svg>
        </Box>
        <Typography variant="h3" fontWeight={700} color="primary" gutterBottom>
          404
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Sorry, the page you&apos;re looking for doesn&apos;t exist.
        </Typography>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          justifyContent="center"
          sx={{ mb: 2 }}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={() => router.push('/')}
          >
            Home
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => router.back()}
          >
            Go Back
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

// ──────────────────────────────────────────────────
// End of File: pages/404.tsx
// ──────────────────────────────────────────────────

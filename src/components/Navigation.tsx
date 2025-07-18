import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { apiAuthHelpers } from '../services/authApi';
import { TestIds } from '../testIds';
import { handleAppLogout } from '../services/api';

interface MenuItem {
  text: string;
  path: string;
}

const Navigation: React.FC = () => {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const checkToken = () => {
      const storedToken = localStorage.getItem('access_token');
      setToken(storedToken);
    };

    // Check the token immediately on mount
    checkToken();

    // Set up listeners to re-check when storage or a logout event occurs.
    // This replaces the need for `forceUpdate`.
    window.addEventListener('storage', checkToken);
    window.addEventListener('logout', checkToken);

    // Cleanup function to remove listeners
    return () => {
      window.removeEventListener('storage', checkToken);
      window.removeEventListener('logout', checkToken);
    };
  }, []); // Empty dependency array ensures this setup runs only once on mount

  const handleLogout = async (): Promise<void> => {
    try {
      const accessToken = localStorage.getItem('access_token');
      const tokenType = localStorage.getItem('token_type') || 'Bearer';
      await apiAuthHelpers.logout(undefined, {
        Authorization: `${tokenType} ${accessToken}`,
      });
    } catch (error) {
      console.error('Logout failed:', error);
      // NOTE: Even if the server-side logout fails, we proceed with client-side cleanup
      // to ensure the user is logged out of the application interface.
    } finally {
      handleAppLogout();

      router.push('/login');
    }
  };

  const menuItems: MenuItem[] = [
    { text: 'Dashboard', path: '/dashboard' },
    { text: 'Organizations', path: '/organizations' },
    { text: 'Users', path: '/users' },
    { text: 'Subscriptions', path: '/subscriptions' },
    { text: 'Products', path: '/products' },
    { text: 'Transcripts', path: '/transcripts' },
    { text: 'Jobs', path: '/jobs' },
    { text: 'Audit Log', path: '/audit-log' },
  ];

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" style={{ flexGrow: 1 }}>
          TondroAI CRM
        </Typography>
        {token && (
          <>
            {menuItems.map(item => (
              <Button
                key={item.path}
                color="inherit"
                onClick={() => router.push(item.path)}
                style={{ marginLeft: 8, marginRight: 8 }}
                data-testid={
                  TestIds.navigation[
                    item.path.slice(1) as keyof typeof TestIds.navigation
                  ]
                }
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

export default Navigation;

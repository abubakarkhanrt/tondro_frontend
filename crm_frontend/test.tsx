import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { TestIds } from '../testIds';

interface MenuItem {
  text: string;
  path: string;
}

const Navigation: React.FC = () => {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Mark as client-side rendered
    setIsClient(true);
    
    const checkToken = (): void => {
      const currentToken = localStorage.getItem('jwt_token');
      setToken(currentToken);
    };
    
    checkToken();
    const timeoutId = setTimeout(checkToken, 100);
    window.addEventListener('storage', checkToken);
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
    setToken(null);
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('logout'));
    router.push('/login');
  };

  const menuItems: MenuItem[] = [
    { text: 'Dashboard', path: '/dashboard' },
    { text: 'Organizations', path: '/organizations' },
    { text: 'Users', path: '/users' },
    { text: 'Subscriptions', path: '/subscriptions' },
    { text: 'Products', path: '/products' },
    { text: 'Audit Log', path: '/audit-log' },
  ];

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" style={{ flexGrow: 1 }}>
          TondroAI CRM
        </Typography>
        {isClient && token && (
          <>
            {menuItems.map((item) => (
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
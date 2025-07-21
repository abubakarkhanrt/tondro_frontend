import React, { useState } from 'react';
import { useRouter } from 'next/router';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Box,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Logout as LogoutIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
} from '@mui/icons-material';
import { TestIds } from '../testIds';
import { useAuth } from '../contexts/AuthContext';

interface MenuItemData {
  text: string;
  path: string;
}

const Navigation: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
  };

  const menuItems: MenuItemData[] = [
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
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          TondroAI CRM
        </Typography>
        {user && (
          <>
            {menuItems.map(item => (
              <Button
                key={item.path}
                color="inherit"
                onClick={() => router.push(item.path)}
                sx={{ mx: 1 }}
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
              onClick={handleMenu}
              color="inherit"
              sx={{ textTransform: 'none', p: 0.5, ml: 1 }}
              data-testid={TestIds.navigation.userMenu}
              aria-controls={open ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
            >
              <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                {user.first_name
                  ? user.first_name.charAt(0).toUpperCase()
                  : user.email.charAt(0).toUpperCase()}
              </Avatar>
              <Box
                sx={{
                  ml: 1.5,
                  display: { xs: 'none', sm: 'flex' },
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ lineHeight: 1.2, fontWeight: 'bold' }}
                >
                  {`${user.first_name || ''} ${user.last_name || ''}`.trim()}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    lineHeight: 1.2,
                    textTransform: 'capitalize',
                    color: 'rgba(255, 255, 255, 0.8)',
                  }}
                >
                  {user.role.replace('_', ' ')}
                </Typography>
              </Box>
              <KeyboardArrowDownIcon sx={{ ml: 0.5, color: 'white' }} />
            </Button>
            <Menu
              id="account-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography sx={{ fontWeight: 'bold' }}>
                  {`${user.first_name || ''} ${user.last_name || ''}`.trim()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user.email}
                </Typography>
              </Box>
              <Divider sx={{ my: 0.5 }} />
              <MenuItem
                onClick={handleLogout}
                data-testid={TestIds.navigation.logout}
              >
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Logout</ListItemText>
              </MenuItem>
            </Menu>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;

/**
 * ──────────────────────────────────────────────────
 * File: src/contexts/AuthContext.tsx
 * Description: Context for managing user authentication, roles, and permissions.
 * Author: Muhammad Abubakar Khan
 * Created: 29-07-2024
 * Last Updated: 29-07-2024
 * ──────────────────────────────────────────────────
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
  useEffect,
} from 'react';
import { useRouter } from 'next/router';
import { getPermissionsForRole, PERMISSIONS } from '../config/roles';
import { type User } from '../types';
import { apiAuthHelpers } from '../services/authApi';
import { handleAppLogout } from '@/services/api';

// Infer the Permission type from the PERMISSIONS object
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  permissions: Permission[];
  hasPermission: (permission: Permission) => boolean;
  logout: () => void;
  loading: boolean;
  setAppAccess: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  const logoutApi = useCallback(async () => {
    const accessToken = localStorage.getItem('access_token');
    const tokenType = localStorage.getItem('token_type') || 'Bearer';
    await apiAuthHelpers.logout(undefined, {
      Authorization: `${tokenType} ${accessToken}`,
    });
  }, []);

  const handleLogout = useCallback(async () => {
    logoutApi();
    handleAppLogout(false);
    setUser(null);
    setPermissions([]);
    if (router.pathname !== '/login') {
      router.push('/login');
    }
    // Notify other tabs/windows to log out
    window.dispatchEvent(new Event('storage'));
  }, [router]);

  const setAppAccess = useCallback((_user: User) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');

      if (_user && token) {
        setUser(_user);
        // Default to a safe, minimal role if not specified
        const userRole = _user.role || 'READ_ONLY_USER';
        const userPermissions = getPermissionsForRole(userRole);
        setPermissions(userPermissions);
      }
    } catch (e) {
      console.error('Failed to initialize auth state from storage:', e);
      // Clear corrupted storage
      handleLogout();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setAppAccess(parsedUser);
    } else {
      setLoading(false);
    }
  }, []);

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      return permissions.includes(permission);
    },
    [permissions]
  );

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    permissions,
    hasPermission,
    logout: handleLogout,
    loading,
    setAppAccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

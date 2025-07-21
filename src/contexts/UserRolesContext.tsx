/**
 * ──────────────────────────────────────────────────
 * File: client/src/contexts/UserRolesContext.tsx
 * Description: Context for managing user roles globally
 * Author: Muhammad Abubakar Khan
 * Created: 18-06-2025
 * Last Updated: 20-06-2025
 * ──────────────────────────────────────────────────
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { apiHelpers } from '../services/api';

interface UserRolesContextType {
  userRoles: string[];
  loading: boolean;
  error: string | null;
  refreshUserRoles: () => Promise<void>;
}

const UserRolesContext = createContext<UserRolesContextType | undefined>(
  undefined
);

interface UserRolesProviderProps {
  children: ReactNode;
}

export const UserRolesProvider: React.FC<UserRolesProviderProps> = ({
  children,
}) => {
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRoles = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiHelpers.getUserRoles();
      setUserRoles(response.data.roles || []);
    } catch (err: unknown) {
      console.error('Error fetching user roles:', err);
      const errorMessage =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'message' in err.response.data &&
        typeof err.response.data.message === 'string'
          ? err.response.data.message
          : 'Failed to fetch user roles';
      setError(errorMessage);
      // Set default roles as fallback
      setUserRoles(['Global Admin', 'Tenant Admin']);
    } finally {
      setLoading(false);
    }
  };

  const refreshUserRoles = async (): Promise<void> => {
    await fetchUserRoles();
  };

  useEffect(() => {
    fetchUserRoles();
  }, []);

  const value: UserRolesContextType = {
    userRoles,
    loading,
    error,
    refreshUserRoles,
  };

  return (
    <UserRolesContext.Provider value={value}>
      {children}
    </UserRolesContext.Provider>
  );
};

export const useUserRoles = (): UserRolesContextType => {
  const context = useContext(UserRolesContext);
  if (context === undefined) {
    throw new Error('useUserRoles must be used within a UserRolesProvider');
  }
  return context;
};

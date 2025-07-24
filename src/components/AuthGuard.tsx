/**
 * ──────────────────────────────────────────────────
 * File: src/components/AuthGuard.tsx
 * Description: Protects routes from unauthenticated access using the global AuthContext.
 * Author: Muhammad Abubakar Khan
 * Created: 26-07-2024
 * Last Updated: 26-07-2024
 * ──────────────────────────────────────────────────
 */

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import FullPageLoader from './FullPageLoader';

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * A component that guards routes, redirecting unauthenticated users.
 * It uses the global `useAuth` context to determine the auth state.
 * @param {AuthGuardProps} props The component props.
 * @returns {ReactNode} The children if authenticated, or a loader.
 */
export const AuthGuard = ({ children }: AuthGuardProps): ReactNode => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until the loading is finished before checking authentication.
    if (!loading && !isAuthenticated) {
      // Store the attempted URL to redirect back after login
      localStorage.setItem('redirectAfterLogin', router.asPath);
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  // While the auth state is being determined, show a full-page loader.
  // This is the key to preventing a flicker of protected content.
  if (loading || !isAuthenticated) {
    return <FullPageLoader />;
  }

  // If loading is finished and user is authenticated, render the children.
  return <>{children}</>;
};

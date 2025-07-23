import { useEffect } from 'react';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const router = useRouter();
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [token, router]);

  if (!token) {
    return null;
  }

  // TODO: Implement protected route middleware

  return <>{children}</>;
};

export default ProtectedRoute;

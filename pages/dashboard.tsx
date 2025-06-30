import ProtectedRoute from '../src/components/ProtectedRoute';
import Dashboard from '../src/components/Dashboard';
import { UserRolesProvider } from '../src/contexts/UserRolesContext';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <UserRolesProvider>
        <Dashboard />
      </UserRolesProvider>
    </ProtectedRoute>
  );
} 
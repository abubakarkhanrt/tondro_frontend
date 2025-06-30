import ProtectedRoute from '../src/components/ProtectedRoute';
import Users from '../src/components/Users';
import { UserRolesProvider } from '../src/contexts/UserRolesContext';

export default function UsersPage() {
  return (
    <ProtectedRoute>
      <UserRolesProvider>
        <Users />
      </UserRolesProvider>
    </ProtectedRoute>
  );
} 
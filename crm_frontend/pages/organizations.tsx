import ProtectedRoute from '../src/components/ProtectedRoute';
import Organizations from '../src/components/Organizations';
import { UserRolesProvider } from '../src/contexts/UserRolesContext';

export default function OrganizationsPage() {
  return (
    <ProtectedRoute>
      <UserRolesProvider>
        <Organizations />
      </UserRolesProvider>
    </ProtectedRoute>
  );
} 
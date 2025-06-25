import ProtectedRoute from '../src/components/ProtectedRoute';
import AuditLog from '../src/components/AuditLog';
import { UserRolesProvider } from '../src/contexts/UserRolesContext';

export default function AuditLogPage() {
  return (
    <ProtectedRoute>
      <UserRolesProvider>
        <AuditLog />
      </UserRolesProvider>
    </ProtectedRoute>
  );
} 
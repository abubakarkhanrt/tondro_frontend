import ProtectedRoute from '../src/components/ProtectedRoute';
import AuditLog from '../src/components/AuditLog';

export default function AuditLogPage() {
  return (
    <ProtectedRoute>
        <AuditLog />      
    </ProtectedRoute>
  );
} 
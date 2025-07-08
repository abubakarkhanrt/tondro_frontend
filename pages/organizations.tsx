import ProtectedRoute from '../src/components/ProtectedRoute';
import Organizations from '../src/components/Organizations';

export default function OrganizationsPage() {
  return (
    <ProtectedRoute>      
        <Organizations />      
    </ProtectedRoute>
  );
} 
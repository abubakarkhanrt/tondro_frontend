import ProtectedRoute from '../src/components/ProtectedRoute';
import Products from '../src/components/Products';
import { UserRolesProvider } from '../src/contexts/UserRolesContext';

export default function ProductsPage() {
  return (
    <ProtectedRoute>
      <UserRolesProvider>
        <Products />
      </UserRolesProvider>
    </ProtectedRoute>
  );
} 
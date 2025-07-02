import ProtectedRoute from '../src/components/ProtectedRoute';
import Products from '../src/components/Products';

export default function ProductsPage() {
  return (
    <ProtectedRoute>
      <Products />
    </ProtectedRoute>
  );
} 
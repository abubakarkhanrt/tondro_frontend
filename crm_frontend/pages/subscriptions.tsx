import ProtectedRoute from '../src/components/ProtectedRoute';
import Subscriptions from '../src/components/Subscriptions';
import { UserRolesProvider } from '../src/contexts/UserRolesContext';

export default function SubscriptionsPage() {
  return (
    <ProtectedRoute>
      <UserRolesProvider>
        <Subscriptions />
      </UserRolesProvider>
    </ProtectedRoute>
  );
} 
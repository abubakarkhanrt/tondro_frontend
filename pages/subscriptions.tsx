import ProtectedRoute from '../src/components/ProtectedRoute';
import Subscriptions from '../src/components/Subscriptions';

export default function SubscriptionsPage() {
  return (
    <ProtectedRoute>      
        <Subscriptions />      
    </ProtectedRoute>
  );
} 
import { Jobs } from '../src/components/Jobs';
import ProtectedRoute from '../src/components/ProtectedRoute';

const JobsPage = () => {
  return (
    <ProtectedRoute>
      <Jobs />
    </ProtectedRoute>
  );
};

export default JobsPage; 
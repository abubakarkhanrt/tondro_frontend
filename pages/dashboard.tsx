import Dashboard from '../src/components/Dashboard';

export default function DashboardPage() {
  // No wrapper needed! The auth protection is now handled globally in _app.tsx.
  return <Dashboard />;
}

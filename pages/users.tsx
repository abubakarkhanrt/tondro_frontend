import Users from '../src/components/Users';
import { UserRolesProvider } from '../src/contexts/UserRolesContext';

export default function UsersPage() {
  return (
    <UserRolesProvider>
      <Users />
    </UserRolesProvider>
  );
}

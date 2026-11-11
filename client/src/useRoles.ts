import { useAuth0 } from '@auth0/auth0-react';

// Roles come from a custom claim set by an Auth0 Action. The server enforces them too;
// this only controls what the UI shows.
const ROLES_CLAIM = import.meta.env.VITE_AUTH0_ROLES_CLAIM ?? 'https://vitaltrack.app/roles';

export function useRoles() {
  const { user } = useAuth0();
  const roles = ((user?.[ROLES_CLAIM] as string[] | undefined) ?? []);
  const isAdmin = roles.includes('medical_admin');
  return {
    roles,
    isAdmin,
    roleLabel: isAdmin ? 'Medical Administrator' : roles.includes('data_entry') ? 'Data Entry' : 'No role',
  };
}

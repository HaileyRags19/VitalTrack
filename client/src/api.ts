import { useAuth0 } from '@auth0/auth0-react';
import { useCallback } from 'react';

export interface Patient {
  patient_id: number;
  first_name: string;
  last_name: string;
  dob: string;
  medical_history: string | null;
  updated_at: string;
}

export interface AuditRow {
  audit_id: number;
  action_type: 'VIEW' | 'INSERT' | 'UPDATE' | 'DELETE';
  patient_id: number;
  performed_by: string;
  changed_at: string;
  old_data: unknown;
  new_data: unknown;
}

// Returns a fetch wrapper that attaches the Auth0 access token.
export function useApi() {
  const { getAccessTokenSilently } = useAuth0();
  return useCallback(
    async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
      const token = await getAccessTokenSilently();
      const res = await fetch(`/api${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...(init.headers ?? {}),
        },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ? JSON.stringify(body.error) : `Request failed (${res.status})`);
      }
      return res.status === 204 ? (undefined as T) : res.json();
    },
    [getAccessTokenSilently],
  );
}

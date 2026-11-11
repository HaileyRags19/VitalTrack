import { useAuth0 } from '@auth0/auth0-react';
import { useState } from 'react';
import { PatientsPage } from './pages/PatientsPage';
import { AuditPage } from './pages/AuditPage';
import { useRoles } from './useRoles';

export default function App() {
  const { isAuthenticated, isLoading, loginWithRedirect, logout, user } = useAuth0();
  const { isAdmin, roleLabel } = useRoles();
  const [view, setView] = useState<'patients' | 'audit'>('patients');

  if (isLoading) return <p className="center">Loading…</p>;

  if (!isAuthenticated) {
    return (
      <main className="login">
        <h1>VitalTrack</h1>
        <p>Secure patient records with a full audit trail.</p>
        <button onClick={() => loginWithRedirect()}>Log in</button>
      </main>
    );
  }

  return (
    <div className="app">
      <header>
        <strong>VitalTrack</strong>
        <nav>
          <button className={view === 'patients' ? 'active' : ''} onClick={() => setView('patients')}>
            Patients
          </button>
          {isAdmin && (
            <button className={view === 'audit' ? 'active' : ''} onClick={() => setView('audit')}>
              Audit trail
            </button>
          )}
        </nav>
        <span className="who">
          {user?.email} · {roleLabel}
          <button className="ghost" onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>
            Log out
          </button>
        </span>
      </header>
      <main>{view === 'audit' && isAdmin ? <AuditPage /> : <PatientsPage canDelete={isAdmin} />}</main>
    </div>
  );
}

import React from 'react';
import { createRoot } from 'react-dom/client';
import { AuditDashboard } from '../AuditDashboard';

const token = import.meta.env.VITE_AUTH_TOKEN || '';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuditDashboard token={token} />
  </React.StrictMode>
);
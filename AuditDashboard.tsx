import React, { useState, useEffect } from 'react';

interface AuditLog {
  audit_id: number;
  action_type: string;
  patient_id: number;
  changed_at: string;
  new_data: any;
}

export const AuditDashboard: React.FC<{ token: string }> = ({ token }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const fetchAuditLogs = async () => {
    if (!token.trim()) {
      setError('No Auth0 token configured');
      setLoading(false);
      return;
    }

    try {
      setError('');
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/audit-logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error(`API request failed (${response.status})`);
      }
      const data: AuditLog[] = await response.json();
      setLogs(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load audit logs';
      console.error('Error loading audit logs:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [token]);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>VitalTrack Forensic Audit Log</h2>
      {loading ? (
        <p>Loading audit state...</p>
      ) : error ? (
        <p role="alert">{error}. Check that the API is running and a valid Auth0 token is configured.</p>
      ) : (
        <table border={1} cellPadding={10} style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr style={{ background: '#f4f4f4' }}>
              <th>Audit ID</th>
              <th>Action</th>
              <th>Patient ID</th>
              <th>Timestamp</th>
              <th>Captured Payload</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.audit_id}>
                <td>{log.audit_id}</td>
                <td style={{ color: log.action_type === 'DELETE' ? 'red' : 'green', fontWeight: 'bold' }}>
                  {log.action_type}
                </td>
                <td>{log.patient_id}</td>
                <td>{new Date(log.changed_at).toLocaleString()}</td>
                <td><pre>{JSON.stringify(log.new_data || {}, null, 2)}</pre></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
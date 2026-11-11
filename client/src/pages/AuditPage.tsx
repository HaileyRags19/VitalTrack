import { useEffect, useState } from 'react';
import { useApi, type AuditRow } from '../api';

export function AuditPage() {
  const api = useApi();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [patientId, setPatientId] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      const qs = patientId ? `?patient_id=${encodeURIComponent(patientId)}` : '';
      setRows(await api<AuditRow[]>(`/audit-logs${qs}`));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section>
      <h2>Audit trail</h2>
      <p className="muted">Append-only record of every view, create, edit and delete.</p>
      <form className="filters" onSubmit={(e) => { e.preventDefault(); load(); }}>
        <input placeholder="Filter by patient ID" inputMode="numeric" value={patientId} onChange={(e) => setPatientId(e.target.value)} />
        <button type="submit">Apply</button>
      </form>
      {error && <p className="error">{error}</p>}
      <table>
        <thead>
          <tr><th>Audit ID</th><th>Action</th><th>Patient</th><th>Performed by</th><th>Time</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.audit_id}>
              <td>{r.audit_id}</td>
              <td><span className={`badge ${r.action_type.toLowerCase()}`}>{r.action_type}</span></td>
              <td>{r.patient_id}</td>
              <td>{r.performed_by}</td>
              <td>{new Date(r.changed_at).toLocaleString()}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={5}>No audit entries.</td></tr>}
        </tbody>
      </table>
    </section>
  );
}

import { useEffect, useState, type FormEvent } from 'react';
import { useApi, type Patient } from '../api';

export function PatientsPage({ canDelete }: { canDelete: boolean }) {
  const api = useApi();
  const [filters, setFilters] = useState({ last_name: '', first_name: '', dob: '' });
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selected, setSelected] = useState<Patient | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const search = async () => {
    setError('');
    try {
      const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();
      setPatients(await api<Patient[]>(`/patients${qs ? `?${qs}` : ''}`));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  useEffect(() => {
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const open = async (id: number) => {
    setError('');
    try {
      setSelected(await api<Patient>(`/patients/${id}`));
      setCreating(false);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this patient? This is recorded in the audit trail.')) return;
    try {
      await api(`/patients/${id}`, { method: 'DELETE' });
      setSelected(null);
      search();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="layout">
      <section>
        <form
          className="filters"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            search();
          }}
        >
          <input placeholder="Last name" value={filters.last_name} onChange={(e) => setFilters({ ...filters, last_name: e.target.value })} />
          <input placeholder="First name" value={filters.first_name} onChange={(e) => setFilters({ ...filters, first_name: e.target.value })} />
          <input type="date" value={filters.dob} onChange={(e) => setFilters({ ...filters, dob: e.target.value })} />
          <button type="submit">Search</button>
          <button type="button" className="primary" onClick={() => { setCreating(true); setSelected(null); }}>
            New patient
          </button>
        </form>
        {error && <p className="error">{error}</p>}
        <table>
          <thead>
            <tr><th>ID</th><th>Last name</th><th>First name</th><th>Date of birth</th></tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p.patient_id} onClick={() => open(p.patient_id)} className="row">
                <td>{p.patient_id}</td><td>{p.last_name}</td><td>{p.first_name}</td><td>{p.dob}</td>
              </tr>
            ))}
            {patients.length === 0 && <tr><td colSpan={4}>No patients found.</td></tr>}
          </tbody>
        </table>
      </section>

      <aside>
        {creating && (
          <PatientForm
            title="New patient"
            onSave={async (body) => {
              const created = await api<Patient>('/patients', { method: 'POST', body: JSON.stringify(body) });
              setCreating(false);
              setSelected(created);
              search();
            }}
          />
        )}
        {selected && !creating && (
          <PatientForm
            key={selected.patient_id}
            title={`Patient #${selected.patient_id}`}
            initial={selected}
            onSave={async (body) => {
              const updated = await api<Patient>(`/patients/${selected.patient_id}`, { method: 'PUT', body: JSON.stringify(body) });
              setSelected(updated);
              search();
            }}
            onDelete={canDelete ? () => remove(selected.patient_id) : undefined}
          />
        )}
      </aside>
    </div>
  );
}

function PatientForm({
  title,
  initial,
  onSave,
  onDelete,
}: {
  title: string;
  initial?: Patient;
  onSave: (body: Record<string, unknown>) => Promise<void>;
  onDelete?: () => void;
}) {
  const [form, setForm] = useState({
    first_name: initial?.first_name ?? '',
    last_name: initial?.last_name ?? '',
    dob: initial?.dob?.slice(0, 10) ?? '',
    medical_history: initial?.medical_history ?? '',
  });
  const [status, setStatus] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('');
    try {
      await onSave({ ...form, medical_history: form.medical_history || null });
      setStatus('Saved.');
    } catch (err) {
      setStatus((err as Error).message);
    }
  };

  return (
    <form className="card" onSubmit={submit}>
      <h2>{title}</h2>
      <label>First name<input required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></label>
      <label>Last name<input required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></label>
      <label>Date of birth<input required type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} /></label>
      <label>Medical history<textarea rows={6} value={form.medical_history} onChange={(e) => setForm({ ...form, medical_history: e.target.value })} /></label>
      <div className="actions">
        <button type="submit" className="primary">{initial ? 'Save changes' : 'Create patient'}</button>
        {onDelete && <button type="button" className="danger" onClick={onDelete}>Delete</button>}
      </div>
      {status && <p className="status">{status}</p>}
    </form>
  );
}

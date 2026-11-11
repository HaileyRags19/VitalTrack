import { Router } from 'express';
import { z } from 'zod';
import { pool, withUser } from '../db/pool.js';
import type { Request } from 'express';
import { attachUser, requireRole, type AuthedRequest } from '../auth.js';

export const patientsRouter = Router();
patientsRouter.use(attachUser);

const patientInput = z.object({
  first_name: z.string().min(1).max(50),
  last_name: z.string().min(1).max(50),
  dob: z.iso.date(),
  medical_history: z.string().max(10000).nullable().optional(),
});

// Search with optional filters. Every value is a bound parameter, never string-built SQL.
patientsRouter.get('/', requireRole('data_entry', 'medical_admin'), async (req, res) => {
  const filters: string[] = [];
  const values: unknown[] = [];
  const add = (sql: string, value: unknown) => {
    values.push(value);
    filters.push(sql.replace('?', `$${values.length}`));
  };

  if (typeof req.query.last_name === 'string' && req.query.last_name) {
    add('last_name ILIKE ?', `%${req.query.last_name}%`);
  }
  if (typeof req.query.first_name === 'string' && req.query.first_name) {
    add('first_name ILIKE ?', `%${req.query.first_name}%`);
  }
  if (typeof req.query.dob === 'string' && req.query.dob) {
    const dob = z.iso.date().safeParse(req.query.dob);
    if (!dob.success) return res.status(400).json({ error: 'dob must be YYYY-MM-DD' });
    add('dob = ?', dob.data);
  }

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT patient_id, first_name, last_name, dob, medical_history, updated_at
       FROM patients ${where} ORDER BY last_name, first_name LIMIT 200`,
    values,
  );
  res.json(rows);
});

// Viewing one patient is logged as a VIEW audit entry.
patientsRouter.get('/:id', requireRole('data_entry', 'medical_admin'), async (req: Request, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

  const row = await withUser((req as AuthedRequest).userId, async (client) => {
    const { rows } = await client.query(
      'SELECT patient_id, first_name, last_name, dob, medical_history, updated_at FROM patients WHERE patient_id = $1',
      [id],
    );
    if (rows[0]) {
      await client.query(
        `INSERT INTO audit_logs (action_type, patient_id, performed_by, new_data)
         VALUES ('VIEW', $1, $2, $3)`,
        [id, (req as AuthedRequest).userId, rows[0]],
      );
    }
    return rows[0];
  });
  if (!row) return res.status(404).json({ error: 'Patient not found' });
  res.json(row);
});

patientsRouter.post('/', requireRole('data_entry', 'medical_admin'), async (req: Request, res) => {
  const parsed = patientInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const p = parsed.data;

  const row = await withUser((req as AuthedRequest).userId, async (client) => {
    const { rows } = await client.query(
      `INSERT INTO patients (first_name, last_name, dob, medical_history)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [p.first_name, p.last_name, p.dob, p.medical_history ?? null],
    );
    return rows[0];
  });
  res.status(201).json(row);
});

patientsRouter.put('/:id', requireRole('data_entry', 'medical_admin'), async (req: Request, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });
  const parsed = patientInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const p = parsed.data;

  const row = await withUser((req as AuthedRequest).userId, async (client) => {
    const { rows } = await client.query(
      `UPDATE patients SET first_name = $2, last_name = $3, dob = $4,
              medical_history = $5, updated_at = now()
        WHERE patient_id = $1 RETURNING *`,
      [id, p.first_name, p.last_name, p.dob, p.medical_history ?? null],
    );
    return rows[0];
  });
  if (!row) return res.status(404).json({ error: 'Patient not found' });
  res.json(row);
});

// Deleting patients is restricted to medical administrators.
patientsRouter.delete('/:id', requireRole('medical_admin'), async (req: Request, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

  const deleted = await withUser((req as AuthedRequest).userId, async (client) => {
    const { rowCount } = await client.query('DELETE FROM patients WHERE patient_id = $1', [id]);
    return rowCount ?? 0;
  });
  if (!deleted) return res.status(404).json({ error: 'Patient not found' });
  res.status(204).end();
});

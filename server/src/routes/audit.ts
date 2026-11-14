import { Router } from 'express';
import { pool } from '../db/pool.js';
import { attachUser, requireRole } from '../auth.js';

export const auditRouter = Router();
auditRouter.use(attachUser);

// Audit trail is visible to medical administrators only.
auditRouter.get('/', requireRole('medical_admin'), async (req, res) => {
  const patientId = Number(req.query.patient_id);
  const params: unknown[] = [];
  let where = '';
  if (Number.isInteger(patientId)) {
    params.push(patientId);
    where = 'WHERE patient_id = $1';
  }
  const { rows } = await pool.query(
    `SELECT audit_id, action_type, patient_id, performed_by, changed_at, old_data, new_data
       FROM audit_logs ${where} ORDER BY changed_at DESC, audit_id DESC LIMIT 500`,
    params,
  );
  res.json(rows);
});

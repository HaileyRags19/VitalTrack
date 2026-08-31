const express = require('express');
const { Pool } = require('pg');
const { auth } = require('express-oauth2-jwt-bearer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL Connection Pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'vitaltrack',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Auth0 JWT Middleware Safeguard
const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE || 'https://api.vitaltrack.com',
  issuerBaseURL: process.env.AUTH0_ISSUER || 'https://dev-vitaltrack.auth0.com/',
  tokenSigningAlg: 'RS256'
});

// GET: Fetch Patient Records with Sub-second SQL Query
app.get('/api/patients', checkJwt, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM patients ORDER BY patient_id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Add New Patient (Triggers Automatic 'INSERT' Audit Record)
app.post('/api/patients', checkJwt, async (req, res) => {
  const { first_name, last_name, dob, medical_history } = req.body;
  try {
    const query = `
      INSERT INTO patients (first_name, last_name, dob, medical_history)
      VALUES ($1, $2, $3, $4) RETURNING *;
    `;
    const result = await pool.query(query, [first_name, last_name, dob, medical_history]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: Fetch Immutable Audit Trail for Verification
app.get('/api/audit-logs', checkJwt, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM audit_logs ORDER BY changed_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`VitalTrack API running on port ${PORT}`));
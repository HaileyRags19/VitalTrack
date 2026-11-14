import express from 'express';
// Config is checked before the auth middleware is created (see auth.ts).
import cors from 'cors';
import { assertConfig, config } from './config.js';
import { checkJwt } from './auth.js';
import { patientsRouter } from './routes/patients.js';
import { auditRouter } from './routes/audit.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/patients', checkJwt, patientsRouter);
app.use('/api/audit-logs', checkJwt, auditRouter);

// Error handler: return JSON and keep internal details out of responses.
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err.status === 401 || err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  console.error(err);
  res.status(err.status ?? 500).json({ error: 'Server error' });
});

app.listen(config.port, () => console.log(`VitalTrack API running on port ${config.port}`));

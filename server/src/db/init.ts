import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import 'dotenv/config';

// Creates tables, triggers and grants. Needs the OWNER account (DB_OWNER_*),
// because the app role is deliberately not allowed to change the schema.
const here = path.dirname(fileURLToPath(import.meta.url));
const client = new pg.Client({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME ?? 'vitaltrack',
  user: process.env.DB_OWNER_USER ?? 'postgres',
  password: process.env.DB_OWNER_PASSWORD ?? '',
});

const files = ['schema.sql', 'grants.sql'].map((f) => fs.readFileSync(path.join(here, f), 'utf8'));

await client.connect();
try {
  for (const sql of files) await client.query(sql);
  console.log('Schema and grants applied.');
} catch (err) {
  console.error('Schema failed:', (err as Error).message);
  process.exitCode = 1;
} finally {
  await client.end();
}

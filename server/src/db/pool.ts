import pg from 'pg';
import { config } from '../config.js';

export const pool = new pg.Pool(config.db);

/**
 * Runs `fn` inside a transaction and sets app.user_id for the session.
 * The audit trigger reads this value, so each audit row records who acted.
 */
export async function withUser<T>(
  userId: string,
  fn: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.user_id', $1, true)", [userId]);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

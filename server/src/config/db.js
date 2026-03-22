import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('connect', () => {
  if (env.NODE_ENV !== 'test') {
    console.log('📦 PostgreSQL client connected');
  }
});

pool.on('error', (err) => {
  console.error('❌ Unexpected PostgreSQL client error:', err);
  process.exit(-1);
});

export const db = pool;

/**
 * Test the database connection
 */
export const testConnection = async () => {
  const client = await pool.connect();
  try {
    await client.query('SELECT NOW()');
    console.log('✅ PostgreSQL connection established');
  } finally {
    client.release();
  }
};

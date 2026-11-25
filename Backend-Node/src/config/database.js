/**
 * Konfigurasi Database PostgreSQL
 * Pool koneksi dengan dukungan transaksi dan query helper
 */

import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const currentFilename = fileURLToPath(import.meta.url);
const currentDirname = path.dirname(currentFilename);
const backendRoot = path.join(currentDirname, '..', '..');
const projectRoot = path.join(backendRoot, '..');

dotenv.config({ path: path.join(backendRoot, '.env') });
dotenv.config({ path: path.join(projectRoot, '.env') });

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'simrs_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: parseInt(process.env.DB_POOL_MAX || '20', 10),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[DATABASE] Unexpected pool error:', err.message);
});

/**
 * Eksekusi query dengan parameter binding
 * @param {string} text - SQL query
 * @param {Array} params - Parameter values
 * @returns {Promise<{rows: Array, rowCount: number}>}
 */
export async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.debug('[DATABASE] Query executed', { duration: `${duration}ms`, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('[DATABASE] Query error:', { error: error.message, query: text.substring(0, 200) });
    throw error;
  }
}

/**
 * Eksekusi query dalam transaksi
 * @param {Function} callback - Async function menerima client
 * @returns {Promise<any>}
 */
export async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Dapatkan client untuk operasi manual (mis. row locking)
 * @returns {Promise<PoolClient>}
 */
export async function getClient() {
  return pool.connect();
}

/**
 * Tutup pool koneksi (graceful shutdown)
 */
export async function closePool() {
  await pool.end();
  console.info('[DATABASE] Pool closed');
}

export default {
  query, transaction, getClient, closePool,
};

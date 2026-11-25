// Migration Runner
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, closePool } from '../config/database.js';

const currentFilename = fileURLToPath(import.meta.url);
const currentDirname = path.dirname(currentFilename);
const MIGRATIONS_DIR = path.join(currentDirname, 'sql');

const migrations = [
];

async function ensureMigrationTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS simrs_node_migrations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
}

async function getExecutedMigrations() {
  const result = await query('SELECT name FROM simrs_node_migrations ORDER BY executed_at');
  return new Set(result.rows.map((r) => r.name));
}

async function runMigration(name, sql) {
  console.info(`[MIGRATE] Running: ${name}`);
  await query('BEGIN');
  try {
    await query(sql);
    await query('INSERT INTO simrs_node_migrations (name) VALUES ($1)', [name]);
    await query('COMMIT');
    console.info(`[MIGRATE] Completed: ${name}`);
  } catch (error) {
    await query('ROLLBACK');
    console.error(`[MIGRATE] Failed: ${name}`, error.message);
    throw error;
  }
}

export async function migrate() {
  console.info('[MIGRATE] Starting Node.js migrations...');
  await ensureMigrationTable();
  const executed = await getExecutedMigrations();

  for (const migration of migrations) {
    if (executed.has(migration.name)) {
      console.info(`[MIGRATE] Skipped (already executed): ${migration.name}`);
      continue;
    }
    await runMigration(migration.name, migration.sql);
  }

  // Load SQL files from migrations/sql directory
  if (fs.existsSync(MIGRATIONS_DIR)) {
    const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();
    for (const file of files) {
      if (executed.has(file)) {
        console.info(`[MIGRATE] Skipped (already executed): ${file}`);
        continue;
      }
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
      await runMigration(file, sql);
    }
  }

  console.info('[MIGRATE] All migrations completed');
  await closePool();
}

export async function rollback(_name) {
  console.warn('[MIGRATE] Rollback not implemented for Node.js migrations');
}

const currentFilePath = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] && currentFilePath === process.argv[1];
if (isMainModule) {
  migrate().catch((err) => {
    console.error('[MIGRATE] Fatal error:', err);
    process.exit(1);
  });
}

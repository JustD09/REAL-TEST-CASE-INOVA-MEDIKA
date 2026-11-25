import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  database: 'simrs_db',
  user: 'postgres',
  password: 'Admin123',
});

const result = await pool.query(`
  SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
  WHERE table_name = 'simrs_user'
  ORDER BY ordinal_position
`);
console.log(JSON.stringify(result.rows, null, 2));

await pool.end();
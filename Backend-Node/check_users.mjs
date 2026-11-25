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
  SELECT u.username, u.password_hash, aa.item_name as role
  FROM simrs_user u
  LEFT JOIN simrs_auth_assignment aa ON aa.user_id = u.id
  WHERE u.is_deleted = false
  AND u.username IN ('pendaftaran1', 'farmasi1', 'lab1', 'kasir1')
`);
console.log(JSON.stringify(result.rows, null, 2));

const roles = await pool.query(`
  SELECT ai.name, ai.type
  FROM simrs_auth_item ai
  WHERE ai.name IN ('admin', 'dokter', 'pendaftaran', 'farmasi', 'laboratorium', 'kasir', 'manajemen')
`);
console.log('Roles:', JSON.stringify(roles.rows, null, 2));

await pool.end();
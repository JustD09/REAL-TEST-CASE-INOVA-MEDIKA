import pg from 'pg';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
const { Pool } = pg;
const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  database: 'simrs_db',
  user: 'postgres',
  password: 'Admin123',
});

async function createAdmin() {
  const passwordHash = await bcrypt.hash('admin123', 13);
  const userId = randomUUID();
  const authKey = randomUUID().replace(/-/g, '').substring(0, 32);
  
  // Create admin user
  const userResult = await pool.query(`
    INSERT INTO simrs_user (id, username, email, password_hash, auth_key, status, is_deleted)
    VALUES ($1, 'admin', 'admin@simrs.local', $2, $3, 10, false)
    ON CONFLICT (username) DO UPDATE SET password_hash = $2, auth_key = $3
    RETURNING id
  `, [userId, passwordHash, authKey]);
  
  const finalUserId = userResult.rows[0].id;
  console.log('Created admin user with ID:', finalUserId);
  
  // Assign admin role
  await pool.query(`
    INSERT INTO simrs_auth_assignment (item_name, user_id, created_at)
    VALUES ('admin', $1, EXTRACT(EPOCH FROM NOW())::bigint)
    ON CONFLICT (item_name, user_id) DO NOTHING
  `, [finalUserId]);
  
  console.log('Assigned admin role');
  
  // Create profile
  await pool.query(`
    INSERT INTO simrs_profile (id, user_id, full_name, phone)
    VALUES ($1, $2, 'Administrator', '0800000000')
    ON CONFLICT (user_id) DO UPDATE SET full_name = 'Administrator'
  `, [randomUUID(), finalUserId]);
  
  console.log('Created profile');
  
  // Verify
  const verify = await pool.query(`
    SELECT u.id, u.username, u.email, u.status, p.full_name, aa.item_name as role
    FROM simrs_user u
    LEFT JOIN simrs_profile p ON p.user_id = u.id
    LEFT JOIN simrs_auth_assignment aa ON aa.user_id = u.id
    WHERE u.username = 'admin'
  `);
  console.log('Verification:', JSON.stringify(verify.rows, null, 2));
  
  await pool.end();
}

createAdmin().catch(console.error);
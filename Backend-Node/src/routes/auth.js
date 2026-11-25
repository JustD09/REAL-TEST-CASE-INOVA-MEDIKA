// Route Autentikasi

import express from 'express';
import bcrypt from 'bcryptjs';
import Joi from 'joi';
import { query } from '../config/database.js';
import { redis } from '../config/redis.js';
import {
  authenticate, generateAccessToken, generateRefreshToken, blacklistToken, verifyRefreshToken,
} from '../middleware/auth.js';
import { asyncHandler, AppError, validate } from '../middleware/errorHandler.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

// Route Login
router.post('/login', authRateLimiter, validate(loginSchema), asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  const result = await query(
    `SELECT u.id, u.username, u.email, u.password_hash, u.status,
            p.full_name, p.nik, p.phone
     FROM simrs_user u
     LEFT JOIN simrs_profile p ON p.user_id = u.id
     WHERE u.username = $1 AND u.is_deleted = false`,
    [username],
  );

  if (!result.rows.length) {
    throw new AppError('KREDENSIAL_SALAH', 'Username atau password salah', 401);
  }

  const user = result.rows[0];

  if (user.status !== 10) {
    throw new AppError('AKUN_TIDAK_AKTIF', 'Akun tidak aktif atau diblokir', 403);
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw new AppError('KREDENSIAL_SALAH', 'Username atau password salah', 401);
  }

  // Update last login
  await query('UPDATE simrs_user SET last_login_at = NOW() WHERE id = $1', [user.id]);

  // Ambil permissions & roles dari RBAC
  const rbacResult = await query(
    `WITH RECURSIVE assigned_items AS (
       SELECT aa.item_name
       FROM simrs_auth_assignment aa
       WHERE aa.user_id = $1
       UNION
       SELECT child.child
       FROM simrs_auth_item_child child
       JOIN assigned_items parent ON parent.item_name = child.parent
     )
     SELECT ai.name, ai.type
     FROM assigned_items assigned
     JOIN simrs_auth_item ai ON ai.name = assigned.item_name`,
    [user.id],
  );

  const roles = rbacResult.rows.filter((r) => r.type === 1).map((r) => r.name);
  const permissions = rbacResult.rows.filter((r) => r.type === 2).map((r) => r.name);

  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    roles,
    permissions,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({ id: user.id, type: 'refresh' });

  // Simpan refresh token ke Redis jika tersedia (optional)
  try {
    await redis.set(`refresh:${user.id}:${refreshToken}`, '1', 'EX', 604800);
  } catch (redisError) {
    console.warn('[AUTH] Redis unavailable, refresh token persistence skipped');
  }

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        roles,
        permissions,
      },
      accessToken,
      refreshToken,
    },
  });
}));

// Route Refresh access token
router.post('/refresh', validate(refreshSchema), asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  const decoded = await verifyRefreshToken(refreshToken);

  if (decoded.type !== 'refresh') {
    throw new AppError('TOKEN_TIDAK_VALID', 'Tipe token tidak valid', 401);
  }

  // Cek apakah refresh token masih ada di Redis (fail-open - skip if unavailable)
  let exists = true;
  try {
    exists = await redis.exists(`refresh:${decoded.id}:${refreshToken}`);
  } catch (redisError) {
    console.warn('[AUTH] Redis unavailable, skipping refresh token check');
  }
  if (!exists) {
    throw new AppError('TOKEN_DICABUT', 'Refresh token tidak valid atau telah dicabut', 401);
  }

  // Ambil user terbaru
  const userResult = await query(
    `SELECT u.id, u.username, u.email, u.status,
            p.full_name, p.nik, p.phone
     FROM simrs_user u
     LEFT JOIN simrs_profile p ON p.user_id = u.id
     WHERE u.id = $1 AND u.is_deleted = false`,
    [decoded.id],
  );

  if (!userResult.rows.length) {
    throw new AppError('USER_TIDAK_DITEMUKAN', 'User tidak ditemukan', 404);
  }

  const user = userResult.rows[0];

  if (user.status !== 10) {
    throw new AppError('AKUN_TIDAK_AKTIF', 'Akun tidak aktif', 403);
  }

  const rbacResult = await query(
    `WITH RECURSIVE assigned_items AS (
       SELECT aa.item_name
       FROM simrs_auth_assignment aa
       WHERE aa.user_id = $1
       UNION
       SELECT child.child
       FROM simrs_auth_item_child child
       JOIN assigned_items parent ON parent.item_name = child.parent
     )
     SELECT ai.name, ai.type
     FROM assigned_items assigned
     JOIN simrs_auth_item ai ON ai.name = assigned.item_name`,
    [user.id],
  );

  const roles = rbacResult.rows.filter((r) => r.type === 1).map((r) => r.name);
  const permissions = rbacResult.rows.filter((r) => r.type === 2).map((r) => r.name);

  const payload = {
    id: user.id, username: user.username, email: user.email, roles, permissions,
  };
  const newAccessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken({ id: user.id, type: 'refresh' });

  // Rotasi refresh token: hapus lama, simpan baru (optional)
  try {
    await redis.del(`refresh:${user.id}:${refreshToken}`);
    await redis.set(`refresh:${user.id}:${newRefreshToken}`, '1', 'EX', 604800);
  } catch (redisError) {
    console.warn('[AUTH] Redis unavailable, refresh token rotation skipped');
  }

  res.json({
    success: true,
    data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
  });
}));

// Route Logout
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader.slice(7);

  // Blacklist access token (optional)
  try {
    await blacklistToken(token, 900);
  } catch (redisError) {
    console.warn('[AUTH] Redis unavailable, token blacklist skipped');
  }

  // Hapus refresh token dari Redis (optional)
  const { refreshToken } = req.body;
  if (refreshToken) {
    try {
      await redis.del(`refresh:${req.user.id}:${refreshToken}`);
    } catch (redisError) {
      console.warn('[AUTH] Redis unavailable, refresh token deletion skipped');
    }
  }

  res.json({ success: true, message: 'Logout berhasil' });
}));

// Route user data
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const userResult = await query(
    `SELECT u.id, u.username, u.email, u.status, u.last_login_at, u.created_at,
            p.full_name, p.nik, p.birth_date, p.gender, p.phone, p.address, p.photo
     FROM simrs_user u
     LEFT JOIN simrs_profile p ON p.user_id = u.id
     WHERE u.id = $1 AND u.is_deleted = false`,
    [req.user.id],
  );

  if (!userResult.rows.length) {
    throw new AppError('USER_TIDAK_DITEMUKAN', 'User tidak ditemukan', 404);
  }

  const user = userResult.rows[0];

  const rbacResult = await query(
    `WITH RECURSIVE assigned_items AS (
       SELECT aa.item_name
       FROM simrs_auth_assignment aa
       WHERE aa.user_id = $1
       UNION
       SELECT child.child
       FROM simrs_auth_item_child child
       JOIN assigned_items parent ON parent.item_name = child.parent
     )
     SELECT ai.name, ai.type
     FROM assigned_items assigned
     JOIN simrs_auth_item ai ON ai.name = assigned.item_name`,
    [user.id],
  );

  const roles = rbacResult.rows.filter((r) => r.type === 1).map((r) => r.name);
  const permissions = rbacResult.rows.filter((r) => r.type === 2).map((r) => r.name);

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        status: user.status,
        lastLoginAt: user.last_login_at,
        createdAt: user.created_at,
        fullName: user.full_name,
        nik: user.nik,
        birthDate: user.birth_date,
        gender: user.gender,
        phone: user.phone,
        address: user.address,
        photo: user.photo,
        roles,
        permissions,
      },
    },
  });
}));

export default router;
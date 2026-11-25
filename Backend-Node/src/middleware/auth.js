// Middleware Autentikasi JWT

import jwt from 'jsonwebtoken';
import { redis } from '../config/redis.js';
import { AppError } from './errorHandler.js';

// Shared secret with Yii2 for token compatibility
const JWT_SECRET = process.env.JWT_SECRET || 'simrs-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'simrs-secret-key';

// Helper untuk Redis calls yang fail-open
async function redisExists(key) {
  try {
    return await redis.exists(key) === 1;
  } catch (err) {
    console.warn('[AUTH] Redis unavailable, skipping check:', err.message);
    return false; // fail-open: treat as not blacklisted / not existing
  }
}

async function redisSet(key, value, mode, ttl) {
  try {
    await redis.set(key, value, mode, ttl);
  } catch (err) {
    console.warn('[AUTH] Redis unavailable, set skipped:', err.message);
  }
}

async function redisDel(key) {
  try {
    await redis.del(key);
  } catch (err) {
    console.warn('[AUTH] Redis unavailable, del skipped:', err.message);
  }
}

// Verifikasi access token - supports both Yii2 and Node.js token formats
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('TOKEN_TIDAK_DITEMUKAN', 'Token autentikasi tidak ditemukan', 401);
    }

    const token = authHeader.slice(7);

    // Cek blacklist di Redis (fail-open: skip if Redis unavailable)
    const isBlacklisted = await redisExists(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new AppError('TOKEN_DICABUT', 'Token telah dicabut, silakan login ulang', 401);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      // Fallback: try with old secret for backward compatibility
      const oldSecret = 'jwt_secret_key_anda';
      if (oldSecret !== JWT_SECRET) {
        decoded = jwt.verify(token, oldSecret);
      } else {
        throw e;
      }
    }

    // Normalize payload: support both Yii2 (uid) and Node.js (id) formats
    const userId = decoded.uid ?? decoded.id;
    const roles = decoded.roles || [];
    const permissions = decoded.permissions || [];

    req.user = {
      id: userId,
      username: decoded.username,
      email: decoded.email,
      roles,
      permissions,
    };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('TOKEN_KADALUARSA', 'Token kadaluarsa, gunakan refresh token', 401));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('TOKEN_TIDAK_VALID', 'Token tidak valid', 401));
    }
    next(error);
  }
}

// Verifikasi refresh token
export async function verifyRefreshToken(token) {
  try {
    const isBlacklisted = await redisExists(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new AppError('TOKEN_DICABUT', 'Refresh token telah dicabut', 401);
    }
  } catch (redisError) {
    // Already logged in redisExists
  }
  return jwt.verify(token, JWT_REFRESH_SECRET);
}

// Generate access token
export function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

// Generate refresh token
export function generateRefreshToken(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

// Blacklist token (logout) - fail-open
export async function blacklistToken(token, expiresInSeconds = 900) {
  await redisSet(`blacklist:${token}`, '1', 'EX', expiresInSeconds);
}

// Middleware RBAC - cek permission
export function requirePermission(...permissions) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('TIDAK_TEROTENTIKASI', 'Autentikasi diperlukan', 401));
    }
    const userPermissions = req.user.permissions || [];
    const hasPermission = permissions.some((p) => userPermissions.includes(p));
    if (!hasPermission) {
      return next(new AppError('AKSES_DITOLAK', `Perlu permission: ${permissions.join(', ')}`, 403));
    }
    next();
  };
}

// Middleware RBAC - cek role
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('TIDAK_TEROTENTIKASI', 'Autentikasi diperlukan', 401));
    }
    const userRoles = req.user.roles || [];
    const hasRole = roles.some((r) => userRoles.includes(r));
    if (!hasRole) {
      return next(new AppError('AKSES_DITOLAK', `Perlu role: ${roles.join(', ')}`, 403));
    }
    next();
  };
}
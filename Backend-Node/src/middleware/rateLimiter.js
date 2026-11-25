// Rate Limiter Middleware

import { rateLimit } from '../config/redis.js';
import { AppError } from './errorHandler.js';

// Buat middleware rate limiter
export function createRateLimiter({
  limit = 100, windowMs = 60000, keyGenerator, message,
} = {}) {
  return async (req, res, next) => {
    try {
      const key = keyGenerator ? keyGenerator(req) : req.ip || req.connection.remoteAddress;
      const result = await rateLimit(key, limit, windowMs);

      res.set({
        'X-RateLimit-Limit': limit,
        'X-RateLimit-Remaining': result.remaining,
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
      });

      if (!result.allowed) {
        const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
        res.set('Retry-After', retryAfter);
        throw new AppError('RATE_LIMIT_TERLAMPAUI', message || 'Terlalu banyak permintaan, coba lagi nanti', 429);
      }

      next();
    } catch (error) {
      if (error instanceof AppError) throw error;
      // Jika Redis error, log tapi jangan block request (fail-open untuk availability)
      console.error('[RATE_LIMITER] Redis error, allowing request:', error.message);
      next();
    }
  };
}

// Rate limiter default untuk API umum
export const apiRateLimiter = createRateLimiter({ limit: 100, windowMs: 60000 });

// Rate limiter ketat untuk auth (login dan register)
export const authRateLimiter = createRateLimiter({
  limit: 10,
  windowMs: 900000,
  message: 'Terlalu banyak percobaan login, coba lagi 15 menit',
});

// Rate limiter untuk pembayaran
export const paymentRateLimiter = createRateLimiter({ limit: 30, windowMs: 60000 });

// Rate limiter per user
export const userRateLimiter = createRateLimiter({
  limit: 200,
  windowMs: 60000,
  keyGenerator: (req) => req.user?.id || req.ip,
});

export default {
  createRateLimiter,
  apiRateLimiter,
  authRateLimiter,
  paymentRateLimiter,
  userRateLimiter,
};

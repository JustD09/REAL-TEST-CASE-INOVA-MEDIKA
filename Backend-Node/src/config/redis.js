// Konfigurasi Redis

import Redis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const currentFilename = fileURLToPath(import.meta.url);
const currentDirname = path.dirname(currentFilename);
const backendRoot = path.join(currentDirname, '..', '..');
const projectRoot = path.join(backendRoot, '..');

dotenv.config({ path: path.join(backendRoot, '.env') });
dotenv.config({ path: path.join(projectRoot, '.env') });

// Use 127.0.0.1 (Windows port proxy to WSL Redis)
const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = process.env.REDIS_PORT || '6379';
const redisUrl = `redis://${redisHost}:${redisPort}/${process.env.REDIS_DB || '0'}`;

export const redis = new Redis(redisUrl, {
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    if (times > 3) {
      console.warn('[REDIS] Max retries reached, giving up');
      return null;
    }
    const delay = Math.min(times * 1000, 3000);
    console.info(`[REDIS] Retry attempt ${times}, waiting ${delay}ms`);
    return delay;
  },
  reconnectOnError: (err) => {
    const targetErrors = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'Connection is closed'];
    return targetErrors.some(e => err.message.includes(e));
  },
  connectTimeout: 5000,
  enableReadyCheck: true,
  maxRetriesPerRequest: 1,
  family: 4,
  keepAlive: 10000,
  lazyConnect: true,
});

redis.on('connect', () => console.info('[REDIS] Connected'));
redis.on('ready', () => console.info('[REDIS] Ready'));
redis.on('error', (err) => console.error('[REDIS] Error:', err.message));
redis.on('close', () => console.warn('[REDIS] Connection closed'));
redis.on('reconnecting', () => console.info('[REDIS] Reconnecting...'));

// Initialize connection in background (fire and forget)
redis.connect().catch((err) => {
  console.warn('[REDIS] Initial connection failed, will retry on demand:', err.message);
});

// Cache helper
export const cache = {
  async get(key) {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },

  async set(key, value, ttlSeconds = 300) {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  },

  async del(key) {
    await redis.del(key);
  },

  async exists(key) {
    return (await redis.exists(key)) === 1;
  },

  async flushPattern(pattern) {
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(...keys);
  },
};

// Rate limiter
export async function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  const windowSec = Math.ceil(windowMs / 1000);
  const redisKey = `ratelimit:${key}`;

  const multi = redis.multi();
  multi.zremrangebyscore(redisKey, 0, now - windowMs);
  multi.zcard(redisKey);
  multi.zadd(redisKey, now, `${now}-${Math.random()}`);
  multi.expire(redisKey, windowSec);
  const results = await multi.exec();

  const currentCount = results[1][1];
  const allowed = currentCount < limit;
  const remaining = Math.max(0, limit - currentCount);

  if (!allowed) {
    const oldest = await redis.zrange(redisKey, 0, 0, 'WITHSCORES');
    const resetTime = oldest.length ? parseInt(oldest[1], 10) + windowMs : now + windowMs;
    return { allowed: false, remaining: 0, resetTime };
  }

  return { allowed: true, remaining, resetTime: now + windowMs };
}

// Koneksi BullMQ
export const bullmqConnection = {
  host: redisHost,
  port: parseInt(redisPort, 10),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
  family: 4,
  keepAlive: 30000,
};

// Tutup koneksi Redis
export async function closeRedis() {
  await redis.quit();
  console.info('[REDIS] Connection closed');
}

export default {
  redis, cache, rateLimit, bullmqConnection, closeRedis,
};

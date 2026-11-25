import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, closePool } from './config/database.js';
import { redis, closeRedis } from './config/redis.js';
import { closeQueues } from './services/queueService.js';
import { attachWebSocketServer, subscribeRedisChannels } from './services/webSocketService.js';
import { setupSwagger } from './utils/swagger.js';
import { handleError, asyncHandler } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';

// Routes
import authRoutes from './routes/auth.js';
import billingRoutes from './routes/billing.js';
import labRoutes from './routes/lab.js';
import dashboardRoutes from './routes/dashboard.js';
import integrationRoutes from './routes/integration.js';

const currentFilename = fileURLToPath(import.meta.url);
const currentDirname = path.dirname(currentFilename);
const backendRoot = path.join(currentDirname, '..');
const projectRoot = path.join(backendRoot, '..');

dotenv.config({ path: path.join(backendRoot, '.env') });
dotenv.config({ path: path.join(projectRoot, '.env') });

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = (process.env.CORS_ORIGIN || 'https://localhost,http://localhost:3000').split(',');

// Middleware global
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(apiRateLimiter);

// Cek Health
app.get('/health', asyncHandler(async (req, res) => {
  // Cek database
  await query('SELECT 1');
  // Cek Redis (fail-open)
  let redisStatus = 'disconnected';
  try {
    await redis.ping();
    redisStatus = 'connected';
  } catch (err) {
    console.warn('[HEALTH] Redis ping failed:', err.message);
  }

  res.json({
    success: true,
    status: redisStatus === 'connected' ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      redis: redisStatus,
    },
  });
}));

// Route API
app.use('/api/auth', authRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/lab', labRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/integration', integrationRoutes);

// Swagger
setupSwagger(app);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'ENDPOINT_TIDAK_DITEMUKAN', message: `Endpoint ${req.method} ${req.path} tidak ditemukan` },
  });
});

// Error handler
app.use(handleError);

// Attach WebSocket
attachWebSocketServer(server);

// Shutdown Server
let isShuttingDown = false;

async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.info(`[SHUTDOWN] Received ${signal}`);

  server.close(() => {
    console.info('[SHUTDOWN] HTTP server closed');
  });

  // Stop accepting new connections
  setTimeout(async () => {
    try {
      await closeQueues();
      await closeRedis();
      await closePool();
      console.info('[SHUTDOWN] All connections closed');
      process.exit(0);
    } catch (error) {
      console.error('[SHUTDOWN] Error during shutdown:', error);
      process.exit(1);
    }
  }, 5000);

  // Force exit after 30 seconds
  setTimeout(() => {
    console.error('[SHUTDOWN] Force exit after timeout');
    process.exit(1);
  }, 30000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Connect Redis explicitly at startup (auto-connect with retry)
async function connectRedis() {
  try {
    // ioredis will auto-connect with retryStrategy
    // Don't wait for ping, just ensure connection is initiated
    console.info('[REDIS] Connection initiated, will retry in background');
  } catch (err) {
    console.error('[REDIS] Startup connection failed:', err.message);
    throw err;
  }
}

// Start server
await connectRedis();
server.listen(PORT, () => {
  console.info(`[SERVER] Node.js service running on port ${PORT}`);
  console.info(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.info(`[SERVER] API Docs: http://localhost:${PORT}/api-docs`);
  console.info(`[SERVER] Health: http://localhost:${PORT}/health`);
});

// Subscribe Redis channels for WS scaling
subscribeRedisChannels().catch((err) => console.error('[WS] Redis subscribe failed:', err.message));

export default app;

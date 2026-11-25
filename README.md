# SIMRS - Sistem Informasi Manajemen Rumah Sakit

Full-stack Hospital Information System built with:
- **Backend**: Yii2 Advanced (PHP 8.2+)
- **Frontend**: React 18 + Vite + Material UI
- **Services**: Node.js 20 (Express, plain JavaScript ESM)
- **Database**: PostgreSQL 16
- **Cache/Queue**: Redis 7 (via WSL)
- **Containerization**: Docker Compose (referensi - tidak digunakan pada local)

## 📁 Project Structure

```
simrs-app/
├── Frontend-React/            # React SPA (Vite + MUI)
│   ├── public/
│   ├── src/
│   │   ├── api/               # Axios instances + interceptors
│   │   ├── components/        # Reusable UI (Button, DataTable, Form, Modal)
│   │   ├── pages/             # Halaman: Dashboard, Pendaftaran, Antrean, Pemeriksaan, Farmasi, Lab, Billing
│   │   ├── hooks/             # useAuth, useWebSocket, useApi
│   │   ├── contexts/          # AuthContext, NotificationContext
│   │   ├── layouts/           # MainLayout, AuthLayout
│   │   ├── routes/            # AppRoutes.jsx (React Router v6)
│   │   ├── store/             # Zustand stores (auth, queue, billing)
│   │   └── utils/             # formatRupiah, dateIndo, validation
│   ├── index.html
│   ├── package.json, vite.config.js, .env
│   └── dist/                  # Build output (copy to XAMPP htdocs)
│
├── Backend-Node/              # Node.js Service Layer (Express + PostgreSQL + Redis + BullMQ)
│   ├── src/
│   │   ├── index.js           # Entry point, Express + HTTP server + WS attach
│   │   ├── config/
│   │   │   ├── database.js    # pg Pool, query(), execute(), transaction()
│   │   │   └── redis.js       # ioredis client, cache helpers, rateLimiter, bullmqConnection
│   │   ├── middleware/
│   │   │   ├── auth.js        # JWT verify, blacklist Redis, RBAC requirePermission
│   │   │   ├── errorHandler.js # AppError, Indonesian messages, PG error codes mapping
│   │   │   └── rateLimiter.js # Sliding window via Redis sorted sets
│   │   ├── routes/
│   │   │   ├── auth.js        # POST /api/auth/login, /refresh, /logout, /me
│   │   │   ├── billing.js     # GET/POST billing, POST /payment (idempotent), POST /refund
│   │   │   ├── lab.js         # Lab lifecycle: ordered→collected→in_progress→completed→verified
│   │   │   ├── dashboard.js   # Summary, period trends, queue status real-time
│   │   │   └── integration.js # BPJS SEP/rujukan/claim, SATUSEHAT Patient/Encounter, circuit breaker
│   │   ├── services/
│   │   │   ├── webSocketService.js # WS server, channels: lab, queue, billing, dashboard
│   │   │   └── queueService.js     # BullMQ workers: bpjs, satusehat, notification, report
│   │   ├── utils/
│   │   │   ├── logger.js      # Winston (console + file rotation)
│   │   │   └── swagger.js     # swagger-jsdoc + swagger-ui at /api-docs
│   │   └── db/migrate.js      # Runner migration SQL
│   ├── package.json
│   └── .eslintrc.json
│
├── Yii-SIMRS/                 # Yii2 Framework
│   ├── api/                   # REST API v1 (JWT auth, RBAC, rate limit)
│   │   ├── modules/v1/
│   │   │   ├── controllers/   # Kunjungan, Pasien, Pemeriksaan, Resep, Laboratorium, Billing, Pembayaran, dll
│   │   │   ├── models/        # Search models untuk filter/grid
│   │   │   └── components/    # BaseController (auth, cors, rateLimit)
│   ├── backend/               # Admin panel (Gii, RBAC UI, laporan)
│   ├── common/
│   │   ├── config/            # main.php (db, redis, authManager, formatter, i18n)
│   │   ├── models/            # ActiveRecord models + business logic
│   │   │   ├── ActiveRecord.php   # Base: UUID, Timestamp, Blameable, soft delete
│   │   │   ├── Kunjungan.php      # Registrasi, queue generation, duplicate prevention
│   │   │   ├── Obat.php           # Stok, deductStock/addStock FOR UPDATE, idempotent dispense
│   │   │   ├── Pemeriksaan.php    # Examination lifecycle, optimistic locking (version), finalize()
│   │   │   ├── Pembayaran.php     # Payment processing, idempotency integration
│   │   │   ├── Billing.php        # Tagihan generation, detail, status
│   │   │   ├── Laboratorium.php   # Order lab, state transitions
│   │   │   ├── Resep.php          # Resep, detail, dispense
│   │   │   └── IdempotencyKey.php # Model untuk tabel simrs_idempotency_keys
│   │   └── components/
│   │       └── IdempotencyHandler.php # Generic idempotency processing
│   ├── console/
│   │   ├── config/main.php    # Migration path, RBAC, queue controllers
│   │   └── migrations/
│   │       └── m240101_000001_create_simrs_tables.php # Schema PostgreSQL lengkap
│   ├── config/
│   │   ├── db.php             # PostgreSQL DSN dari env
│   │   ├── test_db.php        # Test DB PostgreSQL
│   │   ├── web.php, console.php, api.php
│   ├── runtime/               # logs, assets, debug
│   ├── web/                   # Entry point frontend (index.php)
│   ├── api/                   # Entry point API (index.php)
│   └── tests/                 # Codeception unit/functional/acceptance
│
├── Database/                  # Database Schema & Migration
│   ├── docker-compose.yml     # Reference docker-compose (PostgreSQL + Redis)
│   ├── requirements.php       # PHP extension check
│   ├── migrations/
│   │   └── m240101_000001_create_simrs_tables.php # Migration Yii2
│   ├── schema/                # Standalone SQL files for manual deployment
│   │   ├── 01_extensions.sql  # CREATE EXTENSION pgcrypto
│   │   ├── 02_enum_types.sql  # ENUM types
│   │   ├── 03_master_tables.sql
│   │   ├── 04_transaction_tables.sql
│   │   ├── 05_audit_idempotency.sql
│   │   ├── 06_rbac_tables.sql
│   │   └── 07_indexes_perf.sql
│   └── seeds/
│       ├── 01_rbac_seed.php
│       ├── 02_master_seed.php
│       └── 03_demo_data.php
│
├── Documentation/             # Technical Documentation (HTML Guides)
│   ├── index.html             # Main documentation index
│   ├── guides/                # Folder guides & concurrency patterns
│   │   ├── index.html
│   │   ├── frontend-react.html
│   │   ├── backend-node.html
│   │   ├── yii-simrs.html
│   │   ├── database.html
│   │   ├── 01-duplicate-registration.html
│   │   ├── 02-stock-concurrency.html
│   │   ├── 03-duplicate-payment.html
│   │   ├── 04-examination-changes.html
│   │   ├── 05-integration-failure.html
│   │   └── 06-performance.html
│   ├── architecture/
│   │   └── application.html   # Architecture diagram & data ownership
│   ├── api/
│   │   └── endpoints.html     # All API endpoints reference
│   ├── deployment/
│   │   └── installation.html  # Local PostgreSQL + XAMPP HTTPS setup
│   ├── testing/
│   │   └── test-plan.html     # Test cases & acceptance criteria
│   └── evidence/              # Screenshots & test evidence (populated after testing)
│
├── docker-compose.yml         # Full stack orchestration (PostgreSQL, Redis, PHP-FPM, Nginx, Node, React, pgAdmin, Mailhog)
├── .env.example               # Environment template
├── composer.json              # Yii2 dependencies
└── yii, yii.bat               # Yii console entry (points to Yii-SIMRS)
```

## 🚀 Quick Start (Local Services - No Docker Required)

### Prerequisites
- **PostgreSQL 16+** (local service)
- **Redis 7+ via WSL2 Ubuntu** (required for Node.js async features)
- **Node.js 20 LTS+**
- **PHP 8.2+** with `pdo_pgsql`, `pgsql` extensions
- **XAMPP** (Apache + PHP-FPM) for HTTPS
- **Composer 2+**

### 1. Database Setup (PostgreSQL)
```bash
# Install PostgreSQL 16 dari postgresql.org/download/windows/
# Create database & user
psql -U postgres
CREATE DATABASE simrs_db;
CREATE USER simrs_user WITH ENCRYPTED PASSWORD 'simrs_pass_aman_2024';
GRANT ALL PRIVILEGES ON DATABASE simrs_db TO simrs_user;
\c simrs_db
CREATE EXTENSION IF NOT EXISTS pgcrypto;
GRANT ALL ON SCHEMA public TO simrs_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO simrs_user;
```

### 2. Redis Setup (via WSL)
```bash
# Redis diinstall melalui WSL (Windows Subsystem for Linux)
wsl --install -d Ubuntu
# Restart Windows setelah install WSL

# Di terminal WSL (Ubuntu):
sudo apt update && sudo apt install -y redis-server
sudo systemctl enable redis-server && sudo systemctl start redis-server

# Edit /etc/redis/redis.conf untuk development lokal:
# bind 127.0.0.1
# port 6379
# maxmemory 512mb
# maxmemory-policy allkeys-lru
# save ""          # disable RDB persistence (dev only)
# appendonly yes   # enable AOF
# appendfsync everysec

# Verifikasi dari Windows PowerShell:
wsl redis-cli ping
# Expected: PONG
```

### 3. XAMPP HTTPS Setup
```bash
# 1. Install XAMPP PHP 8.2+
# 2. Enable SSL modules in httpd.conf:
#    LoadModule ssl_module modules/mod_ssl.so
#    LoadModule proxy_module modules/mod_proxy.so
#    LoadModule proxy_http_module modules/mod_proxy_http.so
#    LoadModule proxy_wstunnel_module modules/mod_proxy_wstunnel.so
#    LoadModule rewrite_module modules/mod_rewrite.so
#    LoadModule headers_module modules/mod_headers.so
#    Include conf/extra/httpd-ssl.conf

# 3. Generate self-signed cert (development):
cd C:\xampp\apache
mkdir ssl.crt ssl.key
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl.key/server.key -out ssl.crt/server.crt \
  -subj "/C=ID/ST=Jakarta/L=Jakarta/O=SIMRS/CN=localhost"

# 4. Configure VirtualHost in httpd-ssl.conf:
# DocumentRoot "C:/xampp/htdocs/simrs-yii/web"
# SSLEngine on
# SSLCertificateFile "conf/ssl.crt/server.crt"
# SSLCertificateKeyFile "conf/ssl.key/server.key"
# ProxyPass /api/node/ http://localhost:3001/
# ProxyPass /ws/ ws://localhost:3001/ws/
# Alias /frontend/ "C:/xampp/htdocs/simrs-frontend/"

# 5. Restart Apache via XAMPP Control Panel
```

### 4. Backend-Node Setup
```bash
cd Backend-Node
cp .env.example .env
# Edit .env: DB_*, REDIS_*, JWT_*, BPJS_*, SATUSEHAT_*
npm ci
npm run migrate      # Run Node.js migration
npm run dev          # Development (watch mode)
# Optional service manager: pm2 start ecosystem.config.js --env production
```

### 5. Frontend-React Build
```bash
cd Frontend-React
cp .env.example .env
# Edit VITE_API_BASE_URL=https://localhost/api
# VITE_NODE_API_BASE_URL=https://localhost/api/node
# VITE_WS_URL=wss://localhost/ws
npm ci
npm run build
# Copy dist/* to C:\xampp\htdocs\simrs-frontend\
```

### 6. Yii-SIMRS Setup
```bash
# Copy Yii-SIMRS to XAMPP
# C:\xampp\htdocs\simrs-yii\ ← contents of Yii-SIMRS/

cd C:\xampp\htdocs\simrs-yii
composer install --no-dev --optimize-autoloader

# Configure .env or set env vars for DB connection
# php yii migrate
# php yii rbac/init
# php yii master/seed (optional)
```

### 7. Verify
| Service | URL | Check |
|---------|-----|-------|
| Frontend (React) | https://localhost/frontend/ | Login page loads |
| Yii2 API | https://localhost/api/v1/poli | JSON list poli |
| Node.js API | https://localhost/api/node/health | `{"status":"healthy",...}` |
| Node.js Swagger | https://localhost/api/node/api-docs | Swagger UI |
| WebSocket | wss://localhost/ws?token=JWT | Connection + subscribe |

## 🏗️ Architecture Overview

### Yii2 Responsibilities (Main Backend)
- **Authentication & RBAC**: JWT + Database RBAC (shared secret with Node.js)
- **Master Data**: Pasien, Dokter, Poli, Tindakan, Obat, ICD-10, Diagnosis
- **Transactions**: Pendaftaran, Antrean, Pemeriksaan, Tindakan, Resep, Lab Order, Billing Generation
- **Business Logic**: Stock management (SELECT FOR UPDATE), Idempotency, Audit trail, Optimistic locking
- **REST API**: Exposes resources for React + Node.js consumption

### Node.js Responsibilities (Supporting Services)
- **Billing & Payment**: Payment processing, idempotency, refund, invoice
- **Laboratory**: Full lifecycle (order → collect → process → verify → result)
- **Dashboard Analytics**: Heavy aggregation queries, caching, real-time WebSocket push
- **BPJS/SATUSEHAT Integration**: External API with circuit breaker, retry, BullMQ async queue
- **WebSocket Server**: Real-time updates for queue, lab, billing, dashboard
- **Report Generation**: PDF/Excel via queue workers

### Data Ownership & Communication
| Domain | Writer | Reader | Sync |
|--------|--------|--------|------|
| Master Data | Yii2 | Both | Direct DB read + Redis cache invalidation |
| Kunjungan & Antrean | Yii2 | Both | Redis Pub/Sub events |
| Pemeriksaan & Rekam Medis | Yii2 | Both | Redis event `pemeriksaan.finalized` |
| Lab Order | Yii2 (create) | Node.js (lifecycle) | Node owns state transitions |
| Billing | Yii2 (generate) | Node.js (payment, update) | Event-driven regen |
| Payment & Refund | Node.js | Yii2 (read) | Direct DB + WS notify |
| Integrasi BPJS/SATUSEHAT | Node.js | - | Async queue |

## 🔐 Authentication & Authorization

### Roles & Permissions
| Role | Description | Key Permissions |
|------|-------------|-----------------|
| `admin` | Full system access | All permissions |
| `petugas_pendaftaran` | Registration desk | Pasien CRUD, Pendaftaran, Antrean |
| `dokter` | Doctors | Pemeriksaan, Tindakan, Resep, Lab Order |
| `petugas_farmasi` | Pharmacy | Resep Dispensing, Stock Opname |
| `petugas_laboratorium` | Lab | Lab Order Process, Verify |
| `kasir` | Cashier | Billing, Payment, Refund |

### JWT Flow
1. Login → `POST /api/node/auth/login` → Access Token (15m) + Refresh Token (7d)
2. Requests → `Authorization: Bearer <access_token>` (works for both Yii2 & Node.js)
3. Token expired → `POST /api/node/auth/refresh` with refresh token
4. Logout → Blacklist tokens in Redis

## 💾 Database Design Highlights

### Concurrency Handling (PostgreSQL)
```sql
-- 1. Duplicate Registration Prevention
CREATE UNIQUE INDEX idx_kunjungan_nodup
ON simrs_kunjungan (pasien_id, poli_id, tanggal)
WHERE is_deleted = false AND status IN ('registered','waiting','in_progress');

-- 2. Stock Non-Negative
ALTER TABLE simrs_obat ADD CONSTRAINT chk_stock_nonneg CHECK (current_stock >= 0);

-- 3. Idempotency Keys
CREATE TABLE simrs_idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'processing', -- processing|completed|failed
  result JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- 4. Optimistic Lock (Pemeriksaan)
ALTER TABLE simrs_pemeriksaan ADD COLUMN version INT DEFAULT 1;
ALTER TABLE simrs_pemeriksaan ADD COLUMN is_final BOOLEAN DEFAULT false;
```

### Yii2 Application-Level Locks
```php
// Kunjungan::createRegistration() - SELECT FOR UPDATE on poli + unique check
$poli = Poli::find()->where(['id' => $poliId])->forUpdate()->one();
$existing = static::find()->where(['pasien_id'=>$pasienId,'poli_id'=>$poliId,'tanggal'=>$date])
    ->andWhere(['in','status',[self::STATUS_REGISTERED,self::STATUS_WAITING,self::STATUS_IN_PROGRESS]])->one();

// Obat::deductStock() - FOR UPDATE + idempotent dispenseId
$obat = static::find()->where(['id'=>$this->id])->forUpdate()->one();
if ($dispenseId && ObatStockLog::find()->where(['reference_id'=>$dispenseId])->exists()) return true;

// Pemeriksaan::finalize() - Optimistic lock with version
$locked = static::find()->where(['id'=>$this->id])->forUpdate()->one();
if ($locked->version !== $this->version || $locked->is_final) throw error;
$this->is_final = true; $this->version++; $this->save();
```

### Node.js Idempotent Payment
```javascript
// POST /api/billing/:id/payment with Idempotency-Key header
const existing = await client.query(
  'SELECT status, result FROM simrs_idempotency_keys WHERE idempotency_key = $1 FOR UPDATE',
  [idempotencyKey]
);
if (existing.rows[0]?.status === 'completed') return { duplicate: true, payment: JSON.parse(result) };
await client.query("INSERT INTO simrs_idempotency_keys ... VALUES ($1, 'processing', NOW(), NOW() + INTERVAL '24 HOUR')", [idempotencyKey]);
// Lock billing, create payment, update billing, mark idempotency completed
```

### Integration Resilience (Node.js)
- **Circuit Breaker**: Closed → Open (after N failures) → Half-Open → Closed
- **Exponential Backoff Retry**: Max 3 attempts, delay 1s, 2s, 4s + jitter
- **BullMQ Queues**: `bpjs-integration`, `satusehat-integration` with concurrency=2, rate limiter
- **Integration Log**: Every request/response/error in `simrs_integration_log` with `retry_count`

## 🛠️ Development Commands

### Backend-Node
```bash
cd Backend-Node
npm run dev          # Watch mode (node --watch)
npm run start        # Service mode (PM2)
npm run lint         # ESLint (0 errors, warnings only)
npm run test         # Jest
npm run migrate      # Run Node.js SQL migrations
```

### Frontend-React
```bash
cd Frontend-React
npm run dev          # Vite dev server (port 3000)
npm run build        # Build to dist/ (copy to XAMPP htdocs)
npm run preview      # Preview build
npm run lint         # ESLint
```

### Yii2 (in Yii-SIMRS or via XAMPP)
```bash
cd Yii-SIMRS
php -l config/db.php common/models/Kunjungan.php common/models/Obat.php common/models/Pemeriksaan.php console/migrations/m240101_000001_create_simrs_tables.php
php yii migrate
php yii rbac/init
php vendor/bin/codecept run
php vendor/bin/phpstan analyse
php vendor/bin/php-cs-fixer fix
```

## 📦 Local PC Deployment

### Database (PostgreSQL 16 Local)
- PostgreSQL 16 installed as Windows service on localhost:5432
- `postgresql.conf` tuned: `shared_buffers=256MB`, `effective_cache_size=1GB`, `max_connections=100`
- Enable `pg_stat_statements` for slow query monitoring
- Regular `pg_dump` backup to local folder

### Redis (WSL Ubuntu)
- Redis 7+ installed in WSL2 Ubuntu, port 6379 forwarded to Windows localhost
- `maxmemory 512mb`, `maxmemory-policy allkeys-lru`, AOF everysec
- Disable RDB snapshots (`save ""`)

### Web Server (XAMPP Apache HTTPS)
- XAMPP Apache on Windows, port 443 (HTTPS)
- Self-signed cert for local development
- HSTS, CSP, security headers enabled
- Reverse proxy: `/api/*` → PHP-FPM, `/api/node/*` → Node.js, `/ws` → Node.js WS, `/frontend/` → React static

### Node.js (Local Service)
- Run via `npm run dev` (development) or `npm run start` (service mode)
- Optional: PM2 for process management on Windows
- Single instance on port 3001

### Monitoring (Optional)
- Prometheus + Grafana: node_exporter, postgres_exporter, redis_exporter (can run in WSL)
- Node.js `/metrics` (prom-client), `/health` endpoint
- Slow query alerts from `pg_stat_statements`
- BullMQ queue metrics

## 📚 Documentation

| Guide | Description |
|-------|-------------|
| [Documentation/index.html](Documentation/index.html) | Main documentation portal |
| [Documentation/guides/index.html](Documentation/guides/index.html) | All folder guides + 6 concurrency patterns |
| [Documentation/architecture/application.html](Documentation/architecture/application.html) | Architecture diagram & data ownership |
| [Documentation/api/endpoints.html](Documentation/api/endpoints.html) | Complete API endpoint reference |
| [Documentation/deployment/installation.html](Documentation/deployment/installation.html) | Local PostgreSQL + XAMPP HTTPS setup |
| [Documentation/testing/test-plan.html](Documentation/testing/test-plan.html) | Test cases, acceptance criteria, evidence |

## 🧪 Testing

```bash
# 1. Unit/Integration Tests
cd Backend-Node && npm test
cd Yii-SIMRS && php vendor/bin/codecept run

# 2. Concurrency Tests (manual)
# See Documentation/testing/test-plan.html for test cases:
# TC-REG-002: Duplicate registration concurrent
# TC-STK-002: Stock concurrency
# TC-PAY-002: Payment idempotency
# TC-EXM-002: Examination concurrent edit
# TC-INT-001/002: Integration failure & circuit breaker

# 3. Load Test
# k6 run load-test.js (see test-plan for script)

# 4. Security Test (Strix)
# strix -n -t ./Yii-SIMRS -t https://localhost/api/v1 --max-budget 20
# strix -n -t ./Backend-Node -t https://localhost/api/node --max-budget 20
```

## 🔒 Security

- **SQL Injection**: Prepared statements everywhere (PDO `ATTR_EMULATE_PREPARES=false`, pg parameterized)
- **XSS**: React auto-escape, Yii2 HTMLPurifier, CSP headers
- **CSRF**: SameSite=Strict cookies + JWT in headers (not cookies)
- **Auth Bypass**: JWT RS256, short expiry, Redis blacklist, RBAC checks on every route
- **Rate Limiting**: Redis sliding window (API 100/min, Auth 5/min, Payment 10/min)
- **Circuit Breaker**: Prevents cascade failures on external APIs
- **Audit Trail**: All sensitive CRUD in `simrs_audit_log` with old/new JSONB
- **Secrets**: `.env` files (not committed), `.env.example` template

## 📝 License

BSD-3-Clause - See [LICENSE.md](LICENSE.md)

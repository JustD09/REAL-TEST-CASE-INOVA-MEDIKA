// Route Integrasi BPJS dan SATUSEHAT

import express from 'express';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database.js';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

const router = express.Router();

// Circuit breaker state
const circuitBreakers = new Map();

function getCircuitBreaker(key) {
  if (!circuitBreakers.has(key)) {
    circuitBreakers.set(key, { failures: 0, lastFailure: 0, state: 'closed' });
  }
  return circuitBreakers.get(key);
}

function recordSuccess(key) {
  const cb = getCircuitBreaker(key);
  cb.failures = 0;
  cb.state = 'closed';
}

function recordFailure(key) {
  const cb = getCircuitBreaker(key);
  cb.failures += 1;
  cb.lastFailure = Date.now();
  if (cb.failures >= 5) {
    cb.state = 'open';
    // Auto-reset setelah 30s
    setTimeout(() => { cb.state = 'half-open'; }, 30000);
  }
}

function isCircuitOpen(key) {
  const cb = getCircuitBreaker(key);
  if (cb.state === 'open') {
    // Check jika setengah terbuka, langsung timeout passed
    if (Date.now() - cb.lastFailure > 30000) {
      cb.state = 'half-open';
      return false;
    }
    return true;
  }
  return false;
}

// Log integrasi ke database
async function logIntegration(client, {
  integrationType, requestPayload, responsePayload, status, errorMessage, retryCount = 0,
}) {
  await client.query(
    `INSERT INTO simrs_integration_log (
       id, integration_type, request_payload, response_payload, status, error_message, retry_count
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      uuidv4(), integrationType, JSON.stringify(requestPayload),
      JSON.stringify(responsePayload), status, errorMessage, retryCount,
    ],
  );
}

// HTTP client dengan circuit breaker & retry
async function httpWithCircuitBreaker(key, fn, maxRetries = 3) {
  if (isCircuitOpen(key)) {
    throw new AppError('CIRCUIT_OPEN', `Layanan ${key} sementara tidak tersedia (circuit breaker open)`, 503);
  }

  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      recordSuccess(key);
      return result;
    } catch (error) {
      lastError = error;
      recordFailure(key);
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, Math.min(1000 * 2 ** attempt, 10000)));
      }
    }
  }
  throw lastError;
}

// Route BPJS
router.post('/bpjs/sep', authenticate, requirePermission('integration.bpjs'), asyncHandler(async (req, res) => {
  const {
    kunjunganId, noKartu, tglSep, poliTujuan, catatan,
  } = req.body;

  if (!kunjunganId || !noKartu || !tglSep || !poliTujuan) {
    throw new AppError('VALIDASI_GAGAL', 'kunjunganId, noKartu, tglSep, poliTujuan wajib diisi', 400);
  }

  // Cek idempotency
  const idempotencyKey = `bpjs-sep-${kunjunganId}-${noKartu}-${tglSep}`;
  const existing = await query(
    'SELECT result FROM simrs_idempotency_keys WHERE idempotency_key = $1 AND status = \'completed\'',
    [idempotencyKey],
  );
  if (existing.rows.length) {
    return res.json({ success: true, data: existing.rows[0].result, idempotent: true });
  }

  const kunjunganResult = await query(
    `SELECT k.*, p.no_rm, p.bpjs_number, p.bpjs_class, u.username, u.email
     FROM simrs_kunjungan k
     JOIN simrs_pasien p ON p.id = k.pasien_id
     JOIN simrs_user u ON u.id = p.user_id
     WHERE k.id = $1 AND k.is_deleted = false`,
    [kunjunganId],
  );

  if (!kunjunganResult.rows.length) {
    throw new AppError('KUNJUNGAN_TIDAK_DITEMUKAN', 'Kunjungan tidak ditemukan', 404);
  }

  const kunjungan = kunjunganResult.rows[0];

  const payload = {
    request: {
      t_sertifikat: process.env.BPJS_CONS_ID,
      t_signature: '',
      noKartu,
      tglSep,
      poliTujuan,
      catatan: catatan || kunjungan.keluhan,
    },
  };

  let response;
  try {
    response = await httpWithCircuitBreaker('bpjs', async () => {
      const { data } = await axios.post(`${process.env.BPJS_BASE_URL}/sep/insert`, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      });
      return data;
    });
  } catch (error) {
    await query(
      `INSERT INTO simrs_integration_log (
         id, integration_type, request_payload, response_payload, status, error_message
       ) VALUES ($1, 'bpjs_sep', $2, $3, 'failed', $4)`,
      [uuidv4(), JSON.stringify(payload), JSON.stringify({ error: error.message }), error.message],
    );
    throw new AppError('BPJS_GAGAL', `Gagal buat SEP: ${error.message}`, 502);
  }

  // Simpan hasil SEP
  if (response.metaData?.code === 200) {
    const sepData = response.response;
    await query(
      'UPDATE simrs_kunjungan SET bpjs_referral_number = $1, updated_by = $2 WHERE id = $3',
      [sepData.noSep, req.user.id, kunjunganId],
    );

    await query(
      `INSERT INTO simrs_idempotency_keys (id, idempotency_key, status, result, completed_at, expires_at)
       VALUES ($1, $2, 'completed', $3, NOW(), NOW() + INTERVAL '24 hours')`,
      [uuidv4(), idempotencyKey, JSON.stringify(sepData)],
    );

    res.json({ success: true, data: sepData });
  } else {
    throw new AppError('BPJS_ERROR', response.metaData?.message || 'BPJS error', 502);
  }
}));

// Kirim claim BPJS
router.post('/bpjs/claim', authenticate, requirePermission('integration.bpjs'), asyncHandler(async (req, res) => {
  const {
    kunjunganId, diagnosis, tindakan, obat, biaya,
  } = req.body;

  if (!kunjunganId) {
    throw new AppError('VALIDASI_GAGAL', 'kunjunganId wajib diisi', 400);
  }

  const kunjunganResult = await query(
    `SELECT k.*, p.bpjs_number, b.no_billing, b.total
     FROM simrs_kunjungan k
     JOIN simrs_pasien p ON p.id = k.pasien_id
     LEFT JOIN simrs_billing b ON b.kunjungan_id = k.id AND b.is_deleted = false
     WHERE k.id = $1 AND k.is_deleted = false`,
    [kunjunganId],
  );

  if (!kunjunganResult.rows.length) {
    throw new AppError('KUNJUNGAN_TIDAK_DITEMUKAN', 'Kunjungan tidak ditemukan', 404);
  }

  const kunjungan = kunjunganResult.rows[0];

  if (!kunjungan.bpjs_referral_number) {
    throw new AppError('SEP_BELUM_ADA', 'SEP belum dibuat untuk kunjungan ini', 400);
  }

  // Build claim payload
  const payload = {
    request: {
      t_sertifikat: process.env.BPJS_CONS_ID,
      t_signature: '',
      noSep: kunjungan.bpjs_referral_number,
      tglPeriksa: kunjungan.tanggal,
      jnsPelayanan: kunjungan.is_bpjs ? '1' : '2', // 1= Rawat Jalan, 2= Rawat Inap
      diagnosa: diagnosis,
      tindakan,
      obat,
      biaya: biaya || { total: kunjungan.total },
    },
  };

  let response;
  try {
    response = await httpWithCircuitBreaker('bpjs', async () => {
      const { data } = await axios.post(`${process.env.BPJS_BASE_URL}/claim/insert`, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      });
      return data;
    });
  } catch (error) {
    await query(
      `INSERT INTO simrs_integration_log (
         id, integration_type, request_payload, response_payload, status, error_message
       ) VALUES ($1, 'bpjs_claim', $2, $3, 'failed', $4)`,
      [uuidv4(), JSON.stringify(payload), JSON.stringify({ error: error.message }), error.message],
    );
    throw new AppError('BPJS_GAGAL', `Gagal kirim claim: ${error.message}`, 502);
  }

  if (response.metaData?.code === 200) {
    res.json({ success: true, data: response.response });
  } else {
    throw new AppError('BPJS_ERROR', response.metaData?.message || 'BPJS claim error', 502);
  }
}));

// Route pasien ke SATUSEHAT
router.post(
  '/satusehat/patient',
  authenticate,
  requirePermission('integration.satusehat'),
  asyncHandler(async (req, res) => {
    const { pasienId } = req.body;

    if (!pasienId) {
      throw new AppError('VALIDASI_GAGAL', 'pasienId wajib diisi', 400);
    }

    const pasienResult = await query(
      `SELECT p.*, u.username, u.email, pr.full_name, pr.nik, pr.birth_date, pr.gender, pr.phone, pr.address
     FROM simrs_pasien p
     JOIN simrs_user u ON u.id = p.user_id
     LEFT JOIN simrs_profile pr ON pr.user_id = u.id
     WHERE p.id = $1 AND p.is_deleted = false`,
      [pasienId],
    );

    if (!pasienResult.rows.length) {
      throw new AppError('PASIEN_TIDAK_DITEMUKAN', 'Pasien tidak ditemukan', 404);
    }

    const pasien = pasienResult.rows[0];

    if (pasien.satusehat_id) {
      return res.json({
        success: true,
        data: { satusehatId: pasien.satusehat_id },
        message: 'Sudah terdaftar di SATUSEHAT',
      });
    }

    // Build FHIR Patient resource
    const fhirPatient = {
      resourceType: 'Patient',
      identifier: [{ system: 'http://simrs.local/no-rm', value: pasien.no_rm }],
      name: [{ use: 'official', text: pasien.full_name || pasien.username }],
      gender: (() => {
        if (pasien.gender === 'L') return 'male';
        if (pasien.gender === 'P') return 'female';
        return 'unknown';
      })(),
      birthDate: pasien.birth_date,
      telecom: pasien.phone ? [{ system: 'phone', value: pasien.phone }] : [],
      address: pasien.address ? [{ text: pasien.address }] : [],
    };

    let response;
    try {
      response = await httpWithCircuitBreaker('satusehat', async () => {
        const { data } = await axios.post(`${process.env.SATUSEHAT_BASE_URL}/Patient`, fhirPatient, {
          headers: {
            'Content-Type': 'application/fhir+json',
            Authorization: `Bearer ${process.env.SATUSEHAT_CLIENT_SECRET}`, // OAuth2 token
          },
          timeout: 10000,
        });
        return data;
      });
    } catch (error) {
      await logIntegration(null, {
        integrationType: 'satusehat_patient',
        requestPayload: fhirPatient,
        responsePayload: { error: error.message },
        status: 'failed',
        errorMessage: error.message,
      });
      throw new AppError('SATUSEHAT_GAGAL', `Gagal push patient: ${error.message}`, 502);
    }

    const satusehatId = response.id;
    await query(
      'UPDATE simrs_pasien SET satusehat_id = $1, satusehat_synced_at = NOW() WHERE id = $2',
      [satusehatId, pasienId],
    );

    res.json({ success: true, data: { satusehatId, fhir: response } });
  }),
);

// Route riwayat integrasi
router.get(
  '/logs',
  authenticate,
  requirePermission('integration.read'),
  asyncHandler(async (req, res) => {
    const {
      type, status, dateFrom, dateTo, limit = 50, offset = 0,
    } = req.query;

    let where = 'WHERE 1=1';
    const params = [];
    let paramIdx = 1;

    if (type) {
      where += ` AND integration_type = $${paramIdx++}`;
      params.push(type);
    }
    if (status) {
      where += ` AND status = $${paramIdx++}`;
      params.push(status);
    }
    if (dateFrom) {
      where += ` AND created_at >= $${paramIdx++}`;
      params.push(dateFrom);
    }
    if (dateTo) {
      where += ` AND created_at <= $${paramIdx++}`;
      params.push(dateTo);
    }

    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const result = await query(
      `SELECT * FROM simrs_integration_log
     ${where}
     ORDER BY created_at DESC
     LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
      params,
    );

    res.json({ success: true, data: result.rows });
  }),
);

// Status circuit breaker
router.get('/circuit-breakers', authenticate, requirePermission('integration.read'), asyncHandler(async (req, res) => {
  const breakers = {};
  for (const [key, value] of circuitBreakers.entries()) {
    breakers[key] = { ...value };
  }
  res.json({ success: true, data: breakers });
}));

export default router;

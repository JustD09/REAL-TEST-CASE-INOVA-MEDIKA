// Route Laboratorium

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, transaction } from '../config/database.js';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

const router = express.Router();

const STATUSES = ['ordered', 'collected', 'in_progress', 'completed', 'verified', 'cancelled'];
const TRANSITIONS = {
  ordered: ['collected', 'cancelled'],
  collected: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: ['verified', 'cancelled'],
  verified: [],
  cancelled: [],
};

// Validasi transisi status
function validateTransition(current, next) {
  return TRANSITIONS[current]?.includes(next) ?? false;
}

// Generate nomor order lab
async function generateNoOrder(client) {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const result = await client.query(
    'SELECT COUNT(*) FROM simrs_laboratorium WHERE no_order LIKE $1',
    [`LAB-${dateStr}-%`],
  );
  const seq = parseInt(result.rows[0].count, 10) + 1;
  return `LAB-${dateStr}-${String(seq).padStart(4, '0')}`;
}

// Buat order laboratorium
router.post('/order', authenticate, requirePermission('lab.order'), asyncHandler(async (req, res) => {
  const {
    kunjunganId, jenisPemeriksaanId, dokterId, clinicalInfo,
  } = req.body;

  if (!kunjunganId || !jenisPemeriksaanId) {
    throw new AppError('VALIDASI_GAGAL', 'kunjunganId dan jenisPemeriksaanId wajib diisi', 400);
  }

  const result = await transaction(async (client) => {
    // Cek kunjungan & pasien
    const kunjunganResult = await client.query(
      `SELECT k.*, p.id as pasien_id FROM simrs_kunjungan k
       JOIN simrs_pasien p ON p.id = k.pasien_id
       WHERE k.id = $1 AND k.is_deleted = false`,
      [kunjunganId],
    );

    if (!kunjunganResult.rows.length) {
      throw new AppError('KUNJUNGAN_TIDAK_DITEMUKAN', 'Kunjungan tidak ditemukan', 404);
    }

    // Cek jenis pemeriksaan
    const jenisResult = await client.query(
      'SELECT * FROM simrs_jenis_pemeriksaan_lab WHERE id = $1 AND is_deleted = false AND is_active = true',
      [jenisPemeriksaanId],
    );

    if (!jenisResult.rows.length) {
      throw new AppError('JENIS_TIDAK_DITEMUKAN', 'Jenis pemeriksaan tidak ditemukan atau tidak aktif', 404);
    }

    const jenis = jenisResult.rows[0];

    // Cek duplicate order
    const dupCheck = await client.query(
      `SELECT id FROM simrs_laboratorium
       WHERE kunjungan_id = $1 AND jenis_pemeriksaan_id = $2 AND status != 'cancelled' AND is_deleted = false`,
      [kunjunganId, jenisPemeriksaanId],
    );

    if (dupCheck.rows.length) {
      throw new AppError('ORDER_DUPLIKAT', 'Order untuk pemeriksaan ini sudah ada', 409);
    }

    const noOrder = await generateNoOrder(client);

    const labResult = await client.query(
      `INSERT INTO simrs_laboratorium (
        id, kunjungan_id, jenis_pemeriksaan_id, dokter_id, no_order,
        sample_type, clinical_info, status, tarif, ordered_at, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'ordered', $8, NOW(), $9) RETURNING *`,
      [uuidv4(), kunjunganId, jenisPemeriksaanId, dokterId || req.user.id, noOrder,
        jenis.sample_type, clinicalInfo, jenis.tarif, req.user.id],
    );

    return labResult.rows[0];
  });

  res.status(201).json({ success: true, data: result });
}));

// Detail order lab
router.get('/:id', authenticate, requirePermission('lab.read'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await query(
    `SELECT l.*, j.nama as jenis_nama, j.type as jenis_type, j.unit, j.reference_range,
            p.no_rm, u.username as dokter_nama
     FROM simrs_laboratorium l
     JOIN simrs_jenis_pemeriksaan_lab j ON j.id = l.jenis_pemeriksaan_id
     JOIN simrs_kunjungan k ON k.id = l.kunjungan_id
     JOIN simrs_pasien p ON p.id = k.pasien_id
     JOIN simrs_user u ON u.id = p.user_id
     LEFT JOIN simrs_user du ON du.id = l.dokter_id
     WHERE l.id = $1 AND l.is_deleted = false`,
    [id],
  );

  if (!result.rows.length) {
    throw new AppError('ORDER_TIDAK_DITEMUKAN', 'Order laboratorium tidak ditemukan', 404);
  }

  res.json({ success: true, data: result.rows[0] });
}));

// List order lab
router.get('/', authenticate, requirePermission('lab.read'), asyncHandler(async (req, res) => {
  const {
    kunjunganId, status, dateFrom, dateTo, limit = 50, offset = 0,
  } = req.query;

  let where = 'WHERE l.is_deleted = false';
  const params = [];
  let paramIdx = 1;

  if (kunjunganId) {
    where += ` AND l.kunjungan_id = $${paramIdx++}`;
    params.push(kunjunganId);
  }
  if (status) {
    where += ` AND l.status = $${paramIdx++}`;
    params.push(status);
  }
  if (dateFrom) {
    where += ` AND l.created_at >= $${paramIdx++}`;
    params.push(dateFrom);
  }
  if (dateTo) {
    where += ` AND l.created_at <= $${paramIdx++}`;
    params.push(dateTo);
  }

  params.push(parseInt(limit, 10), parseInt(offset, 10));

  const result = await query(
    `SELECT l.*, j.nama as jenis_nama, k.tanggal as kunjungan_tanggal
     FROM simrs_laboratorium l
     JOIN simrs_jenis_pemeriksaan_lab j ON j.id = l.jenis_pemeriksaan_id
     JOIN simrs_kunjungan k ON k.id = l.kunjungan_id
     ${where}
     ORDER BY l.created_at DESC
     LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
    params,
  );

  res.json({ success: true, data: result.rows });
}));

// Update status order lab
router.patch('/:id/status', authenticate, requirePermission('lab.update'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, result: labResult, interpretation } = req.body;

  if (!status || !STATUSES.includes(status)) {
    throw new AppError('VALIDASI_GAGAL', 'Status tidak valid', 400);
  }

  const updated = await transaction(async (client) => {
    const current = await client.query(
      'SELECT * FROM simrs_laboratorium WHERE id = $1 AND is_deleted = false FOR UPDATE',
      [id],
    );

    if (!current.rows.length) {
      throw new AppError('ORDER_TIDAK_DITEMUKAN', 'Order tidak ditemukan', 404);
    }

    const order = current.rows[0];

    if (!validateTransition(order.status, status)) {
      throw new AppError('TRANSISI_TIDAK_VALID', `Tidak bisa beralih dari ${order.status} ke ${status}`, 400);
    }

    const updates = ['status = $2', 'updated_by = $3'];
    const values = [id, status, req.user.id];
    let paramIdx = 4;

    const timestamps = {
      collected: 'collected_at',
      in_progress: 'started_at',
      completed: 'completed_at',
      verified: 'verified_at',
    };

    if (timestamps[status]) {
      updates.push(`${timestamps[status]} = NOW()`);
    }

    if (labResult !== undefined) {
      updates.push(`result = $${paramIdx++}`);
      values.push(labResult);
    }
    if (interpretation !== undefined) {
      updates.push(`interpretation = $${paramIdx++}`);
      values.push(interpretation);
    }

    if (status === 'verified') {
      updates.push(`verifikator_id = $${paramIdx++}`);
      values.push(req.user.id);
    }

    const result = await client.query(
      `UPDATE simrs_laboratorium SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
      values,
    );

    return result.rows[0];
  });

  res.json({ success: true, data: updated });
}));

// Ambil data sample
router.post('/:id/collect', authenticate, requirePermission('lab.collect'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { petugasId } = req.body;

  const updated = await transaction(async (client) => {
    const current = await client.query(
      'SELECT * FROM simrs_laboratorium WHERE id = $1 AND is_deleted = false FOR UPDATE',
      [id],
    );

    if (!current.rows.length) {
      throw new AppError('ORDER_TIDAK_DITEMUKAN', 'Order tidak ditemukan', 404);
    }

    const order = current.rows[0];
    if (!validateTransition(order.status, 'collected')) {
      throw new AppError('TRANSISI_TIDAK_VALID', `Tidak bisa collect dari status ${order.status}`, 400);
    }

    const result = await client.query(
      `UPDATE simrs_laboratorium
       SET status = 'collected', petugas_id = $2, collected_at = NOW(), updated_by = $3
       WHERE id = $1 RETURNING *`,
      [id, petugasId || req.user.id, req.user.id],
    );

    return result.rows[0];
  });

  res.json({ success: true, data: updated });
}));

// Verifikasi hasil
router.post('/:id/verify', authenticate, requirePermission('lab.verify'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { result: labResult, interpretation } = req.body;

  const updated = await transaction(async (client) => {
    const current = await client.query(
      'SELECT * FROM simrs_laboratorium WHERE id = $1 AND is_deleted = false FOR UPDATE',
      [id],
    );

    if (!current.rows.length) {
      throw new AppError('ORDER_TIDAK_DITEMUKAN', 'Order tidak ditemukan', 404);
    }

    const order = current.rows[0];
    if (!validateTransition(order.status, 'verified')) {
      throw new AppError('TRANSISI_TIDAK_VALID', `Tidak bisa verifikasi dari status ${order.status}`, 400);
    }

    const result = await client.query(
      `UPDATE simrs_laboratorium
       SET status = 'verified', result = COALESCE($2, result), interpretation = COALESCE($3, interpretation),
           verifikator_id = $4, verified_at = NOW(), updated_by = $4
       WHERE id = $1 RETURNING *`,
      [id, labResult, interpretation, req.user.id],
    );

    return result.rows[0];
  });

  res.json({ success: true, data: updated });
}));

// Batalkan order
router.post('/:id/cancel', authenticate, requirePermission('lab.cancel'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const updated = await transaction(async (client) => {
    const current = await client.query(
      'SELECT * FROM simrs_laboratorium WHERE id = $1 AND is_deleted = false FOR UPDATE',
      [id],
    );

    if (!current.rows.length) {
      throw new AppError('ORDER_TIDAK_DITEMUKAN', 'Order tidak ditemukan', 404);
    }

    const order = current.rows[0];
    if (!validateTransition(order.status, 'cancelled')) {
      throw new AppError('TRANSISI_TIDAK_VALID', `Tidak bisa batalkan dari status ${order.status}`, 400);
    }

    const result = await client.query(
      `UPDATE simrs_laboratorium
       SET status = 'cancelled', notes = COALESCE($2, notes), updated_by = $3
       WHERE id = $1 RETURNING *`,
      [id, reason, req.user.id],
    );

    return result.rows[0];
  });

  res.json({ success: true, data: updated });
}));

export default router;

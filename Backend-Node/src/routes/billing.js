// Route Billing & Pembayaran

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, transaction } from '../config/database.js';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { paymentRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Generate unique nomor billing
async function generateNoBilling(client) {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const result = await client.query(
    'SELECT COUNT(*) FROM simrs_billing WHERE no_billing LIKE $1',
    [`BIL-${dateStr}-%`],
  );
  const seq = parseInt(result.rows[0].count, 10) + 1;
  return `BIL-${dateStr}-${String(seq).padStart(4, '0')}`;
}

// Generate unique nomor bukti pembayaran
async function generateNoBukti(client) {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const result = await client.query(
    'SELECT COUNT(*) FROM simrs_pembayaran WHERE no_bukti LIKE $1',
    [`BYR-${dateStr}-%`],
  );
  const seq = parseInt(result.rows[0].count, 10) + 1;
  return `BYR-${dateStr}-${String(seq).padStart(4, '0')}`;
}

// List billing (query params: kunjungan_id, status, limit, offset)
router.get('/', authenticate, requirePermission('billing.read'), asyncHandler(async (req, res) => {
  const { kunjungan_id, status, limit = 50, offset = 0 } = req.query;

  let where = 'WHERE b.is_deleted = false';
  const params = [];
  let paramIdx = 1;

  if (kunjungan_id) {
    where += ` AND b.kunjungan_id = $${paramIdx++}`;
    params.push(kunjungan_id);
  }
  if (status) {
    where += ` AND b.status = $${paramIdx++}`;
    params.push(status);
  }

  params.push(parseInt(limit, 10), parseInt(offset, 10));

  const result = await query(
    `SELECT b.*, p.no_rm, p.user_id, u.username, u.email
     FROM simrs_billing b
     JOIN simrs_pasien p ON p.id = b.pasien_id
     JOIN simrs_user u ON u.id = p.user_id
     ${where}
     ORDER BY b.created_at DESC
     LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
    params,
  );

  res.json({ success: true, data: result.rows });
}));

// Ambil data detail billing kunjungan
router.get('/:kunjunganId', authenticate, requirePermission('billing.read'), asyncHandler(async (req, res) => {
  const { kunjunganId } = req.params;

  const billingResult = await query(
    `SELECT b.*, p.no_rm, p.user_id, u.username, u.email
     FROM simrs_billing b
     JOIN simrs_pasien p ON p.id = b.pasien_id
     JOIN simrs_user u ON u.id = p.user_id
     WHERE b.kunjungan_id = $1 AND b.is_deleted = false`,
    [kunjunganId],
  );

  if (!billingResult.rows.length) {
    throw new AppError('BILLING_TIDAK_DITEMUKAN', 'Billing tidak ditemukan untuk kunjungan ini', 404);
  }

  const billing = billingResult.rows[0];

  const detailResult = await query(
    'SELECT * FROM simrs_billing_detail WHERE billing_id = $1 AND is_deleted = false ORDER BY created_at',
    [billing.id],
  );

  const paymentResult = await query(
    'SELECT * FROM simrs_pembayaran WHERE billing_id = $1 AND is_deleted = false ORDER BY created_at',
    [billing.id],
  );

  res.json({
    success: true,
    data: {
      ...billing,
      details: detailResult.rows,
      payments: paymentResult.rows,
    },
  });
}));

// Generate billing untuk kunjungan
router.post('/', authenticate, requirePermission('billing.create'), asyncHandler(async (req, res) => {
  const { kunjunganId } = req.body;

  if (!kunjunganId) {
    throw new AppError('VALIDASI_GAGAL', 'kunjunganId wajib diisi', 400);
  }

  const result = await transaction(async (client) => {
    // Cek kunjungan & pasien
    const kunjunganResult = await client.query(
      `SELECT k.*, p.id as pasien_id, p.no_rm
       FROM simrs_kunjungan k
       JOIN simrs_pasien p ON p.id = k.pasien_id
       WHERE k.id = $1 AND k.is_deleted = false`,
      [kunjunganId],
    );

    if (!kunjunganResult.rows.length) {
      throw new AppError('KUNJUNGAN_TIDAK_DITEMUKAN', 'Kunjungan tidak ditemukan', 404);
    }

    const kunjungan = kunjunganResult.rows[0];

    // Cek billing existing
    const existingBilling = await client.query(
      'SELECT * FROM simrs_billing WHERE kunjungan_id = $1 AND is_deleted = false',
      [kunjunganId],
    );

    if (existingBilling.rows.length) {
      throw new AppError('BILLING_SUDAH_ADA', 'Billing untuk kunjungan ini sudah dibuat', 409);
    }

    // Hitung biaya
    const registrationFee = kunjungan.registration_fee || 0;

    // Tindakan medis
    const tindakanResult = await client.query(
      `SELECT SUM(total_tarif) as total FROM simrs_tindakan_medis
       WHERE kunjungan_id = $1 AND is_deleted = false AND status != 'cancelled'`,
      [kunjunganId],
    );
    const tindakanFee = parseFloat(tindakanResult.rows[0].total || 0);

    // Laboratorium
    const labResult = await client.query(
      `SELECT SUM(tarif) as total FROM simrs_laboratorium
       WHERE kunjungan_id = $1 AND is_deleted = false AND status != 'cancelled'`,
      [kunjunganId],
    );
    const laboratoriumFee = parseFloat(labResult.rows[0].total || 0);

    // Obat (resep)
    const obatResult = await client.query(
      `SELECT SUM(rd.harga_satuan * rd.quantity) as total
       FROM simrs_resep_detail rd
       JOIN simrs_resep r ON r.id = rd.resep_id
       WHERE r.kunjungan_id = $1 AND rd.is_deleted = false AND r.is_deleted = false`,
      [kunjunganId],
    );
    const obatFee = parseFloat(obatResult.rows[0].total || 0);

    const subtotal = registrationFee + tindakanFee + laboratoriumFee + obatFee;
    const discount = 0;
    const tax = 0;
    const serviceCharge = 0;
    const total = subtotal - discount + tax + serviceCharge;

    const noBilling = await generateNoBilling(client);

    const billingResult = await client.query(
      `INSERT INTO simrs_billing (
        id, kunjungan_id, pasien_id, no_billing, status,
        registration_fee, tindakan_fee, laboratorium_fee, obat_fee,
        subtotal, discount, tax, service_charge, total, paid_amount,
        due_date, created_by
      ) VALUES (
        $1, $2, $3, $4, 'open',
        $5, $6, $7, $8,
        $9, $10, $11, $12, $13, 0,
        CURRENT_DATE + INTERVAL '7 days', $14
      ) RETURNING *`,
      [uuidv4(), kunjunganId, kunjungan.pasien_id, noBilling,
        registrationFee, tindakanFee, laboratoriumFee, obatFee,
        subtotal, discount, tax, serviceCharge, total, req.user.id],
    );

    const billing = billingResult.rows[0];

    // Insert data billing details
    const details = [
      {
        type: 'registration', refId: kunjunganId, desc: 'Biaya Pendaftaran', qty: 1, price: registrationFee,
      },
      {
        type: 'tindakan', refId: kunjunganId, desc: 'Tindakan Medis', qty: 1, price: tindakanFee,
      },
      {
        type: 'laboratorium', refId: kunjunganId, desc: 'Pemeriksaan Laboratorium', qty: 1, price: laboratoriumFee,
      },
      {
        type: 'obat', refId: kunjunganId, desc: 'Obat & BHP', qty: 1, price: obatFee,
      },
    ];

    for (const d of details) {
      if (d.price > 0) {
        await client.query(
          `INSERT INTO simrs_billing_detail (
             id, billing_id, type, reference_id, description, quantity, unit_price, amount, created_by
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [uuidv4(), billing.id, d.type, d.refId, d.desc, d.qty, d.price, d.price, req.user.id],
        );
      }
    }

    return billing;
  });

  res.status(201).json({ success: true, data: result });
}));

// Proses pembayaran
router.post(
  '/payment',
  authenticate,
  requirePermission('billing.payment'),
  paymentRateLimiter,
  asyncHandler(async (req, res) => {
    const {
      billingId, amount, method, idempotencyKey, reference,
    } = req.body;

    if (!billingId || !amount || !method) {
      throw new AppError('VALIDASI_GAGAL', 'billingId, amount, method wajib diisi', 400);
    }

    if (amount <= 0) {
      throw new AppError('VALIDASI_GAGAL', 'Jumlah pembayaran harus > 0', 400);
    }

    // Cek idempotency key
    if (idempotencyKey) {
      const existing = await query(
        'SELECT result FROM simrs_idempotency_keys WHERE idempotency_key = $1',
        [idempotencyKey],
      );
      if (existing.rows.length) {
        return res.json({ success: true, data: existing.rows[0].result, idempotent: true });
      }
    }

    const result = await transaction(async (client) => {
    // Lock billing row
      const billingResult = await client.query(
        'SELECT * FROM simrs_billing WHERE id = $1 AND is_deleted = false FOR UPDATE',
        [billingId],
      );

      if (!billingResult.rows.length) {
        throw new AppError('BILLING_TIDAK_DITEMUKAN', 'Billing tidak ditemukan', 404);
      }

      const billing = billingResult.rows[0];

      if (billing.status === 'paid') {
        throw new AppError('BILLING_SUDAH_LUNAS', 'Billing sudah lunas', 409);
      }

      const dueAmount = parseFloat(billing.total) - parseFloat(billing.paid_amount);
      if (amount > dueAmount + 0.01) { // toleransi 1 sen
        throw new AppError('JUMLAH_MELEBIHI', `Jumlah melebihi tagihan. Sisa: ${dueAmount}`, 400);
      }

      const noBukti = await generateNoBukti(client);
      const ref = reference || `PAY-${uuidv4().slice(0, 8)}`;

      // Cek duplicate reference
      const refCheck = await client.query(
        'SELECT id FROM simrs_pembayaran WHERE reference = $1 AND is_deleted = false',
        [ref],
      );
      if (refCheck.rows.length) {
        throw new AppError('REFERENSI_DUPLIKAT', 'Referensi pembayaran sudah digunakan', 409);
      }

      const paymentResult = await client.query(
        `INSERT INTO simrs_pembayaran (id, billing_id, no_bukti, amount, method, status,
         reference, paid_at, verified_at, created_by)
       VALUES ($1, $2, $3, $4, $5, 'success', $6, NOW(), NOW(), $7) RETURNING *`,
        [uuidv4(), billingId, noBukti, amount, method, ref, req.user.id],
      );

      const payment = paymentResult.rows[0];

      // Update billing
      const newPaidAmount = parseFloat(billing.paid_amount) + amount;
      const isPaid = newPaidAmount >= parseFloat(billing.total);
      const newStatus = isPaid ? 'paid' : 'partial';
      await client.query(
        `UPDATE simrs_billing SET paid_amount = $1::numeric, status = $2::text,
         paid_at = CASE WHEN $3::boolean THEN NOW() ELSE paid_at END,
         updated_by = $4::char(36) WHERE id = $5::char(36)`,
        [newPaidAmount, newStatus, isPaid, req.user.id, billingId],
      );

      // Simpan idempotency key
      if (idempotencyKey) {
        await client.query(
          `INSERT INTO simrs_idempotency_keys (id, idempotency_key, status, result, completed_at, expires_at)
         VALUES ($1, $2, 'completed', $3, NOW(), NOW() + INTERVAL '24 hours')`,
          [uuidv4(), idempotencyKey, JSON.stringify(payment)],
        );
      }

      return { payment, billing: { ...billing, paid_amount: newPaidAmount, status: newStatus } };
    });

    res.status(201).json({ success: true, data: result });
  }),
);

// Refund pembayaran
router.post('/refund', authenticate, requirePermission('billing.refund'), asyncHandler(async (req, res) => {
  const {
    paymentId, amount, reason, idempotencyKey,
  } = req.body;

  if (!paymentId || !amount) {
    throw new AppError('VALIDASI_GAGAL', 'paymentId dan amount wajib diisi', 400);
  }

  if (idempotencyKey) {
    const existing = await query(
      'SELECT result FROM simrs_idempotency_keys WHERE idempotency_key = $1',
      [idempotencyKey],
    );
    if (existing.rows.length) {
      return res.json({ success: true, data: existing.rows[0].result, idempotent: true });
    }
  }

  const result = await transaction(async (client) => {
    // Lock payment & billing
    const paymentResult = await client.query(
      `SELECT p.*, b.pasien_id, b.total, b.paid_amount, b.status as billing_status
       FROM simrs_pembayaran p
       JOIN simrs_billing b ON b.id = p.billing_id
       WHERE p.id = $1 AND p.is_deleted = false AND b.is_deleted = false FOR UPDATE`,
      [paymentId],
    );

    if (!paymentResult.rows.length) {
      throw new AppError('PEMBAYARAN_TIDAK_DITEMUKAN', 'Pembayaran tidak ditemukan', 404);
    }

    const payment = paymentResult.rows[0];

    if (payment.status === 'refunded') {
      throw new AppError('SUDAH_DIKEMBALIKAN', 'Pembayaran sudah dikembalikan', 409);
    }

    if (amount > parseFloat(payment.amount)) {
      throw new AppError('JUMLAH_MELEBIHI', 'Jumlah refund melebihi pembayaran', 400);
    }

    const noBukti = `REF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`
      + `-${String(Date.now()).slice(-4)}`;

    const refundResult = await client.query(
      `INSERT INTO simrs_pembayaran (
         id, billing_id, no_bukti, amount, method, status, reference, notes, paid_at, created_by
       ) VALUES ($1, $2, $3, $4, $5, 'refunded', $6, $7, NOW(), $8) RETURNING *`,
      [
        uuidv4(), payment.billing_id, noBukti, -Math.abs(amount), payment.method,
        `REFUND-${payment.reference}`, reason, req.user.id,
      ],
    );

    const refund = refundResult.rows[0];

    // Update billing
    const newPaidAmount = parseFloat(payment.paid_amount) - amount;
    let newStatus;
    if (newPaidAmount <= 0) {
      newStatus = 'open';
    } else if (newPaidAmount >= parseFloat(payment.total)) {
      newStatus = 'paid';
    } else {
      newStatus = 'partial';
    }

    await client.query(
      'UPDATE simrs_billing SET paid_amount = $1, status = $2, updated_by = $3 WHERE id = $4',
      [newPaidAmount, newStatus, req.user.id, payment.billing_id],
    );

    if (idempotencyKey) {
      await client.query(
        `INSERT INTO simrs_idempotency_keys (id, idempotency_key, status, result, completed_at, expires_at)
         VALUES ($1, $2, 'completed', $3, NOW(), NOW() + INTERVAL '24 hours')`,
        [uuidv4(), idempotencyKey, JSON.stringify(refund)],
      );
    }

    return { refund, billing: { ...payment, paid_amount: newPaidAmount, status: newStatus } };
  });

  res.status(201).json({ success: true, data: result });
}));

export default router;

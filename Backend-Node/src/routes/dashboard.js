// Route Dashboard

import express from 'express';
import { query } from '../config/database.js';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Ringkasan dashboard
router.get('/summary', authenticate, requirePermission('dashboard-view'), asyncHandler(async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);

  const [
    pasienBaru,
    kunjunganHariIni,
    antreanMenunggu,
    labPending,
    billingOpen,
    pendapatanHariIni,
  ] = await Promise.all([
    query('SELECT COUNT(*) FROM simrs_pasien WHERE DATE(created_at) = $1 AND is_deleted = false', [today]),
    query('SELECT COUNT(*) FROM simrs_kunjungan WHERE tanggal = $1 AND is_deleted = false', [today]),
    query(
      'SELECT COUNT(*) FROM simrs_antrean WHERE tanggal = $1 AND status = \'waiting\' AND is_deleted = false',
      [today],
    ),
    query(
      'SELECT COUNT(*) FROM simrs_laboratorium '
      + 'WHERE status IN (\'ordered\', \'collected\', \'in_progress\') AND is_deleted = false',
    ),
    query(
      'SELECT COUNT(*) FROM simrs_billing WHERE status IN (\'open\', \'partial\') AND is_deleted = false',
    ),
    query(`SELECT COALESCE(SUM(amount), 0) as total FROM simrs_pembayaran
           WHERE DATE(paid_at) = $1 AND status = 'completed' AND is_deleted = false`, [today]),
  ]);

  res.json({
    success: true,
    data: {
      pasienBaru: parseInt(pasienBaru.rows[0].count, 10),
      kunjunganHariIni: parseInt(kunjunganHariIni.rows[0].count, 10),
      antreanMenunggu: parseInt(antreanMenunggu.rows[0].count, 10),
      labPending: parseInt(labPending.rows[0].count, 10),
      billingOpen: parseInt(billingOpen.rows[0].count, 10),
      pendapatanHariIni: parseFloat(pendapatanHariIni.rows[0].total),
    },
  });
}));

// Trend periode
router.get('/trends', authenticate, requirePermission('dashboard-view'), asyncHandler(async (req, res) => {
  const { period = '7d' } = req.query;
  const days = period === '30d' ? 30 : 7;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startStr = startDate.toISOString().slice(0, 10);

  const [kunjunganTrend, pendapatanTrend, pasienTrend] = await Promise.all([
    query(
      `SELECT tanggal, COUNT(*) as jumlah
       FROM simrs_kunjungan
       WHERE tanggal >= $1 AND is_deleted = false
       GROUP BY tanggal
       ORDER BY tanggal`,
      [startStr],
    ),
    query(
      `SELECT DATE(paid_at) as tanggal, COALESCE(SUM(amount), 0) as total
       FROM simrs_pembayaran
       WHERE paid_at >= $1 AND status = 'completed' AND is_deleted = false
       GROUP BY DATE(paid_at)
       ORDER BY DATE(paid_at)`,
      [startStr],
    ),
    query(
      `SELECT DATE(created_at) as tanggal, COUNT(*) as jumlah
       FROM simrs_pasien
       WHERE created_at >= $1 AND is_deleted = false
       GROUP BY DATE(created_at)
       ORDER BY DATE(created_at)`,
      [startStr],
    ),
  ]);

  // isi tanggal kosong dengan 0
  const fillDates = (rows, dateKey, valueKey) => {
    const map = new Map(rows.map((r) => [r[dateKey], parseFloat(r[valueKey]) || 0]));
    const result = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      result.push({ tanggal: key, [valueKey]: map.get(key) || 0 });
    }
    return result;
  };

  res.json({
    success: true,
    data: {
      kunjungan: fillDates(kunjunganTrend.rows, 'tanggal', 'jumlah'),
      pendapatan: fillDates(pendapatanTrend.rows, 'tanggal', 'total'),
      pasienBaru: fillDates(pasienTrend.rows, 'tanggal', 'jumlah'),
    },
  });
}));

// Status antrean real-time per poli
router.get('/queue', authenticate, requirePermission('dashboard-view'), asyncHandler(async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);

  const result = await query(
    `SELECT p.id as poli_id, p.nama as poli_nama, p.kode as poli_kode,
            COUNT(a.id) FILTER (WHERE a.status = 'waiting') as menunggu,
            COUNT(a.id) FILTER (WHERE a.status = 'called') as dipanggil,
            COUNT(a.id) FILTER (WHERE a.status = 'in_progress') as dalam_proses,
            COUNT(a.id) FILTER (WHERE a.status = 'completed') as selesai,
            MAX(a.no_antrean) as last_number
     FROM simrs_poli p
     LEFT JOIN simrs_antrean a ON a.poli_id = p.id AND a.tanggal = $1 AND a.is_deleted = false
     WHERE p.is_deleted = false AND p.is_active = true
     GROUP BY p.id, p.nama, p.kode
     ORDER BY p.sort_order, p.nama`,
    [today],
  );

  res.json({ success: true, data: result.rows });
}));

// Ringkasan laboratorium
router.get('/lab-summary', authenticate, requirePermission('dashboard-view'), asyncHandler(async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);

  const [byStatus, byType, turnaround] = await Promise.all([
    query(
      `SELECT status, COUNT(*) as jumlah
       FROM simrs_laboratorium
       WHERE DATE(created_at) = $1 AND is_deleted = false
       GROUP BY status`,
      [today],
    ),
    query(
      `SELECT j.type, COUNT(*) as jumlah
       FROM simrs_laboratorium l
       JOIN simrs_jenis_pemeriksaan_lab j ON j.id = l.jenis_pemeriksaan_id
       WHERE DATE(l.created_at) = $1 AND l.is_deleted = false
       GROUP BY j.type`,
      [today],
    ),
    query(
      `SELECT j.nama,
              AVG(EXTRACT(EPOCH FROM (l.completed_at - l.ordered_at))/3600) as avg_hours
       FROM simrs_laboratorium l
       JOIN simrs_jenis_pemeriksaan_lab j ON j.id = l.jenis_pemeriksaan_id
       WHERE l.completed_at IS NOT NULL
         AND l.ordered_at >= $1
         AND l.is_deleted = false
       GROUP BY j.nama
       ORDER BY avg_hours DESC
       LIMIT 10`,
      [new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)],
    ),
  ]);

  res.json({
    success: true,
    data: {
      byStatus: byStatus.rows,
      byType: byType.rows,
      turnaround: turnaround.rows,
    },
  });
}));

export default router;

// Dummy data for demo/offline mode. Used as fallback when API returns empty.
export const DUMMY_PASIEN = [
  { id: 'p1', no_rm: 'RM-0001', nik: '3175010001010001', full_name: 'Ahmad Santoso', gender: 'L', birth_date: '1985-01-01', phone: '081234567001', address: 'Jakarta', bpjs_number: '0001234567890', bpjs_class: '1' },
  { id: 'p2', no_rm: 'RM-0002', nik: '3175010002020002', full_name: 'Siti Aminah', gender: 'P', birth_date: '1990-02-02', phone: '081234567002', address: 'Bogor', bpjs_number: null, bpjs_class: null },
  { id: 'p3', no_rm: 'RM-0003', nik: '3175010003030003', full_name: 'Budi Prakoso', gender: 'L', birth_date: '1978-03-03', phone: '081234567003', address: 'Depok', bpjs_number: '0003456789012', bpjs_class: '2' },
  { id: 'p4', no_rm: 'RM-0004', nik: '3175010004040004', full_name: 'Dewi Lestari', gender: 'P', birth_date: '1995-04-04', phone: '081234567004', address: 'Tangerang', bpjs_number: null, bpjs_class: null },
  { id: 'p5', no_rm: 'RM-0005', nik: '3175010005050005', full_name: 'Rizki Hidayat', gender: 'L', birth_date: '1988-05-05', phone: '081234567005', address: 'Bekasi', bpjs_number: '0005678901234', bpjs_class: '3' },
];

export const DUMMY_USERS = [
  { id: 'u1', username: 'admin', email: 'admin@simrs.local', full_name: 'Administrator', phone: '081200000001', role: 'admin', is_active: true, created_at: '2026-01-01T08:00:00' },
  { id: 'u2', username: 'dr_umum', email: 'dokter@simrs.local', full_name: 'dr. Rina Wulandari', phone: '081200000002', role: 'dokter', is_active: true, created_at: '2026-01-02T08:00:00' },
  { id: 'u3', username: 'pendaftaran1', email: 'pendaftaran@simrs.local', full_name: 'Petugas Pendaftaran', phone: '081200000003', role: 'pendaftaran', is_active: true, created_at: '2026-01-03T08:00:00' },
  { id: 'u4', username: 'farmasi1', email: 'farmasi@simrs.local', full_name: 'Petugas Farmasi', phone: '081200000004', role: 'farmasi', is_active: false, created_at: '2026-01-04T08:00:00' },
];

export const DUMMY_ROLES = [
  { id: 'r1', name: 'admin', description: 'Administrator sistem', permissions: [{ id: 'p1' }, { id: 'p2' }] },
  { id: 'r2', name: 'dokter', description: 'Dokter pemeriksa', permissions: [{ id: 'p3' }] },
  { id: 'r3', name: 'pendaftaran', description: 'Petugas pendaftaran', permissions: [{ id: 'p4' }] },
];

export const DUMMY_PERMISSIONS = [
  { id: 'pm1', name: 'user.create', description: 'Tambah user', module: 'user' },
  { id: 'pm2', name: 'user.update', description: 'Ubah user', module: 'user' },
  { id: 'pm3', name: 'pasien.read', description: 'Lihat pasien', module: 'pasien' },
];

export const DUMMY_POLI = [
  { id: 'poli1', kode: 'UMU', nama: 'Poli Umum', deskripsi: 'Pelayanan umum', is_active: true },
  { id: 'poli2', kode: 'GIG', nama: 'Poli Gigi', deskripsi: 'Kesehatan gigi', is_active: true },
  { id: 'poli3', kode: 'ANK', nama: 'Poli Anak', deskripsi: 'Kesehatan anak', is_active: true },
  { id: 'poli4', kode: 'PD', nama: 'Poli Penyakit Dalam', deskripsi: 'Penyakit dalam', is_active: true },
  { id: 'poli5', kode: 'MAT', nama: 'Poli Mata', deskripsi: 'Kesehatan mata', is_active: true },
];

export const DUMMY_DOKTER = [
  { id: 'd1', nip: '198501010001', full_name: 'dr. Andi Wijaya, Sp.PD', specialist_id: 'sp1', specialist_nama: 'Spesialis Penyakit Dalam', poli_id: 'poli4', poli_nama: 'Poli Penyakit Dalam', is_active: true },
  { id: 'd2', nip: '199002020002', full_name: 'drg. Sari Melati', specialist_id: 'sp2', specialist_nama: 'Dokter Gigi', poli_id: 'poli2', poli_nama: 'Poli Gigi', is_active: true },
  { id: 'd3', nip: '197803030003', full_name: 'dr. Maya Putri, Sp.A', specialist_id: 'sp3', specialist_nama: 'Spesialis Anak', poli_id: 'poli3', poli_nama: 'Poli Anak', is_active: true },
  { id: 'd4', nip: '199504040004', full_name: 'dr. Bambang S., Sp.M', specialist_id: 'sp4', specialist_nama: 'Spesialis Mata', poli_id: 'poli5', poli_nama: 'Poli Mata', is_active: true },
  { id: 'd5', nip: '198805050005', full_name: 'dr. Rina Wulandari', specialist_id: 'sp5', specialist_nama: 'Dokter Umum', poli_id: 'poli1', poli_nama: 'Poli Umum', is_active: true },
];

export const DUMMY_SPECIALIST = [
  { id: 'sp1', kode: 'PD', nama: 'Spesialis Penyakit Dalam' },
  { id: 'sp2', kode: 'GIG', nama: 'Dokter Gigi' },
  { id: 'sp3', kode: 'ANK', nama: 'Spesialis Anak' },
  { id: 'sp4', kode: 'MAT', nama: 'Spesialis Mata' },
  { id: 'sp5', kode: 'UMU', nama: 'Dokter Umum' },
];

export const DUMMY_JADWAL = [
  { id: 'j1', dokter_id: 'd1', dokter_nama: 'dr. Andi Wijaya, Sp.PD', poli_id: 'poli4', poli_nama: 'Poli Penyakit Dalam', hari: 'Senin', jam_mulai: '08:00', jam_selesai: '12:00', kuota: 20 },
  { id: 'j2', dokter_id: 'd5', dokter_nama: 'dr. Rina Wulandari', poli_id: 'poli1', poli_nama: 'Poli Umum', hari: 'Senin', jam_mulai: '08:00', jam_selesai: '14:00', kuota: 30 },
];

export const DUMMY_TINDAKAN = [
  { id: 't1', kode: 'T01', nama: 'Pemeriksaan Umum', category_id: 'tc1', category_nama: 'Konsultasi', tarif: 150000 },
  { id: 't2', kode: 'T02', nama: 'Pembersihan Karang Gigi', category_id: 'tc2', category_nama: 'Prosedur', tarif: 350000 },
];

export const DUMMY_TINDAKAN_CAT = [
  { id: 'tc1', kode: 'KONS', nama: 'Konsultasi' },
  { id: 'tc2', kode: 'PROS', nama: 'Prosedur' },
];

export const DUMMY_DIAGNOSA = [
  { id: 'dg1', kode: 'J00', nama: 'Rhinitis Akut' },
  { id: 'dg2', kode: 'K02', nama: 'Karies Dental' },
  { id: 'dg3', kode: 'A09', nama: 'Gastroenteritis' },
  { id: 'dg4', kode: 'H25', nama: 'Katarak' },
  { id: 'dg5', kode: 'E11', nama: 'Diabetes Melitus Tipe 2' },
];

export const DUMMY_ANTREAN = [
  { id: 'a1', no_antrean: 'A001', poli_id: 'poli1', poli_nama: 'Poli Umum', pasien_nama: 'Ahmad Santoso', no_rm: 'RM-0001', status: 'waiting', dokter_nama: 'dr. Rina Wulandari', created_at: '2026-11-25T08:15:00' },
  { id: 'a2', no_antrean: 'A002', poli_id: 'poli1', poli_nama: 'Poli Umum', pasien_nama: 'Siti Aminah', no_rm: 'RM-0002', status: 'called', dokter_nama: 'dr. Rina Wulandari', created_at: '2026-11-25T08:22:00' },
  { id: 'a3', no_antrean: 'B001', poli_id: 'poli2', poli_nama: 'Poli Gigi', pasien_nama: 'Budi Prakoso', no_rm: 'RM-0003', status: 'in_progress', dokter_nama: 'drg. Sari Melati', created_at: '2026-11-25T08:30:00' },
  { id: 'a4', no_antrean: 'C001', poli_id: 'poli3', poli_nama: 'Poli Anak', pasien_nama: 'Dewi Lestari', no_rm: 'RM-0004', status: 'waiting', dokter_nama: 'dr. Maya Putri, Sp.A', created_at: '2026-11-25T08:35:00' },
  { id: 'a5', no_antrean: 'A003', poli_id: 'poli1', poli_nama: 'Poli Umum', pasien_nama: 'Rizki Hidayat', no_rm: 'RM-0005', status: 'completed', dokter_nama: 'dr. Rina Wulandari', created_at: '2026-11-25T08:40:00' },
  { id: 'a6', no_antrean: 'D001', poli_id: 'poli4', poli_nama: 'Poli Penyakit Dalam', pasien_nama: 'Ahmad Santoso', no_rm: 'RM-0001', status: 'waiting', dokter_nama: 'dr. Andi Wijaya, Sp.PD', created_at: '2026-11-25T08:45:00' },
];

export const DUMMY_KUNJUNGAN = [
  { id: 'k1', no_kunjungan: 'KUN-20261125-001', pasien_id: 'p1', pasien_nama: 'Ahmad Santoso', poli_id: 'poli1', poli: { nama: 'Poli Umum' }, poli_nama: 'Poli Umum', dokter_id: 'd5', dokter: { full_name: 'dr. Rina Wulandari' }, dokter_nama: 'dr. Rina Wulandari', tanggal: '2026-11-25', status: 'waiting', no_antrean: 'A001', is_bpjs: true },
  { id: 'k2', no_kunjungan: 'KUN-20261125-002', pasien_id: 'p2', pasien_nama: 'Siti Aminah', poli_id: 'poli2', poli: { nama: 'Poli Gigi' }, poli_nama: 'Poli Gigi', dokter_id: 'd2', dokter: { full_name: 'drg. Sari Melati' }, dokter_nama: 'drg. Sari Melati', tanggal: '2026-11-25', status: 'in_progress', no_antrean: 'B001', is_bpjs: false },
  { id: 'k3', no_kunjungan: 'KUN-20261125-003', pasien_id: 'p3', pasien_nama: 'Budi Prakoso', poli_id: 'poli3', poli: { nama: 'Poli Anak' }, poli_nama: 'Poli Anak', dokter_id: 'd3', dokter: { full_name: 'dr. Maya Putri, Sp.A' }, dokter_nama: 'dr. Maya Putri, Sp.A', tanggal: '2026-11-25', status: 'waiting', no_antrean: 'C001', is_bpjs: true },
  { id: 'k4', no_kunjungan: 'KUN-20261125-004', pasien_id: 'p4', pasien_nama: 'Dewi Lestari', poli_id: 'poli5', poli: { nama: 'Poli Mata' }, poli_nama: 'Poli Mata', dokter_id: 'd4', dokter: { full_name: 'dr. Bambang S., Sp.M' }, dokter_nama: 'dr. Bambang S., Sp.M', tanggal: '2026-11-25', status: 'completed', no_antrean: 'D001', is_bpjs: false },
];

export const DUMMY_PEREKSAAN = [
  { id: 'pe1', kunjungan_id: 'k1', created_at: '2026-11-25T09:10:00', status: 'completed', diagnosis_utama_nama: 'J00 - Rhinitis Akut', diagnosis_sekunder: [{ nama: 'J30 - Rinitis Alergi' }], tinggi_badan: 170, berat_badan: 65 },
  { id: 'pe2', kunjungan_id: 'k2', created_at: '2026-11-25T09:25:00', status: 'in_progress', diagnosis_utama_nama: 'K02 - Karies Dental', diagnosis_sekunder: [], tinggi_badan: 160, berat_badan: 55 },
  { id: 'pe3', kunjungan_id: 'k3', created_at: '2026-11-25T09:40:00', status: 'waiting', diagnosis_utama_nama: 'A09 - Gastroenteritis', diagnosis_sekunder: [], tinggi_badan: null, berat_badan: null },
  { id: 'pe4', kunjungan_id: 'k4', created_at: '2026-11-25T09:55:00', status: 'finalized', diagnosis_utama_nama: 'H25 - Katarak', diagnosis_sekunder: [{ nama: 'H26 - Katarak Sinaptik' }], tinggi_badan: 158, berat_badan: 52 },
];

export const DUMMY_LAB_JENIS = [
  { id: 'lj1', kode: 'LAB-HEM', nama: 'Hematologi Lengkap', category_nama: 'Hematologi', type: 'hematologi', sample_type: 'darah', harga: 85000 },
  { id: 'lj2', kode: 'LAB-GLU', nama: 'Glukosa Darah', category_nama: 'Kimia', type: 'kimia', sample_type: 'darah', harga: 45000 },
  { id: 'lj3', kode: 'LAB-URI', nama: 'Urinalisis', category_nama: 'Urinalisis', type: 'urinalisis', sample_type: 'urine', harga: 35000 },
  { id: 'lj4', kode: 'LAB-KOL', nama: 'Kolesterol Total', category_nama: 'Kimia', type: 'kimia', sample_type: 'darah', harga: 55000 },
];

export const DUMMY_LAB = [
  { id: 'l1', no_order: 'LAB-001', kunjungan_id: 'k1', jenis_nama: 'Hematologi Lengkap', type: 'hematologi', dokter_nama: 'dr. Rina Wulandari', ordered_at: '2026-11-25T09:15:00', status: 'ordered', result: null, interpretation: null },
  { id: 'l2', no_order: 'LAB-002', kunjungan_id: 'k2', jenis_nama: 'Glukosa Darah', type: 'kimia', dokter_nama: 'drg. Sari Melati', ordered_at: '2026-11-25T09:30:00', status: 'in_progress', result: null, interpretation: null },
  { id: 'l3', no_order: 'LAB-003', kunjungan_id: 'k3', jenis_nama: 'Urinalisis', type: 'urinalisis', dokter_nama: 'dr. Maya Putri, Sp.A', ordered_at: '2026-11-25T09:45:00', status: 'completed', result: 'pH 6.0, berat jenis 1.020, protein negatif, glukosa negatif', interpretation: 'Dalam batas normal' },
  { id: 'l4', no_order: 'LAB-004', kunjungan_id: 'k4', jenis_nama: 'Kolesterol Total', type: 'kimia', dokter_nama: 'dr. Bambang S., Sp.M', ordered_at: '2026-11-25T10:00:00', status: 'verified', result: 'Kolesterol total 210 mg/dL', interpretation: 'Sedikit meningkat' },
];

export const DUMMY_LAB_CAT = [
  { id: 'lc1', kode: 'HEM', nama: 'Hematologi' },
  { id: 'lc2', kode: 'KIM', nama: 'Kimia' },
];

export const DUMMY_OBAT = [
  { id: 'o1', kode: 'OBT-001', nama: 'Paracetamol 500mg', kategori_id: 'oc1', kategori_nama: 'Analgesik', satuan: 'tablet', stok: 120, stok_minimum: 20, harga_beli: 3000, harga_jual: 5000, is_active: true, is_generik: true },
  { id: 'o2', kode: 'OBT-002', nama: 'Amoxicillin 500mg', kategori_id: 'oc2', kategori_nama: 'Antibiotik', satuan: 'capsule', stok: 8, stok_minimum: 15, harga_beli: 10000, harga_jual: 15000, is_active: true, is_generik: true },
  { id: 'o3', kode: 'OBT-003', nama: 'Omeprazole 20mg', kategori_id: 'oc3', kategori_nama: 'Gastro', satuan: 'capsule', stok: 45, stok_minimum: 10, harga_beli: 8000, harga_jual: 12000, is_active: true, is_generik: true },
  { id: 'o4', kode: 'OBT-004', nama: 'Cetirizine 10mg', kategori_id: 'oc4', kategori_nama: 'Antihistamin', satuan: 'tablet', stok: 5, stok_minimum: 10, harga_beli: 5000, harga_jual: 8000, is_active: true, is_generik: false },
  { id: 'o5', kode: 'OBT-005', nama: 'Mefenamic Acid 500mg', kategori_id: 'oc1', kategori_nama: 'Analgesik', satuan: 'tablet', stok: 60, stok_minimum: 15, harga_beli: 4000, harga_jual: 7000, is_active: true, is_generik: true },
];

export const DUMMY_OBAT_CAT = [
  { id: 'oc1', kode: 'ANG', nama: 'Analgesik' },
  { id: 'oc2', kode: 'ANT', nama: 'Antibiotik' },
];

export const DUMMY_RESEP = [
  { id: 'r1', no_resep: 'RSP-20261125-001', kunjungan_id: 'k1', pasien_nama: 'Ahmad Santoso', dokter_nama: 'dr. Rina Wulandari', status: 'prescribed', created_at: '2026-11-25T09:20:00', total_items: 1, details: [{ id: 'rd1', obat_nama: 'Paracetamol 500mg', quantity: 3, dispensed_quantity: 0, dose: '3x1', frequency: '3x sehari', duration: 3, instructions: 'Sesudah makan', status: 'prescribed' }] },
  { id: 'r2', no_resep: 'RSP-20261125-002', kunjungan_id: 'k2', pasien_nama: 'Siti Aminah', dokter_nama: 'drg. Sari Melati', status: 'submitted', created_at: '2026-11-25T09:35:00', total_items: 1, details: [{ id: 'rd2', obat_nama: 'Amoxicillin 500mg', quantity: 9, dispensed_quantity: 0, dose: '3x1', frequency: '3x sehari', duration: 3, instructions: 'Sebelum makan', status: 'submitted' }] },
  { id: 'r3', no_resep: 'RSP-20261125-003', kunjungan_id: 'k3', pasien_nama: 'Budi Prakoso', dokter_nama: 'dr. Maya Putri, Sp.A', status: 'dispensed', created_at: '2026-11-25T09:50:00', total_items: 1, details: [{ id: 'rd3', obat_nama: 'Omeprazole 20mg', quantity: 2, dispensed_quantity: 2, dose: '2x1', frequency: '2x sehari', duration: 2, instructions: 'Sebelum makan', status: 'dispensed' }] },
  { id: 'r4', no_resep: 'RSP-20261125-004', kunjungan_id: 'k4', pasien_nama: 'Dewi Lestari', dokter_nama: 'dr. Bambang S., Sp.M', status: 'dispensed', created_at: '2026-11-25T10:05:00', total_items: 1, details: [{ id: 'rd4', obat_nama: 'Cetirizine 10mg', quantity: 1, dispensed_quantity: 1, dose: '1x1', frequency: '1x sehari', duration: 1, instructions: 'Malam hari', status: 'dispensed' }] },
];

export const DUMMY_BILLING = [
  { id: 'b1', no_billing: 'INV-20261125-001', kunjungan_id: 'k1', pasien_nama: 'Ahmad Santoso', poli_nama: 'Poli Umum', total: 185000, paid_amount: 0, status: 'open', tanggal: '2026-11-25', details: [{ id: 'bd1', type: 'pendaftaran', description: 'Biaya pendaftaran', quantity: 1, unit_price: 50000, amount: 50000 }, { id: 'bd2', type: 'tindakan', description: 'Pemeriksaan umum', quantity: 1, unit_price: 135000, amount: 135000 }], payments: [] },
  { id: 'b2', no_billing: 'INV-20261125-002', kunjungan_id: 'k2', pasien_nama: 'Siti Aminah', poli_nama: 'Poli Gigi', total: 420000, paid_amount: 420000, status: 'paid', tanggal: '2026-11-25', details: [{ id: 'bd3', type: 'tindakan', description: 'Pembersihan karang gigi', quantity: 1, unit_price: 350000, amount: 350000 }], payments: [{ id: 'pay1', no_bukti: 'PAY-001', amount: 420000, method: 'cash', status: 'success', paid_at: '2026-11-25T10:10:00', reference: 'CASH-001' }] },
  { id: 'b3', no_billing: 'INV-20261125-003', kunjungan_id: 'k3', pasien_nama: 'Budi Prakoso', poli_nama: 'Poli Anak', total: 275000, paid_amount: 100000, status: 'partial', tanggal: '2026-11-25', details: [{ id: 'bd4', type: 'tindakan', description: 'Pemeriksaan anak', quantity: 1, unit_price: 275000, amount: 275000 }], payments: [{ id: 'pay2', no_bukti: 'PAY-002', amount: 100000, method: 'transfer', status: 'success', paid_at: '2026-11-25T10:15:00', reference: 'TRF-002' }] },
  { id: 'b4', no_billing: 'INV-20261125-004', kunjungan_id: 'k4', pasien_nama: 'Dewi Lestari', poli_nama: 'Poli Mata', total: 560000, paid_amount: 560000, status: 'paid', tanggal: '2026-11-25', details: [{ id: 'bd5', type: 'tindakan', description: 'Pemeriksaan mata', quantity: 1, unit_price: 560000, amount: 560000 }], payments: [{ id: 'pay3', no_bukti: 'PAY-003', amount: 560000, method: 'card', status: 'success', paid_at: '2026-11-25T10:20:00', reference: 'CARD-003' }] },
];

export const DUMMY_LAPORAN_KUNJUNGAN = [
  { id: 'lk1', tanggal: '2026-11-25', poli_nama: 'Poli Umum', dokter_nama: 'dr. Rina Wulandari', jumlah: 42 },
  { id: 'lk2', tanggal: '2026-11-25', poli_nama: 'Poli Gigi', dokter_nama: 'drg. Sari Melati', jumlah: 28 },
  { id: 'lk3', tanggal: '2026-11-25', poli_nama: 'Poli Anak', dokter_nama: 'dr. Maya Putri, Sp.A', jumlah: 35 },
  { id: 'lk4', tanggal: '2026-11-25', poli_nama: 'Poli Penyakit Dalam', dokter_nama: 'dr. Andi Wijaya, Sp.PD', jumlah: 19 },
  { id: 'lk5', tanggal: '2026-11-25', poli_nama: 'Poli Mata', dokter_nama: 'dr. Bambang S., Sp.M', jumlah: 12 },
];

export const DUMMY_PENDAPATAN = {
  summary: { total_billing: 18450000, total_paid: 16250000, outstanding: 2200000, total_bills: 136 },
  by_poli: [
    { nama: 'Poli Umum', total: 4200000, paid: 3900000, count: 42 },
    { nama: 'Poli Gigi', total: 3800000, paid: 3500000, count: 28 },
    { nama: 'Poli Anak', total: 3100000, paid: 2800000, count: 35 },
    { nama: 'Poli Penyakit Dalam', total: 2900000, paid: 2500000, count: 19 },
    { nama: 'Poli Mata', total: 2450000, paid: 2100000, count: 12 },
  ],
  by_payment_method: [
    { method: 'cash', count: 52, total: 6200000 },
    { method: 'bpjs', count: 38, total: 5800000 },
    { method: 'transfer', count: 24, total: 3950000 },
    { method: 'card', count: 12, total: 1500000 },
    { method: 'e-wallet', count: 10, total: 1000000 },
  ],
  daily: [
    { tanggal: '2026-11-19', billing: 2100000, paid: 1900000 },
    { tanggal: '2026-11-20', billing: 2450000, paid: 2200000 },
    { tanggal: '2026-11-21', billing: 1980000, paid: 1800000 },
    { tanggal: '2026-11-22', billing: 2670000, paid: 2400000 },
    { tanggal: '2026-11-23', billing: 2890000, paid: 2600000 },
    { tanggal: '2026-11-24', billing: 3120000, paid: 2800000 },
    { tanggal: '2026-11-25', billing: 3240000, paid: 3000000 },
  ],
  period: { start_date: '2026-11-19', end_date: '2026-11-25' },
};

export function withDummy(data, fallback) {
  return data && (Array.isArray(data) ? data.length > 0 : true) ? data : fallback;
}

export const DUMMY_DASHBOARD_STATS = {
  pasienBaru: 24, pasienBaruTrend: 12,
  kunjunganHariIni: 136, kunjunganTrend: 8,
  antreanAktif: 18, antreanTrend: -5,
  pemeriksaanSelesai: 98, pemeriksaanTrend: 15,
  labSelesai: 42, labTrend: 6,
  pendapatanHariIni: 18450000, pendapatanTrend: 9.5,
};

export const DUMMY_DASHBOARD_CHARTS = {
  kunjunganTrend: [
    { date: '19 Nov', total: 120, new_patients: 18, revisits: 102 },
    { date: '20 Nov', total: 145, new_patients: 22, revisits: 123 },
    { date: '21 Nov', total: 132, new_patients: 16, revisits: 116 },
    { date: '22 Nov', total: 158, new_patients: 25, revisits: 133 },
    { date: '23 Nov', total: 149, new_patients: 20, revisits: 129 },
    { date: '24 Nov', total: 171, new_patients: 28, revisits: 143 },
    { date: '25 Nov', total: 136, new_patients: 24, revisits: 112 },
  ],
  revenueTrend: [
    { date: '19 Nov', total: 2100000, target: 2000000 },
    { date: '20 Nov', total: 2450000, target: 2200000 },
    { date: '21 Nov', total: 1980000, target: 2100000 },
    { date: '22 Nov', total: 2670000, target: 2300000 },
    { date: '23 Nov', total: 2890000, target: 2400000 },
    { date: '24 Nov', total: 3120000, target: 2500000 },
    { date: '25 Nov', total: 3240000, target: 2600000 },
  ],
  poliDistribution: [
    { poli: 'Poli Umum', count: 42 },
    { poli: 'Poli Gigi', count: 28 },
    { poli: 'Poli Anak', count: 35 },
    { poli: 'Poli Penyakit Dalam', count: 19 },
    { poli: 'Poli Mata', count: 12 },
  ],
  queueByPoli: [
    { poli: 'Poli Umum', waiting: 8, in_progress: 3, completed: 31 },
    { poli: 'Poli Gigi', waiting: 5, in_progress: 2, completed: 21 },
    { poli: 'Poli Anak', waiting: 6, in_progress: 2, completed: 27 },
    { poli: 'Poli PD', waiting: 4, in_progress: 2, completed: 24 },
    { poli: 'Poli Mata', waiting: 2, in_progress: 1, completed: 15 },
  ],
  labPharmacyHourly: [
    { hour: '08:00', lab_orders: 5, pharmacy_prescriptions: 8 },
    { hour: '09:00', lab_orders: 12, pharmacy_prescriptions: 18 },
    { hour: '10:00', lab_orders: 18, pharmacy_prescriptions: 25 },
    { hour: '11:00', lab_orders: 22, pharmacy_prescriptions: 32 },
    { hour: '12:00', lab_orders: 14, pharmacy_prescriptions: 20 },
    { hour: '13:00', lab_orders: 16, pharmacy_prescriptions: 24 },
    { hour: '14:00', lab_orders: 20, pharmacy_prescriptions: 28 },
    { hour: '15:00', lab_orders: 10, pharmacy_prescriptions: 15 },
  ],
};

export const DUMMY_DASHBOARD_ACTIVITIES = [
  { id: 1, type: 'queue', description: 'Antrean A001 dipanggil ke Poli Umum', patient_name: 'Ahmad Santoso', created_at: new Date().toISOString(), status: 'completed' },
  { id: 2, type: 'lab', description: 'Hasil lab LAB-003 selesai diperiksa', patient_name: 'Budi Prakoso', created_at: new Date().toISOString(), status: 'completed' },
  { id: 3, type: 'billing', description: 'Pembayaran INV-20261125-002 diterima', patient_name: 'Siti Aminah', created_at: new Date().toISOString(), status: 'completed' },
  { id: 4, type: 'queue', description: 'Pasien baru mendaftar di Poli Anak', patient_name: 'Dewi Lestari', created_at: new Date().toISOString(), status: 'pending' },
  { id: 5, type: 'pharmacy', description: 'Resep RSP-20261125-003 disiapkan farmasi', patient_name: 'Budi Prakoso', created_at: new Date().toISOString(), status: 'completed' },
];
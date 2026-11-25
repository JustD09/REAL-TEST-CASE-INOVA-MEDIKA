# SIMRS API Documentation (Postman)

Dokumentasi endpoint API untuk sistem SIMRS. Base URL:
- **Yii2 API**: `http://localhost:8443`
- **Node.js API**: `http://localhost:3001`

Semua endpoint membutuhkan autentikasi Bearer Token (JWT) kecuali `/auth/login`.

---

## 📋 Autentikasi (Yii2)

| Method | Endpoint | Deskripsi | Body / Params |
|--------|----------|-----------|---------------|
| POST | `/auth/login` | Login user | `{ "username": "string", "password": "string" }` |
| POST | `/auth/refresh-token` | Refresh access token | `{ "refresh_token": "string" }` |
| GET | `/auth/me` | Get current user profile | - |
| POST | `/auth/logout` | Logout | `{ "refresh_token": "string" }` |

**Response Login:**
```json
{
  "success": true,
  "data": {
    "user": { "id", "username", "email", "full_name", "roles", "permissions", "profile", "dokter", "pasien" },
    "access_token": "jwt_token",
    "refresh_token": "jwt_refresh_token"
  }
}
```

---

## 📋 Master Data (Yii2)

### Pasien
| Method | Endpoint | Permission | Body / Params |
|--------|----------|------------|---------------|
| GET | `/pasien` | `master-pasien-view` | `search`, `page`, `perPage` |
| GET | `/pasien/{id}` | `master-pasien-view` | - |
| POST | `/pasien` | `master-pasien-create` | `{ nik, full_name, gender, birth_date, phone, email?, address, bpjs_number?, bpjs_class? }` |
| PUT | `/pasien/{id}` | `master-pasien-update` | Same as create |
| DELETE | `/pasien/{id}` | `master-pasien-delete` | - |
| GET | `/pasien/{id}/kunjungan` | `master-pasien-view` | `page`, `perPage` |

### Poli
| Method | Endpoint | Permission | Body / Params |
|--------|----------|------------|---------------|
| GET | `/poli` | `master-poli-view` | `is_active`, `page`, `perPage` |
| GET | `/poli/{id}` | `master-poli-view` | - |
| POST | `/poli` | `master-poli-create` | `{ kode, nama, type, parent_id?, description?, location?, phone?, registration_fee?, is_active?, sort_order? }` |
| PUT | `/poli/{id}` | `master-poli-update` | Same as create |
| DELETE | `/poli/{id}` | `master-poli-delete` | - |

### Dokter
| Method | Endpoint | Permission | Body / Params |
|--------|----------|------------|---------------|
| GET | `/dokter` | `master-dokter-view` | `is_active`, `page`, `perPage` |
| GET | `/dokter/{id}` | `master-dokter-view` | - |
| POST | `/dokter` | `master-dokter-create` | `{ user_id, nip, full_name, specialist_id, str_number?, str_valid_until?, sip_number?, sip_valid_until?, phone?, email?, address?, photo?, education?, experience_years?, consultation_fee?, is_active?, notes? }` |
| PUT | `/dokter/{id}` | `master-dokter-update` | Same as create |
| DELETE | `/dokter/{id}` | `master-dokter-delete` | - |

### Obat
| Method | Endpoint | Permission | Body / Params |
|--------|----------|------------|---------------|
| GET | `/obat` | `master-obat-view` | `search`, `category_id`, `is_active`, `page`, `perPage` |
| GET | `/obat/{id}` | `master-obat-view` | - |
| POST | `/obat` | `master-obat-create` | `{ kode, nama, generic_name, type, category_id, unit, strength, manufacturer, purchase_price, selling_price, bpjs_price, min_stock, max_stock, current_stock, expired_date, batch_number, location, is_controlled }` |
| PUT | `/obat/{id}` | `master-obat-update` | Same as create |
| DELETE | `/obat/{id}` | `master-obat-delete` | - |

---

## 📋 Transaksi - Pendaftaran (Yii2)

### Kunjungan
| Method | Endpoint | Permission | Body / Params |
|--------|----------|------------|---------------|
| GET | `/kunjungan` | `transaksi-pendaftaran-view` | `poli_id`, `dokter_id`, `status`, `date_from`, `date_to`, `page`, `perPage` |
| GET | `/kunjungan/{id}` | `transaksi-pendaftaran-view` | - |
| POST | `/kunjungan` | `transaksi-pendaftaran-create` | `{ pasien_id, poli_id, dokter_id?, tanggal, keluhan?, is_bpjs? }` |
| PUT | `/kunjungan/{id}` | `transaksi-pendaftaran-update` | Same as create |
| POST | `/kunjungan` (action:call) | `transaksi-antrean-call` | `{ id, action: "call" }` |
| POST | `/kunjungan` (action:cancel) | `transaksi-pendaftaran-cancel` | `{ id, action: "cancel" }` |

### Antrean
| Method | Endpoint | Permission | Body / Params |
|--------|----------|------------|---------------|
| GET | `/antrean/queue` | `transaksi-antrean-view` | `poli_id`, `date` |
| POST | `/antrean/{id}/call` | `transaksi-antrean-call` | - |
| POST | `/antrean/{id}/recall` | `transaksi-antrean-call` | - |
| POST | `/antrean/{id}/skip` | `transaksi-antrean-skip` | - |
| POST | `/antrean/{id}/complete` | `transaksi-antrean-view` | - |
| POST | `/antrean/{id}/cancel` | `transaksi-pendaftaran-cancel` | - |

---

## 📋 Transaksi - Pemeriksaan (Yii2)

| Method | Endpoint | Permission | Body / Params |
|--------|----------|------------|---------------|
| GET | `/pemeriksaan` | `transaksi-pemeriksaan-view` | `kunjungan_id`, `page`, `perPage` |
| GET | `/pemeriksaan/{id}` | `transaksi-pemeriksaan-view` | - |
| POST | `/pemeriksaan` | `transaksi-pemeriksaan-create` | `{ kunjungan_id, dokter_id, anamnesis, diagnosis_utama_id?, diagnosis_sekunder_ids?, tindakan_ids?, resep?, catatan? }` |
| PUT | `/pemeriksaan/{id}` | `transaksi-pemeriksaan-update` | Same as create |
| POST | `/pemeriksaan` (action:finalize) | `transaksi-pemeriksaan-finalize` | `{ id, action: "finalize", version }` |
| POST | `/pemeriksaan` (action:save_vital_signs) | `transaksi-pemeriksaan-update` | `{ id, action: "save_vital_signs", vital_signs: { td, hr, rr, suhu, spo2, bb, tb, gcs } }` |

---

## 📋 Transaksi - Tindakan Medis (Yii2)

| Method | Endpoint | Permission | Body / Params |
|--------|----------|------------|---------------|
| GET | `/tindakan-medis` | `transaksi-tindakan-view` | `kunjungan_id`, `page`, `perPage` |
| POST | `/tindakan-medis` | `transaksi-tindakan-create` | `{ kunjungan_id, tindakan_id, dokter_id, petugas_id?, quantity?, kelas, pembayaran_type? }` |
| PUT | `/tindakan-medis/{id}` | `transaksi-tindakan-update` | Same as create |
| POST | `/tindakan-medis/{id}/complete` | `transaksi-tindakan-complete` | - |

---

## 📋 Transaksi - Resep (Yii2)

| Method | Endpoint | Permission | Body / Params |
|--------|----------|------------|---------------|
| GET | `/resep` | `transaksi-resep-view` | `kunjungan_id`, `page`, `perPage` |
| POST | `/resep` | `transaksi-resep-create` | `{ kunjungan_id, dokter_id, type, resep_detail: [{ obat_id, quantity, harga_satuan, frequency, route, duration, instructions }] }` |
| PUT | `/resep/{id}` | `transaksi-resep-update` | Same as create |
| POST | `/resep` (action:submit) | `transaksi-resep-update` | `{ id, action: "submit" }` |
| POST | `/resep` (action:dispense) | `transaksi-resep-dispense` | `{ id, action: "dispense", details: [{ detail_id, quantity_dispensed }] }` |

---

## 📋 Transaksi - Laboratorium (Node.js)

Base: `http://localhost:3001/api/lab`

| Method | Endpoint | Permission | Body / Params |
|--------|----------|------------|---------------|
| GET | `/` | `lab.read` | `kunjunganId`, `page`, `limit` |
| POST | `/order` | `lab.order` | `{ kunjunganId, jenisPemeriksaanIds: [] }` |
| POST | `/{id}/collect` | `lab.collect` | - |
| PATCH | `/{id}/status` | `lab.update` | `{ status: "processing" \| "completed" }` |
| POST | `/{id}/verify` | `lab.verify` | - |
| POST | `/{id}/cancel` | `lab.cancel` | - |

---

## 📋 Transaksi - Billing & Pembayaran (Node.js)

Base: `http://localhost:3001/api/billing`

| Method | Endpoint | Permission | Body / Params |
|--------|----------|------------|---------------|
| GET | `/` | `billing.read` | `kunjunganId`, `page`, `limit` |
| GET | `/{kunjunganId}` | `billing.read` | - |
| POST | `/` | `billing.create` | `{ kunjunganId }` |
| POST | `/payment` | `billing.payment` | `{ billingId, amount, method, reference? }` |
| POST | `/refund` | `billing.refund` | `{ billingId, amount, reason }` |

---

## 📋 Laporan (Yii2)

Base: `/laporan/{type}`

| Method | Endpoint | Permission | Params |
|--------|----------|------------|--------|
| GET | `/laporan/kunjungan` | `laporan-kunjungan-view` | `date_from`, `date_to`, `poli_id`, `dokter_id`, `page`, `perPage` |
| GET | `/laporan/poli` | `laporan-poli-view` | `date_from`, `date_to`, `page`, `perPage` |
| GET | `/laporan/dokter` | `laporan-dokter-view` | `date_from`, `date_to`, `page`, `perPage` |
| GET | `/laporan/tindakan` | `laporan-tindakan-view` | `date_from`, `date_to`, `poli_id`, `dokter_id`, `page`, `perPage` |
| GET | `/laporan/obat` | `laporan-obat-view` | `date_from`, `date_to`, `page`, `perPage` |
| GET | `/laporan/pendapatan` | `laporan-pendapatan-view` | `date_from`, `date_to`, `poli_id`, `dokter_id` |
| GET | `/laporan/piutang` | `laporan-piutang-view` | `date_from`, `date_to`, `page`, `perPage` |
| GET | `/laporan/stok` | `laporan-stok-view` | `low_only`, `page`, `perPage` |

**Catatan:** Endpoint `/laporan/pendapatan` mengembalikan object dengan struktur `period`, `summary`, `by_poli`, `by_payment_method`, `daily` (bukan array paginated).

---

## 📋 Pengaturan (Yii2)

### User Management
| Method | Endpoint | Permission | Body / Params |
|--------|----------|------------|---------------|
| GET | `/user` | `pengaturan-user-view` | `search`, `page`, `perPage` |
| POST | `/user` | `pengaturan-user-create` | `{ username, email, password, status, roles: [] }` |
| PUT | `/user/{id}` | `pengaturan-user-update` | Same as create (password optional) |
| DELETE | `/user/{id}` | `pengaturan-user-delete` | - |

### RBAC
| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/rbac/roles` | `pengaturan-role-view` |
| GET | `/rbac/permissions` | `pengaturan-role-view` |
| POST | `/rbac/assign` | `pengaturan-role-assign` | `{ username, role }` |
| POST | `/rbac/revoke` | `pengaturan-role-assign` | `{ username, role }` |

### Integrasi
| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/integration/logs` | `integration.read` |

---

## 📋 Dashboard (Node.js)

Base: `http://localhost:3001/api/dashboard`

| Method | Endpoint | Permission | Params |
|--------|----------|------------|--------|
| GET | `/summary` | `dashboard-view` | - |
| GET | `/trends` | `dashboard-view` | `period` (7d, 30d, 90d) |
| GET | `/queue` | `dashboard-view` | - |
| GET | `/lab-summary` | `dashboard-view` | - |

---

## 🔐 Role & Permission Matrix (Demo)

| Role | Laporan Permissions |
|------|---------------------|
| `admin` | Semua laporan |
| `petugas_pendaftaran` | `laporan-kunjungan-view`, `laporan-poli-view` |
| `dokter` | `laporan-kunjungan-view`, `laporan-dokter-view`, `laporan-tindakan-view` |
| `petugas_farmasi` | `laporan-obat-view`, `laporan-stok-view` |
| `petugas_laboratorium` | `laporan-kunjungan-view`, `laporan-tindakan-view` |
| `kasir` | `laporan-pendapatan-view`, `laporan-piutang-view` |

---

## 🧪 Demo Accounts

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | admin |
| `dr_ahmad` | `dokter123` | dokter |
| `dr_siti` | `dokter123` | dokter |
| `dr_budi` | `dokter123` | dokter |
| `dr_citra` | `dokter123` | dokter |
| `pendaftaran1` | `staff123` | petugas_pendaftaran |
| `farmasi1` | `staff123` | petugas_farmasi |
| `lab1` | `staff123` | petugas_laboratorium |
| `kasir1` | `staff123` | kasir |

---

## 📦 Seeding Data Demo Transaksi

Jalankan seeder untuk data transaksi dummy (idempotent, marker `BILL-DEMO-`):

```bash
# Yii2 console
php yii seed/run              # Master data + demo users
php yii rbac/init             # RBAC roles & permissions
php yii seed/demo-transactions # Transaksi kunjungan, billing, pembayaran, tindakan, resep
```

---

## ⚠️ Known Issues / Mismatches

1. **Yii REST custom actions** (antrean call/skip, pemeriksaan finalize, resep dispense) memerlukan URL rules eksplisit di `api/config/main.php`.
2. **Frontend mutation URLs** tanpa ID di path (contoh: `PUT /pasien` + body `{id}`) sedangkan Yii mengharapkan `PUT /pasien/{id}`.
3. **Lab verify/cancel** di frontend menggunakan URL kosong dan bergantung override `handleAction`.
4. **Laporan export** (`POST /laporan`) belum diimplementasikan di backend.
5. **Auth token field**: Yii2 menggunakan `snake_case` (`access_token`, `refresh_token`), Node.js menggunakan `camelCase`. Frontend sudah disesuaikan ke Yii2.

---

## 📝 Contoh Request Postman

### Login
```
POST http://localhost:8443/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

### Get Pasien List
```
GET http://localhost:8443/pasien?page=1&perPage=20
Authorization: Bearer <access_token>
```

### Create Kunjungan
```
POST http://localhost:8443/kunjungan
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "pasien_id": "uuid-pasien",
  "poli_id": "uuid-poli",
  "dokter_id": "uuid-dokter",
  "tanggal": "2026-11-25",
  "keluhan": "Demam sejak 2 hari",
  "is_bpjs": false
}
```

### Laporan Pendapatan
```
GET http://localhost:8443/laporan/pendapatan?date_from=2026-11-01&date_to=2026-11-25
Authorization: Bearer <access_token>
```

---

*Generated for SIMRS development. Update as API evolves.*
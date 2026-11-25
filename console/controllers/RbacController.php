<?php

namespace console\controllers;

use Yii;
use yii\console\Controller;
use yii\helpers\Console;
use yii\rbac\DbManager;

class RbacController extends Controller
{
    public function actionInit(): int
    {
        /** @var DbManager $auth */
        $auth = Yii::$app->authManager;
        
        $this->stdout("Initializing RBAC...\n", Console::FG_GREEN);
        
        // Hapus data yang sudah ada
        $auth->removeAll();
        
        // ============================================
        // IZIN
        // ============================================
        
        $permissions = [
            // Data master
            'master-pasien-view' => 'Lihat Data Pasien',
            'master-pasien-create' => 'Tambah Data Pasien',
            'master-pasien-update' => 'Ubah Data Pasien',
            'master-pasien-delete' => 'Hapus Data Pasien',
            
            'master-dokter-view' => 'Lihat Data Dokter',
            'master-dokter-create' => 'Tambah Data Dokter',
            'master-dokter-update' => 'Ubah Data Dokter',
            'master-dokter-delete' => 'Hapus Data Dokter',
            
            'master-poli-view' => 'Lihat Data Poli',
            'master-poli-create' => 'Tambah Data Poli',
            'master-poli-update' => 'Ubah Data Poli',
            'master-poli-delete' => 'Hapus Data Poli',
            
            'master-jadwal-view' => 'Lihat Jadwal Praktik',
            'master-jadwal-create' => 'Tambah Jadwal Praktik',
            'master-jadwal-update' => 'Ubah Jadwal Praktik',
            'master-jadwal-delete' => 'Hapus Jadwal Praktik',
            
            'master-tindakan-view' => 'Lihat Master Tindakan',
            'master-tindakan-create' => 'Tambah Master Tindakan',
            'master-tindakan-update' => 'Ubah Master Tindakan',
            'master-tindakan-delete' => 'Hapus Master Tindakan',
            
            'master-tarif-view' => 'Lihat Tarif Tindakan',
            'master-tarif-create' => 'Tambah Tarif Tindakan',
            'master-tarif-update' => 'Ubah Tarif Tindakan',
            'master-tarif-delete' => 'Hapus Tarif Tindakan',
            
            'master-obat-view' => 'Lihat Master Obat',
            'master-obat-create' => 'Tambah Master Obat',
            'master-obat-update' => 'Ubah Master Obat',
            'master-obat-delete' => 'Hapus Master Obat',
            
            'master-stok-view' => 'Lihat Stok Obat',
            'master-stok-opname' => 'Opname Stok Obat',
            'master-stok-adjustment' => 'Penyesuaian Stok',
            
            'master-lab-view' => 'Lihat Master Lab',
            'master-lab-create' => 'Tambah Master Lab',
            'master-lab-update' => 'Ubah Master Lab',
            'master-lab-delete' => 'Hapus Master Lab',
            
            'master-diagnosa-view' => 'Lihat Master Diagnosa (ICD-10)',
            
            // Transaksi - Pendaftaran
            'transaksi-pendaftaran-view' => 'Lihat Pendaftaran',
            'transaksi-pendaftaran-create' => 'Buat Pendaftaran',
            'transaksi-pendaftaran-update' => 'Ubah Pendaftaran',
            'transaksi-pendaftaran-cancel' => 'Batalkan Pendaftaran',
            
            'transaksi-antrean-view' => 'Lihat Antrean',
            'transaksi-antrean-call' => 'Panggil Antrean',
            'transaksi-antrean-skip' => 'Lewati Antrean',
            
            // Transaksi - Pemeriksaan
            'transaksi-pemeriksaan-view' => 'Lihat Pemeriksaan',
            'transaksi-pemeriksaan-create' => 'Buat Pemeriksaan',
            'transaksi-pemeriksaan-update' => 'Ubah Pemeriksaan',
            'transaksi-pemeriksaan-finalize' => 'Finalisasi Pemeriksaan',
            
            // Transaksi - Tindakan
            'transaksi-tindakan-view' => 'Lihat Tindakan Medis',
            'transaksi-tindakan-create' => 'Tambah Tindakan Medis',
            'transaksi-tindakan-update' => 'Ubah Tindakan Medis',
            'transaksi-tindakan-complete' => 'Selesaikan Tindakan',
            
            // Transaksi - Resep
            'transaksi-resep-view' => 'Lihat Resep',
            'transaksi-resep-create' => 'Buat Resep',
            'transaksi-resep-update' => 'Ubah Resep',
            'transaksi-resep-dispense' => 'Serahkan Obat (Dispensing)',
            
            // Transaksi - Laboratorium
            'transaksi-lab-view' => 'Lihat Order Lab',
            'transaksi-lab-create' => 'Buat Order Lab',
            'transaksi-lab-collect' => 'Ambil Specimen',
            'transaksi-lab-process' => 'Proses Hasil Lab',
            'transaksi-lab-verify' => 'Verifikasi Hasil Lab',
            
            // Transaksi - Billing
            'transaksi-billing-view' => 'Lihat Billing',
            'transaksi-billing-create' => 'Buat Billing',
            'transaksi-billing-update' => 'Ubah Billing',
            
            // Transaksi - Pembayaran
            'transaksi-pembayaran-view' => 'Lihat Pembayaran',
            'transaksi-pembayaran-create' => 'Proses Pembayaran',
            'transaksi-pembayaran-refund' => 'Refund Pembayaran',
            'transaksi-pembayaran-verify' => 'Verifikasi Pembayaran',

            // Izin kompatibilitas layanan Node.js
            'integration.bpjs' => 'Integrasi BPJS',
            'integration.satusehat' => 'Integrasi SATUSEHAT',
            'integration.read' => 'Lihat Log Integrasi',
            'lab.read' => 'Lihat Order Laboratorium',
            'lab.order' => 'Buat Order Laboratorium',
            'lab.update' => 'Ubah Order Laboratorium',
            'lab.collect' => 'Ambil Sampel Laboratorium',
            'lab.verify' => 'Verifikasi Hasil Laboratorium',
            'lab.cancel' => 'Batalkan Order Laboratorium',
            'billing.read' => 'Lihat Billing Node.js',
            'billing.create' => 'Buat Billing Node.js',
            'billing.payment' => 'Proses Pembayaran Node.js',
            'billing.refund' => 'Refund Pembayaran Node.js',
            
            // Laporan
            'laporan-kunjungan-view' => 'Laporan Kunjungan',
            'laporan-poli-view' => 'Laporan per Poli',
            'laporan-dokter-view' => 'Laporan per Dokter',
            'laporan-tindakan-view' => 'Laporan Tindakan',
            'laporan-obat-view' => 'Laporan Obat',
            'laporan-pendapatan-view' => 'Laporan Pendapatan',
            'laporan-piutang-view' => 'Laporan Piutang',
            'laporan-stok-view' => 'Laporan Stok',
            
            // Dashboard
            'dashboard-view' => 'Akses Dashboard',
            'dashboard-admin' => 'Dashboard Admin',
            'dashboard-dokter' => 'Dashboard Dokter',
            'dashboard-farmasi' => 'Dashboard Farmasi',
            'dashboard-lab' => 'Dashboard Lab',
            'dashboard-kasir' => 'Dashboard Kasir',
            
            // Pengaturan
            'pengaturan-user-view' => 'Lihat User',
            'pengaturan-user-create' => 'Tambah User',
            'pengaturan-user-update' => 'Ubah User',
            'pengaturan-user-delete' => 'Hapus User',
            'pengaturan-role-view' => 'Lihat Role & Permission',
            'pengaturan-role-assign' => 'Assign Role',
        ];
        
        foreach ($permissions as $name => $description) {
            $permission = $auth->createPermission($name);
            $permission->description = $description;
            $auth->add($permission);
        }
        
        $this->stdout("Created " . count($permissions) . " permissions\n", Console::FG_CYAN);
        
        // ============================================
        // PERAN
        // ============================================
        
        // Administrator - Akses penuh
        $admin = $auth->createRole('admin');
        $admin->description = 'Administrator Sistem';
        $auth->add($admin);
        foreach (array_keys($permissions) as $perm) {
            $auth->addChild($admin, $auth->getPermission($perm));
        }
        
        // Petugas pendaftaran
        $pendaftaran = $auth->createRole('petugas_pendaftaran');
        $pendaftaran->description = 'Petugas Pendaftaran';
        $auth->add($pendaftaran);
        foreach ([
            'master-pasien-view', 'master-pasien-create', 'master-pasien-update',
            'master-poli-view', 'master-jadwal-view',
            'transaksi-pendaftaran-view', 'transaksi-pendaftaran-create', 'transaksi-pendaftaran-update', 'transaksi-pendaftaran-cancel',
            'transaksi-antrean-view', 'transaksi-antrean-call', 'transaksi-antrean-skip',
            'laporan-kunjungan-view', 'laporan-poli-view',
            'dashboard-view',
        ] as $perm) {
            $auth->addChild($pendaftaran, $auth->getPermission($perm));
        }
        
        // Dokter
        $dokter = $auth->createRole('dokter');
        $dokter->description = 'Dokter';
        $auth->add($dokter);
        foreach ([
            'master-pasien-view',
            'master-tindakan-view', 'master-tarif-view',
            'master-obat-view',
            'master-diagnosa-view',
            'transaksi-pemeriksaan-view', 'transaksi-pemeriksaan-create', 'transaksi-pemeriksaan-update', 'transaksi-pemeriksaan-finalize',
            'transaksi-tindakan-view', 'transaksi-tindakan-create', 'transaksi-tindakan-update', 'transaksi-tindakan-complete',
            'transaksi-resep-view', 'transaksi-resep-create', 'transaksi-resep-update',
            'transaksi-lab-view', 'transaksi-lab-create',
            'laporan-kunjungan-view', 'laporan-dokter-view', 'laporan-tindakan-view',
            'dashboard-view', 'dashboard-dokter',
        ] as $perm) {
            $auth->addChild($dokter, $auth->getPermission($perm));
        }
        
        // Petugas farmasi
        $farmasi = $auth->createRole('petugas_farmasi');
        $farmasi->description = 'Petugas Farmasi';
        $auth->add($farmasi);
        foreach ([
            'master-obat-view', 'master-stok-view', 'master-stok-opname', 'master-stok-adjustment',
            'transaksi-resep-view', 'transaksi-resep-dispense',
            'laporan-obat-view', 'laporan-stok-view',
            'dashboard-view', 'dashboard-farmasi',
        ] as $perm) {
            $auth->addChild($farmasi, $auth->getPermission($perm));
        }
        
        // Petugas laboratorium
        $lab = $auth->createRole('petugas_laboratorium');
        $lab->description = 'Petugas Laboratorium';
        $auth->add($lab);
        foreach ([
            'master-lab-view',
            'transaksi-lab-view', 'transaksi-lab-collect', 'transaksi-lab-process', 'transaksi-lab-verify',
            'laporan-kunjungan-view', 'laporan-tindakan-view',
            'dashboard-view', 'dashboard-lab',
        ] as $perm) {
            $auth->addChild($lab, $auth->getPermission($perm));
        }
        
        // Kasir
        $kasir = $auth->createRole('kasir');
        $kasir->description = 'Kasir';
        $auth->add($kasir);
        foreach ([
            'master-pasien-view',
            'transaksi-billing-view', 'transaksi-billing-create',
            'transaksi-pembayaran-view', 'transaksi-pembayaran-create', 'transaksi-pembayaran-refund',
            'laporan-pendapatan-view', 'laporan-piutang-view',
            'dashboard-view', 'dashboard-kasir',
        ] as $perm) {
            $auth->addChild($kasir, $auth->getPermission($perm));
        }
        
        $this->stdout("Created 6 roles\n", Console::FG_CYAN);
        
        // ============================================
        // PENGGUNA ADMIN DEFAULT
        // ============================================
        
        $this->createDefaultAdmin();
        
        $this->stdout("RBAC initialization completed!\n", Console::FG_GREEN);
        return Controller::EXIT_CODE_NORMAL;
    }
    
    private function createDefaultAdmin(): void
    {
        $user = new \common\models\User();
        $user->id = \Ramsey\Uuid\Uuid::uuid4()->toString();
        $user->username = 'admin';
        $user->email = 'admin@simrs.local';
        $user->password = 'admin123';
        $user->status = \common\models\User::STATUS_ACTIVE;
        
        if ($user->save()) {
            $auth = Yii::$app->authManager;
            $adminRole = $auth->getRole('admin');
            $auth->assign($adminRole, $user->id);
            $this->stdout("Default admin user created (admin/admin123)\n", Console::FG_YELLOW);
        } else {
            $this->stdout("Failed to create admin user: " . json_encode($user->errors), Console::FG_RED);
        }
    }
    
    public function actionAssign(string $username, string $role): int
    {
        $user = \common\models\User::findByUsername($username);
        if (!$user) {
            $this->stderr("User '$username' not found\n");
            return Controller::EXIT_CODE_ERROR;
        }
        
        $auth = Yii::$app->authManager;
        $roleObj = $auth->getRole($role);
        if (!$roleObj) {
            $this->stderr("Role '$role' not found\n");
            return Controller::EXIT_CODE_ERROR;
        }
        
        if ($auth->assign($roleObj, $user->id)) {
            $this->stdout("Role '$role' assigned to user '$username'\n", Console::FG_GREEN);
        } else {
            $this->stderr("Failed to assign role\n");
            return Controller::EXIT_CODE_ERROR;
        }
        
        return Controller::EXIT_CODE_NORMAL;
    }
    
    public function actionRevoke(string $username, string $role): int
    {
        $user = \common\models\User::findByUsername($username);
        if (!$user) {
            $this->stderr("User '$username' not found\n");
            return Controller::EXIT_CODE_ERROR;
        }
        
        $auth = Yii::$app->authManager;
        $roleObj = $auth->getRole($role);
        if (!$roleObj) {
            $this->stderr("Role '$role' not found\n");
            return Controller::EXIT_CODE_ERROR;
        }
        
        if ($auth->revoke($roleObj, $user->id)) {
            $this->stdout("Role '$role' revoked from user '$username'\n", Console::FG_GREEN);
        } else {
            $this->stderr("Failed to revoke role\n");
            return Controller::EXIT_CODE_ERROR;
        }
        
        return Controller::EXIT_CODE_NORMAL;
    }
    
    public function actionList(): int
    {
        $auth = Yii::$app->authManager;
        
        $this->stdout("\n=== ROLES ===\n", Console::FG_CYAN);
        foreach ($auth->getRoles() as $role) {
            $this->stdout("  {$role->name}: {$role->description}\n");
            $children = $auth->getChildren($role->name);
            foreach ($children as $child) {
                $this->stdout("    - {$child->name}\n", Console::FG_GRAY);
            }
        }
        
        $this->stdout("\n=== PERMISSIONS ===\n", Console::FG_CYAN);
        foreach ($auth->getPermissions() as $perm) {
            $this->stdout("  {$perm->name}: {$perm->description}\n");
        }
        
        return Controller::EXIT_CODE_NORMAL;
    }
}
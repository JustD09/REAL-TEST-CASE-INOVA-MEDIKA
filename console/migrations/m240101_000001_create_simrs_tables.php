<?php

use yii\db\Migration;

/**
 * Migrasi Skema Database SIMRS Awal untuk PostgreSQL
 */
class m240101_000001_create_simrs_tables extends Migration
{
    public function safeUp(): bool
    {
        // Aktifkan pembangkitan UUID untuk Node.js dan nilai default database.
        $this->execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

        $tableOptions = '';

        // ============================================
        // PENGGUNA DAN RBAC
        // ============================================

        $this->createTable('{{%user}}', [
            'id' => $this->char(36)->notNull(),
            'username' => $this->string(100)->notNull()->unique(),
            'email' => $this->string(100)->notNull()->unique(),
            'password_hash' => $this->string(255)->notNull(),
            'auth_key' => $this->string(255)->notNull(),
            'password_reset_token' => $this->string(255)->unique(),
            'status' => $this->smallInteger()->notNull()->defaultValue(10),
            'last_login_at' => $this->dateTime(),
            'created_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'updated_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'created_by' => $this->char(36),
            'updated_by' => $this->char(36),
            'is_deleted' => $this->boolean()->notNull()->defaultValue(false),
            'deleted_at' => $this->dateTime(),
            'PRIMARY KEY (id)',
        ], $tableOptions);

        $this->createTable('{{%profile}}', [
            'id' => $this->char(36)->notNull(),
            'user_id' => $this->char(36)->notNull()->unique(),
            'full_name' => $this->string(150),
            'nik' => $this->string(16)->unique(),
            'birth_place' => $this->string(100),
            'birth_date' => $this->date(),
            'gender' => $this->char(1)->comment('L/P'),
            'blood_type' => $this->char(2)->comment('A/B/AB/O'),
            'rh_factor' => $this->char(1)->comment('+/-'),
            'address' => $this->text(),
            'rt' => $this->string(5),
            'rw' => $this->string(5),
            'kelurahan' => $this->string(100),
            'kecamatan' => $this->string(100),
            'kota' => $this->string(100),
            'provinsi' => $this->string(100),
            'postal_code' => $this->string(10),
            'phone' => $this->string(20)->unique(),
            'emergency_contact_name' => $this->string(100),
            'emergency_contact_phone' => $this->string(20),
            'emergency_contact_relation' => $this->string(50),
            'photo' => $this->string(255),
            'created_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'updated_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'created_by' => $this->char(36),
            'updated_by' => $this->char(36),
            'is_deleted' => $this->boolean()->notNull()->defaultValue(false),
            'deleted_at' => $this->dateTime(),
            'PRIMARY KEY (id)',
        ], $tableOptions);

        $this->addForeignKey('fk_profile_user', '{{%profile}}', 'user_id', '{{%user}}', 'id', 'CASCADE', 'CASCADE');

        // ============================================
        // DATA MASTER
        // ============================================

        // Spesialis
        $this->createTable('{{%specialist}}', [
            'id' => $this->char(36)->notNull(),
            'kode' => $this->string(10)->notNull()->unique(),
            'nama' => $this->string(100)->notNull(),
            'description' => $this->text(),
            'is_active' => $this->boolean()->notNull()->defaultValue(true),
            'sort_order' => $this->integer()->notNull()->defaultValue(0),
            'created_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'updated_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'created_by' => $this->char(36),
            'updated_by' => $this->char(36),
            'is_deleted' => $this->boolean()->notNull()->defaultValue(false),
            'deleted_at' => $this->dateTime(),
            'PRIMARY KEY (id)',
        ], $tableOptions);

        // Poli
        $this->createTable('{{%poli}}', [
            'id' => $this->char(36)->notNull(),
            'kode' => $this->string(10)->notNull()->unique(),
            'nama' => $this->string(100)->notNull(),
            'type' => $this->string(20)->notNull()->defaultValue('poliklinik'),
            'parent_id' => $this->char(36),
            'description' => $this->text(),
            'location' => $this->string(150),
            'phone' => $this->string(20),
            'registration_fee' => $this->decimal(15,2)->notNull()->defaultValue(0),
            'is_active' => $this->boolean()->notNull()->defaultValue(true),
            'sort_order' => $this->integer()->notNull()->defaultValue(0),
            'created_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'updated_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'created_by' => $this->char(36),
            'updated_by' => $this->char(36),
            'is_deleted' => $this->boolean()->notNull()->defaultValue(false),
            'deleted_at' => $this->dateTime(),
            'PRIMARY KEY (id)',
        ], $tableOptions);

        $this->addForeignKey('fk_poli_parent', '{{%poli}}', 'parent_id', '{{%poli}}', 'id', 'SET NULL', 'CASCADE');

        // Dokter
        $this->createTable('{{%dokter}}', [
            'id' => $this->char(36)->notNull(),
            'nip' => $this->string(30)->notNull()->unique(),
            'user_id' => $this->char(36)->notNull()->unique(),
            'full_name' => $this->string(150)->notNull(),
            'specialist_id' => $this->char(36)->notNull(),
            'str_number' => $this->string(50),
            'str_valid_until' => $this->date(),
            'sip_number' => $this->string(50),
            'sip_valid_until' => $this->date(),
            'phone' => $this->string(20),
            'email' => $this->string(100),
            'address' => $this->text(),
            'photo' => $this->string(255),
            'education' => $this->text(),
            'experience_years' => $this->integer()->notNull()->defaultValue(0),
            'consultation_fee' => $this->decimal(15,2)->notNull()->defaultValue(0),
            'is_active' => $this->boolean()->notNull()->defaultValue(true),
            'notes' => $this->text(),
            'created_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'updated_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'created_by' => $this->char(36),
            'updated_by' => $this->char(36),
            'is_deleted' => $this->boolean()->notNull()->defaultValue(false),
            'deleted_at' => $this->dateTime(),
            'PRIMARY KEY (id)',
        ], $tableOptions);

        $this->addForeignKey('fk_dokter_user', '{{%dokter}}', 'user_id', '{{%user}}', 'id', 'CASCADE', 'CASCADE');
        $this->addForeignKey('fk_dokter_specialist', '{{%dokter}}', 'specialist_id', '{{%specialist}}', 'id', 'RESTRICT', 'CASCADE');

        // Jadwal Praktik
        $this->createTable('{{%jadwal_praktik}}', [
            'id' => $this->char(36)->notNull(),
            'dokter_id' => $this->char(36)->notNull(),
            'poli_id' => $this->char(36)->notNull(),
            'day_of_week' => $this->smallInteger()->notNull()->comment('0=Minggu, 1=Senin, ...'),
            'start_time' => $this->time()->notNull(),
            'end_time' => $this->time()->notNull(),
            'quota' => $this->integer()->notNull()->defaultValue(20),
            'effective_from' => $this->date(),
            'effective_until' => $this->date(),
            'is_active' => $this->boolean()->notNull()->defaultValue(true),
            'notes' => $this->text(),
            'created_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'updated_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'created_by' => $this->char(36),
            'updated_by' => $this->char(36),
            'is_deleted' => $this->boolean()->notNull()->defaultValue(false),
            'deleted_at' => $this->dateTime(),
            'PRIMARY KEY (id)',
        ], $tableOptions);

        $this->addForeignKey('fk_jadwal_dokter', '{{%jadwal_praktik}}', 'dokter_id', '{{%dokter}}', 'id', 'CASCADE', 'CASCADE');
        $this->addForeignKey('fk_jadwal_poli', '{{%jadwal_praktik}}', 'poli_id', '{{%poli}}', 'id', 'CASCADE', 'CASCADE');
        $this->createIndex('idx_jadwal_unique', '{{%jadwal_praktik}}', ['dokter_id', 'poli_id', 'day_of_week', 'effective_from'], true);

        // Kategori tindakan
        $this->createTable('{{%tindakan_category}}', [
            'id' => $this->char(36)->notNull(),
            'kode' => $this->string(10)->notNull()->unique(),
            'nama' => $this->string(100)->notNull(),
            'parent_id' => $this->char(36),
            'description' => $this->text(),
            'is_active' => $this->boolean()->notNull()->defaultValue(true),
            'sort_order' => $this->integer()->notNull()->defaultValue(0),
            'created_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'updated_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'created_by' => $this->char(36),
            'updated_by' => $this->char(36),
            'is_deleted' => $this->boolean()->notNull()->defaultValue(false),
            'deleted_at' => $this->dateTime(),
            'PRIMARY KEY (id)',
        ], $tableOptions);

        $this->addForeignKey('fk_tindakan_cat_parent', '{{%tindakan_category}}', 'parent_id', '{{%tindakan_category}}', 'id', 'SET NULL', 'CASCADE');

        // Tindakan
        $this->createTable('{{%tindakan}}', [
            'id' => $this->char(36)->notNull(),
            'kode' => $this->string(20)->notNull()->unique(),
            'nama' => $this->string(150)->notNull(),
            'type' => $this->string(20)->notNull()->defaultValue('tindakan_medik'),
            'category_id' => $this->char(36),
            'description' => $this->text(),
            'is_active' => $this->boolean()->notNull()->defaultValue(true),
            'requires_anesthesia' => $this->boolean()->notNull()->defaultValue(false),
            'duration_minutes' => $this->integer()->notNull()->defaultValue(0),
            'created_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'updated_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'created_by' => $this->char(36),
            'updated_by' => $this->char(36),
            'is_deleted' => $this->boolean()->notNull()->defaultValue(false),
            'deleted_at' => $this->dateTime(),
            'PRIMARY KEY (id)',
        ], $tableOptions);

        $this->addForeignKey('fk_tindakan_category', '{{%tindakan}}', 'category_id', '{{%tindakan_category}}', 'id', 'SET NULL', 'CASCADE');

        // Tarif tindakan
        $this->createTable('{{%tindakan_tarif}}', [
            'id' => $this->char(36)->notNull(),
            'tindakan_id' => $this->char(36)->notNull(),
            'kelas' => $this->string(10)->notNull(),
            'pembayaran_type' => $this->string(20)->notNull()->defaultValue('umum'),
            'tarif' => $this->decimal(15,2)->notNull()->defaultValue(0),
            'tarif_dokter' => $this->decimal(15,2)->notNull()->defaultValue(0),
            'tarif_petugas' => $this->decimal(15,2)->notNull()->defaultValue(0),
            'tarif_alat' => $this->decimal(15,2)->notNull()->defaultValue(0),
            'tarif_bhp' => $this->decimal(15,2)->notNull()->defaultValue(0),
            'tarif_lain' => $this->decimal(15,2)->notNull()->defaultValue(0),
            'effective_from' => $this->date(),
            'effective_until' => $this->date(),
            'is_active' => $this->boolean()->notNull()->defaultValue(true),
            'notes' => $this->text(),
            'created_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'updated_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'created_by' => $this->char(36),
            'updated_by' => $this->char(36),
            'is_deleted' => $this->boolean()->notNull()->defaultValue(false),
            'deleted_at' => $this->dateTime(),
            'PRIMARY KEY (id)',
        ], $tableOptions);

        $this->addForeignKey('fk_tarif_tindakan', '{{%tindakan_tarif}}', 'tindakan_id', '{{%tindakan}}', 'id', 'CASCADE', 'CASCADE');
        $this->createIndex('idx_tarif_lookup', '{{%tindakan_tarif}}', ['tindakan_id', 'kelas', 'pembayaran_type', 'is_active']);

        // Kategori obat
        $this->createTable('{{%obat_category}}', [
            'id' => $this->char(36)->notNull(),
            'kode' => $this->string(10)->notNull()->unique(),
            'nama' => $this->string(100)->notNull(),
            'parent_id' => $this->char(36),
            'description' => $this->text(),
            'is_active' => $this->boolean()->notNull()->defaultValue(true),
            'sort_order' => $this->integer()->notNull()->defaultValue(0),
            'created_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'updated_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'created_by' => $this->char(36),
            'updated_by' => $this->char(36),
            'is_deleted' => $this->boolean()->notNull()->defaultValue(false),
            'deleted_at' => $this->dateTime(),
            'PRIMARY KEY (id)',
        ], $tableOptions);

        $this->addForeignKey('fk_obat_cat_parent', '{{%obat_category}}', 'parent_id', '{{%obat_category}}', 'id', 'SET NULL', 'CASCADE');

        // Obat
        $this->createTable('{{%obat}}', [
            'id' => $this->char(36)->notNull(),
            'kode' => $this->string(30)->notNull()->unique(),
            'nama' => $this->string(150)->notNull(),
            'generic_name' => $this->string(150),
            'type' => $this->string(20)->notNull()->defaultValue('generik'),
            'category_id' => $this->char(36),
            'unit' => $this->string(20)->notNull(),
            'strength' => $this->string(50),
            'manufacturer' => $this->string(150),
            'registration_number' => $this->string(50),
            'purchase_price' => $this->decimal(15,2)->notNull()->defaultValue(0),
            'selling_price' => $this->decimal(15,2)->notNull()->defaultValue(0),
            'bpjs_price' => $this->decimal(15,2)->notNull()->defaultValue(0),
            'min_stock' => $this->integer()->notNull()->defaultValue(10),
            'max_stock' => $this->integer()->notNull()->defaultValue(1000),
            'current_stock' => $this->integer()->notNull()->defaultValue(0),
            'expired_date' => $this->date(),
            'batch_number' => $this->string(50),
            'location' => $this->string(100),
            'is_active' => $this->boolean()->notNull()->defaultValue(true),
            'is_controlled' => $this->boolean()->notNull()->defaultValue(false),
            'notes' => $this->text(),
            'created_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'updated_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'created_by' => $this->char(36),
            'updated_by' => $this->char(36),
            'is_deleted' => $this->boolean()->notNull()->defaultValue(false),
            'deleted_at' => $this->dateTime(),
            'PRIMARY KEY (id)',
        ], $tableOptions);

        $this->addForeignKey('fk_obat_category', '{{%obat}}', 'category_id', '{{%obat_category}}', 'id', 'SET NULL', 'CASCADE');

        // Log stok obat
        $this->createTable('{{%obat_stock_log}}', [
            'id' => $this->char(36)->notNull(),
            'obat_id' => $this->char(36)->notNull(),
            'type' => $this->string(20)->notNull(),
            'quantity' => $this->integer()->notNull(),
            'old_stock' => $this->integer()->notNull(),
            'new_stock' => $this->integer()->notNull(),
            'reference_id' => $this->char(36),
            'reference_type' => $this->string(30),
            'reason' => $this->text(),
            'user_id' => $this->char(36),
            'created_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'PRIMARY KEY (id)',
        ], $tableOptions);

        $this->addForeignKey('fk_stock_log_obat', '{{%obat_stock_log}}', 'obat_id', '{{%obat}}', 'id', 'CASCADE', 'CASCADE');
        $this->addForeignKey('fk_stock_log_user', '{{%obat_stock_log}}', 'user_id', '{{%user}}', 'id', 'SET NULL', 'CASCADE');
        $this->createIndex('idx_stock_log_obat_date', '{{%obat_stock_log}}', ['obat_id', 'created_at']);

        // Kategori jenis pemeriksaan laboratorium
        $this->createTable('{{%jenis_pemeriksaan_lab_category}}', [
            'id' => $this->char(36)->notNull(),
            'kode' => $this->string(10)->notNull()->unique(),
            'nama' => $this->string(100)->notNull(),
            'parent_id' => $this->char(36),
            'description' => $this->text(),
            'is_active' => $this->boolean()->notNull()->defaultValue(true),
            'sort_order' => $this->integer()->notNull()->defaultValue(0),
            'created_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'updated_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'created_by' => $this->char(36),
            'updated_by' => $this->char(36),
            'is_deleted' => $this->boolean()->notNull()->defaultValue(false),
            'deleted_at' => $this->dateTime(),
            'PRIMARY KEY (id)',
        ], $tableOptions);

        $this->addForeignKey('fk_lab_cat_parent', '{{%jenis_pemeriksaan_lab_category}}', 'parent_id', '{{%jenis_pemeriksaan_lab_category}}', 'id', 'SET NULL', 'CASCADE');

        // Jenis pemeriksaan laboratorium
        $this->createTable('{{%jenis_pemeriksaan_lab}}', [
            'id' => $this->char(36)->notNull(),
            'kode' => $this->string(20)->notNull()->unique(),
            'nama' => $this->string(150)->notNull(),
            'type' => $this->string(30)->notNull()->defaultValue('hematologi'),
            'category_id' => $this->char(36),
            'sample_type' => $this->string(20),
            'sample_volume' => $this->string(50),
            'container_type' => $this->string(50),
            'preparation_instructions' => $this->text(),
            'reference_range' => $this->text(),
            'unit' => $this->string(20),
            'tarif' => $this->decimal(15,2)->notNull()->defaultValue(0),
            'turnaround_time_hours' => $this->integer()->notNull()->defaultValue(0),
            'is_active' => $this->boolean()->notNull()->defaultValue(true),
            'notes' => $this->text(),
            'created_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'updated_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'created_by' => $this->char(36),
            'updated_by' => $this->char(36),
            'is_deleted' => $this->boolean()->notNull()->defaultValue(false),
            'deleted_at' => $this->dateTime(),
            'PRIMARY KEY (id)',
        ], $tableOptions);

        $this->addForeignKey('fk_lab_category', '{{%jenis_pemeriksaan_lab}}', 'category_id', '{{%jenis_pemeriksaan_lab_category}}', 'id', 'SET NULL', 'CASCADE');

        // Diagnosis (ICD-10)
        $this->createTable('{{%diagnosa}}', [
            'id' => $this->char(36)->notNull(),
            'kode' => $this->string(20)->notNull()->unique(),
            'nama' => $this->string(255)->notNull(),
            'description' => $this->text(),
            'parent_kode' => $this->string(20),
            'chapter' => $this->string(10),
            'is_active' => $this->boolean()->notNull()->defaultValue(true),
            'created_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'updated_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'created_by' => $this->char(36),
            'updated_by' => $this->char(36),
            'is_deleted' => $this->boolean()->notNull()->defaultValue(false),
            'deleted_at' => $this->dateTime(),
            'PRIMARY KEY (id)',
        ], $tableOptions);

        // ============================================
        // DATA TRANSAKSI
        // ============================================

        // Pasien
        $this->createTable('{{%pasien}}', [
            'id' => $this->char(36)->notNull(),
            'no_rm' => $this->string(20)->notNull()->unique(),
            'user_id' => $this->char(36)->notNull()->unique(),
            'bpjs_number' => $this->string(20)->unique(),
            'bpjs_class' => $this->char(1),
            'bpjs_valid_from' => $this->date(),
            'bpjs_valid_to' => $this->date(),
            'satusehat_id' => $this->string(100),
            'satusehat_synced_at' => $this->dateTime(),
            'registration_type' => $this->string(20)->notNull()->defaultValue('umum'),
            'insurance_name' => $this->string(100),
            'insurance_number' => $this->string(100),
            'insurance_card_number' => $this->string(100),
            'referral_from' => $this->string(150),
            'notes' => $this->text(),
            'is_active' => $this->boolean()->notNull()->defaultValue(true),
            'created_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'updated_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'created_by' => $this->char(36),
            'updated_by' => $this->char(36),
            'is_deleted' => $this->boolean()->notNull()->defaultValue(false),
            'deleted_at' => $this->dateTime(),
            'PRIMARY KEY (id)',
        ], $tableOptions);

        $this->addForeignKey('fk_pasien_user', '{{%pasien}}', 'user_id', '{{%user}}', 'id', 'CASCADE', 'CASCADE');

        // Kunjungan
        $this->createTable('{{%kunjungan}}', [
            'id' => $this->char(36)->notNull(),
            'pasien_id' => $this->char(36)->notNull(),
            'poli_id' => $this->char(36)->notNull(),
            'dokter_id' => $this->char(36),
            'jadwal_id' => $this->char(36),
            'tanggal' => $this->date()->notNull(),
            'no_antrean' => $this->integer()->notNull(),
            'type' => $this->string(20)->notNull()->defaultValue('baru'),
            'status' => $this->string(20)->notNull()->defaultValue('registered'),
            'keluhan' => $this->text(),
            'registration_fee' => $this->decimal(15,2)->notNull()->defaultValue(0),
            'is_bpjs' => $this->boolean()->notNull()->defaultValue(false),
            'bpjs_referral_number' => $this->string(50),
            'notes' => $this->text(),
            'called_at' => $this->dateTime(),
            'started_at' => $this->dateTime(),
            'completed_at' => $this->dateTime(),
            'created_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'updated_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'created_by' => $this->char(36),
            'updated_by' => $this->char(36),
            'is_deleted' => $this->boolean()->notNull()->defaultValue(false),
            'deleted_at' => $this->dateTime(),
            'PRIMARY KEY (id)',
        ], $tableOptions);

        $this->addForeignKey('fk_kunjungan_pasien', '{{%kunjungan}}', 'pasien_id', '{{%pasien}}', 'id', 'RESTRICT', 'CASCADE');
        $this->addForeignKey('fk_kunjungan_poli', '{{%kunjungan}}', 'poli_id', '{{%poli}}', 'id', 'RESTRICT', 'CASCADE');
        $this->addForeignKey('fk_kunjungan_dokter', '{{%kunjungan}}', 'dokter_id', '{{%dokter}}', 'id', 'SET NULL', 'CASCADE');
        $this->addForeignKey('fk_kunjungan_jadwal', '{{%kunjungan}}', 'jadwal_id', '{{%jadwal_praktik}}', 'id', 'SET NULL', 'CASCADE');
        $this->createIndex('idx_kunjungan_queue', '{{%kunjungan}}', ['poli_id', 'tanggal', 'no_antrean'], true);
        $this->createIndex('idx_kunjungan_pasien_date', '{{%kunjungan}}', ['pasien_id', 'tanggal']);
        $this->createIndex('idx_kunjungan_status', '{{%kunjungan}}', ['status', 'tanggal']);

        // Antrean
        $this->createTable('{{%antrean}}', [
            'id' => $this->char(36)->notNull(),
            'kunjungan_id' => $this->char(36)->notNull()->unique(),
            'poli_id' => $this->char(36)->notNull(),
            'tanggal' => $this->date()->notNull(),
            'no_antrean' => $this->integer()->notNull(),
            'status' => $this->string(20)->notNull()->defaultValue('waiting'),
            'priority' => $this->integer()->notNull()->defaultValue(0),
            'called_at' => $this->dateTime(),
            'started_at' => $this->dateTime(),
            'completed_at' => $this->dateTime(),
            'notes' => $this->text(),
            'created_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'updated_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'created_by' => $this->char(36),
            'updated_by' => $this->char(36),
            'is_deleted' => $this->boolean()->notNull()->defaultValue(false),
            'deleted_at' => $this->dateTime(),
            'PRIMARY KEY (id)',
        ], $tableOptions);

        $this->addForeignKey('fk_antrean_kunjungan', '{{%antrean}}', 'kunjungan_id', '{{%kunjungan}}', 'id', 'CASCADE', 'CASCADE');
        $this->addForeignKey('fk_antrean_poli', '{{%antrean}}', 'poli_id', '{{%poli}}', 'id', 'RESTRICT', 'CASCADE');
        $this->createIndex('idx_antrean_queue', '{{%antrean}}', ['poli_id', 'tanggal', 'no_antrean']);

        // Rekam medis
        $this->createTable('{{%rekam_medis}}', [
            'id' => $this->char(36)->notNull(),
            'pasien_id' => $this->char(36)->notNull(),
            'kunjungan_id' => $this->char(36)->notNull()->unique(),
            'anamnesis' => $this->text(),
            'keluhan_utama' => $this->text(),
            'riwayat_penyakit_sekarang' => $this->text(),
            'riwayat_penyakit_dahulu' => $this->text(),
            'riwayat_alergi' => $this->text(),
            'riwayat_obat' => $this->text(),
            'riwayat_pembedahan' => $this->text(),
            'riwayat_keluarga' => $this->text(),
            'riwayat_sosial' => $this->text(),
            'tinggi_badan' => $this->decimal(5,2),
            'berat_badan' => $this->decimal(5,2),
            'tekanan_darah_sistol' => $this->integer(),
            'tekanan_darah_diastol' => $this->integer(),
            'nadi' => $this->integer(),
            'suhu' => $this->decimal(4,1),
            'respirasi' => $this->integer(),
            'saturasi_o2' => $this->decimal(5,2),
            'bmi' => $this->decimal(5,2),
            'pemeriksaan_fisik' => $this->text(),
            'diagnosa_utama_id' => $this->string(20),
            'diagnosa_sekunder_ids' => $this->string(500),
            'catatan_dokter' => $this->text(),
            'is_final' => $this->boolean()->notNull()->defaultValue(false),
            'signed_at' => $this->dateTime(),
            'created_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'updated_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'created_by' => $this->char(36),
            'updated_by' => $this->char(36),
            'is_deleted' => $this->boolean()->notNull()->defaultValue(false),
            'deleted_at' => $this->dateTime(),
            'PRIMARY KEY (id)',
        ], $tableOptions);

        $this->addForeignKey('fk_rm_pasien', '{{%rekam_medis}}', 'pasien_id', '{{%pasien}}', 'id', 'RESTRICT', 'CASCADE');
        $this->addForeignKey('fk_rm_kunjungan', '{{%rekam_medis}}', 'kunjungan_id', '{{%kunjungan}}', 'id', 'CASCADE', 'CASCADE');

        // Pemeriksaan
        $this->createTable('{{%pemeriksaan}}', [
            'id' => $this->char(36)->notNull(),
            'kunjungan_id' => $this->char(36)->notNull()->unique(),
            'rekam_medis_id' => $this->char(36)->notNull()->unique(),
            'dokter_id' => $this->char(36)->notNull(),
            'anamnesis' => $this->text(),
            'keluhan_utama' => $this->text(),
            'pemeriksaan_fisik' => $this->text(),
            'tinggi_badan' => $this->decimal(5,2),
            'berat_badan' => $this->decimal(5,2),
            'tekanan_darah_sistol' => $this->integer(),
            'tekanan_darah_diastol' => $this->integer(),
            'nadi' => $this->integer(),
            'suhu' => $this->decimal(4,1),
            'respirasi' => $this->integer(),
            'saturasi_o2' => $this->decimal(5,2),
            'bmi' => $this->decimal(5,2),
            'diagnosa_utama_id' => $this->string(20),
            'diagnosa_sekunder_ids' => $this->string(500),
            'tindakan_ids' => $this->string(1000),
            'resep_ids' => $this->string(1000),
            'lab_order_ids' => $this->string(1000),
            'catatan' => $this->text(),
            'is_final' => $this->boolean()->notNull()->defaultValue(false),
            'version' => $this->integer()->notNull()->defaultValue(1), // Optimistic locking
            'started_at' => $this->dateTime(),
            'completed_at' => $this->dateTime(),
            'created_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'updated_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'created_by' => $this->char(36),
            'updated_by' => $this->char(36),
            'is_deleted' => $this->boolean()->notNull()->defaultValue(false),
            'deleted_at' => $this->dateTime(),
            'PRIMARY KEY (id)',
        ], $tableOptions);

        $this->addForeignKey('fk_pemeriksaan_kunjungan', '{{%pemeriksaan}}', 'kunjungan_id', '{{%kunjungan}}', 'id', 'CASCADE', 'CASCADE');
        $this->addForeignKey('fk_pemeriksaan_rm', '{{%pemeriksaan}}', 'rekam_medis_id', '{{%rekam_medis}}', 'id', 'CASCADE', 'CASCADE');
        $this->addForeignKey('fk_pemeriksaan_dokter', '{{%pemeriksaan}}', 'dokter_id', '{{%dokter}}', 'id', 'RESTRICT', 'CASCADE');

        // Tindakan medis
        $this->createTable('{{%tindakan_medis}}', [
            'id' => $this->char(36)->notNull(),
            'kunjungan_id' => $this->char(36)->notNull(),
            'tindakan_id' => $this->char(36)->notNull(),
            'dokter_id' => $this->char(36)->notNull(),
            'petugas_id' => $this->char(36),
            'quantity' => $this->integer()->notNull()->defaultValue(1),
            'kelas' => $this->string(10)->notNull(),
            'pembayaran_type' => $this->string(20)->notNull()->defaultValue('umum'),
            'tarif' => $this->decimal(15,2)->notNull()->defaultValue(0),
            'tarif_dokter' => $this->decimal(15,2)->notNull()->defaultValue(0),
            'tarif_petugas' => $this->decimal(15,2)->notNull()->defaultValue(0),
            'tarif_alat' => $this->decimal(15,2)->notNull()->defaultValue(0),
            'tarif_bhp' => $this->decimal(15,2)->notNull()->defaultValue(0),
            'tarif_lain' => $this->decimal(15,2)->notNull()->defaultValue(0),
            'total_tarif' => $this->decimal(15,2)->notNull()->defaultValue(0),
            'status' => $this->string(20)->notNull()->defaultValue('ordered'),
            'notes' => $this->text(),
            'performed_at' => $this->dateTime(),
            'created_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'updated_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'created_by' => $this->char(36),
            'updated_by' => $this->char(36),
            'is_deleted' => $this->boolean()->notNull()->defaultValue(false),
            'deleted_at' => $this->dateTime(),
            'PRIMARY KEY (id)',
        ], $tableOptions);

        $this->addForeignKey('fk_tindakan_medis_kunjungan', '{{%tindakan_medis}}', 'kunjungan_id', '{{%kunjungan}}', 'id', 'CASCADE', 'CASCADE');
        $this->addForeignKey('fk_tindakan_medis_master', '{{%tindakan_medis}}', 'tindakan_id', '{{%tindakan}}', 'id', 'RESTRICT', 'CASCADE');
        $this->addForeignKey('fk_tindakan_medis_dokter', '{{%tindakan_medis}}', 'dokter_id', '{{%dokter}}', 'id', 'RESTRICT', 'CASCADE');
        $this->addForeignKey('fk_tindakan_medis_petugas', '{{%tindakan_medis}}', 'petugas_id', '{{%user}}', 'id', 'SET NULL', 'CASCADE');

        // Resep
        $this->createTable('{{%resep}}', [
            'id' => $this->char(36)->notNull(),
            'kunjungan_id' => $this->char(36)->notNull(),
            'dokter_id' => $this->char(36)->notNull(),
            'farmasi_id' => $this->char(36),
            'no_resep' => $this->string(30)->notNull()->unique(),
            'type' => $this->string(20)->notNull()->defaultValue('tidak_racikan'),
            'status' => $this->string(20)->notNull()->defaultValue('draft'),
            'diagnosa_id' => $this->string(20),
            'catatan' => $this->text(),
            'total_harga' => $this->decimal(15,2)->notNull()->defaultValue(0),
            'prescribed_at' => $this->dateTime(),
            'dispensed_at' => $this->dateTime(),
            'created_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'updated_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'created_by' => $this->char(36),
            'updated_by' => $this->char(36),
            'is_deleted' => $this->boolean()->notNull()->defaultValue(false),
            'deleted_at' => $this->dateTime(),
            'PRIMARY KEY (id)',
        ], $tableOptions);

        $this->addForeignKey('fk_resep_kunjungan', '{{%resep}}', 'kunjungan_id', '{{%kunjungan}}', 'id', 'CASCADE', 'CASCADE');
        $this->addForeignKey('fk_resep_dokter', '{{%resep}}', 'dokter_id', '{{%dokter}}', 'id', 'RESTRICT', 'CASCADE');
        $this->addForeignKey('fk_resep_farmasi', '{{%resep}}', 'farmasi_id', '{{%user}}', 'id', 'SET NULL', 'CASCADE');

        // Detail resep
        $this->createTable('{{%resep_detail}}', [
            'id' => $this->char(36)->notNull(),
            'resep_id' => $this->char(36)->notNull(),
            'obat_id' => $this->char(36)->notNull(),
            'quantity' => $this->integer()->notNull(),
            'dose' => $this->string(50),
            'frequency' => $this->string(20)->notNull(),
            'custom_frequency' => $this->string(100),
            'duration_days' => $this->integer(),
            'route' => $this->string(20)->notNull(),
            'instructions' => $this->text(),
            'harga_satuan' => $this->decimal(15,2)->notNull()->defaultValue(0),
            'dispensed_quantity' => $this->integer()->notNull()->defaultValue(0),
            'is_dispensed' => $this->boolean()->notNull()->defaultValue(false),
            'racikan_group' => $this->integer()->notNull()->defaultValue(0),
            'sequence' => $this->integer()->notNull()->defaultValue(0),
            'created_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'updated_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'created_by' => $this->char(36),
            'updated_by' => $this->char(36),
            'is_deleted' => $this->boolean()->notNull()->defaultValue(false),
            'deleted_at' => $this->dateTime(),
            'PRIMARY KEY (id)',
        ], $tableOptions);

        $this->addForeignKey('fk_resep_detail_resep', '{{%resep_detail}}', 'resep_id', '{{%resep}}', 'id', 'CASCADE', 'CASCADE');
        $this->addForeignKey('fk_resep_detail_obat', '{{%resep_detail}}', 'obat_id', '{{%obat}}', 'id', 'RESTRICT', 'CASCADE');

        // Laboratorium
        $this->createTable('{{%laboratorium}}', [
            'id' => $this->char(36)->notNull(),
            'kunjungan_id' => $this->char(36)->notNull(),
            'pemeriksaan_id' => $this->char(36),
            'jenis_pemeriksaan_id' => $this->char(36)->notNull(),
            'dokter_id' => $this->char(36),
            'petugas_id' => $this->char(36),
            'verifikator_id' => $this->char(36),
            'no_order' => $this->string(30)->notNull()->unique(),
            'sample_type' => $this->string(20),
            'status' => $this->string(20)->notNull()->defaultValue('ordered'),
            'clinical_info' => $this->text(),
            'result' => $this->text(),
            'interpretation' => $this->text(),
            'tarif' => $this->decimal(15,2)->notNull()->defaultValue(0),
            'ordered_at' => $this->dateTime(),
            'collected_at' => $this->dateTime(),
            'started_at' => $this->dateTime(),
            'completed_at' => $this->dateTime(),
            'verified_at' => $this->dateTime(),
            'created_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'updated_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'created_by' => $this->char(36),
            'updated_by' => $this->char(36),
            'is_deleted' => $this->boolean()->notNull()->defaultValue(false),
            'deleted_at' => $this->dateTime(),
            'PRIMARY KEY (id)',
        ], $tableOptions);

        $this->addForeignKey('fk_lab_kunjungan', '{{%laboratorium}}', 'kunjungan_id', '{{%kunjungan}}', 'id', 'CASCADE', 'CASCADE');
        $this->addForeignKey('fk_lab_pemeriksaan', '{{%laboratorium}}', 'pemeriksaan_id', '{{%pemeriksaan}}', 'id', 'SET NULL', 'CASCADE');
        $this->addForeignKey('fk_lab_jenis', '{{%laboratorium}}', 'jenis_pemeriksaan_id', '{{%jenis_pemeriksaan_lab}}', 'id', 'RESTRICT', 'CASCADE');
        $this->addForeignKey('fk_lab_dokter', '{{%laboratorium}}', 'dokter_id', '{{%dokter}}', 'id', 'SET NULL', 'CASCADE');
        $this->addForeignKey('fk_lab_petugas', '{{%laboratorium}}', 'petugas_id', '{{%user}}', 'id', 'SET NULL', 'CASCADE');
        $this->addForeignKey('fk_lab_verifikator', '{{%laboratorium}}', 'verifikator_id', '{{%user}}', 'id', 'SET NULL', 'CASCADE');

        // Billing
        $this->createTable('{{%billing}}', [
            'id' => $this->char(36)->notNull(),
            'kunjungan_id' => $this->char(36)->notNull()->unique(),
            'pasien_id' => $this->char(36)->notNull(),
            'no_billing' => $this->string(30)->notNull()->unique(),
            'status' => $this->string(20)->notNull()->defaultValue('open'),
            'registration_fee' => $this->decimal(15,2)->notNull()->defaultValue(0),
            'tindakan_fee' => $this->decimal(15,2)->notNull()->defaultValue(0),
            'laboratorium_fee' => $this->decimal(15,2)->notNull()->defaultValue(0),
            'obat_fee' => $this->decimal(15,2)->notNull()->defaultValue(0),
            'subtotal' => $this->decimal(15,2)->notNull()->defaultValue(0),
            'discount' => $this->decimal(15,2)->notNull()->defaultValue(0),
            'discount_type' => $this->string(20),
            'discount_reason' => $this->text(),
            'tax' => $this->decimal(15,2)->notNull()->defaultValue(0),
            'service_charge' => $this->decimal(15,2)->notNull()->defaultValue(0),
            'total' => $this->decimal(15,2)->notNull()->defaultValue(0),
            'paid_amount' => $this->decimal(15,2)->notNull()->defaultValue(0),
            'due_date' => $this->date(),
            'paid_at' => $this->dateTime(),
            'notes' => $this->text(),
            'created_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'updated_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'created_by' => $this->char(36),
            'updated_by' => $this->char(36),
            'is_deleted' => $this->boolean()->notNull()->defaultValue(false),
            'deleted_at' => $this->dateTime(),
            'PRIMARY KEY (id)',
        ], $tableOptions);

        $this->addForeignKey('fk_billing_kunjungan', '{{%billing}}', 'kunjungan_id', '{{%kunjungan}}', 'id', 'CASCADE', 'CASCADE');
        $this->addForeignKey('fk_billing_pasien', '{{%billing}}', 'pasien_id', '{{%pasien}}', 'id', 'RESTRICT', 'CASCADE');

        // Detail billing
        $this->createTable('{{%billing_detail}}', [
            'id' => $this->char(36)->notNull(),
            'billing_id' => $this->char(36)->notNull(),
            'type' => $this->string(20)->notNull(),
            'reference_id' => $this->char(36)->notNull(),
            'description' => $this->string(255)->notNull(),
            'quantity' => $this->integer()->notNull()->defaultValue(1),
            'unit_price' => $this->decimal(15,2)->notNull()->defaultValue(0),
            'amount' => $this->decimal(15,2)->notNull()->defaultValue(0),
            'discount' => $this->decimal(15,2)->notNull()->defaultValue(0),
            'notes' => $this->text(),
            'created_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'updated_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'created_by' => $this->char(36),
            'updated_by' => $this->char(36),
            'is_deleted' => $this->boolean()->notNull()->defaultValue(false),
            'deleted_at' => $this->dateTime(),
            'PRIMARY KEY (id)',
        ], $tableOptions);

        $this->addForeignKey('fk_billing_detail_billing', '{{%billing_detail}}', 'billing_id', '{{%billing}}', 'id', 'CASCADE', 'CASCADE');

        // Pembayaran
        $this->createTable('{{%pembayaran}}', [
            'id' => $this->char(36)->notNull(),
            'billing_id' => $this->char(36)->notNull(),
            'no_bukti' => $this->string(30)->notNull()->unique(),
            'amount' => $this->decimal(15,2)->notNull(),
            'method' => $this->string(20)->notNull(),
            'status' => $this->string(20)->notNull()->defaultValue('pending'),
            'reference' => $this->string(100)->notNull()->unique(),
            'notes' => $this->text(),
            'paid_at' => $this->dateTime(),
            'verified_at' => $this->dateTime(),
            'created_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'updated_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'created_by' => $this->char(36),
            'updated_by' => $this->char(36),
            'is_deleted' => $this->boolean()->notNull()->defaultValue(false),
            'deleted_at' => $this->dateTime(),
            'PRIMARY KEY (id)',
        ], $tableOptions);

        $this->addForeignKey('fk_pembayaran_billing', '{{%pembayaran}}', 'billing_id', '{{%billing}}', 'id', 'RESTRICT', 'CASCADE');

        // ============================================
        // AUDIT DAN IDEMPOTENSI
        // ============================================

        $this->createTable('{{%audit_log}}', [
            'id' => $this->char(36)->notNull(),
            'user_id' => $this->char(36),
            'action' => $this->string(50)->notNull(),
            'entity_type' => $this->string(100)->notNull(),
            'entity_id' => $this->char(36),
            'old_data' => $this->json(),
            'new_data' => $this->json(),
            'description' => $this->text(),
            'ip_address' => $this->string(45),
            'user_agent' => $this->text(),
            'created_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'PRIMARY KEY (id)',
        ], $tableOptions);

        $this->addForeignKey('fk_audit_user', '{{%audit_log}}', 'user_id', '{{%user}}', 'id', 'SET NULL', 'CASCADE');
        $this->createIndex('idx_audit_entity', '{{%audit_log}}', ['entity_type', 'entity_id']);
        $this->createIndex('idx_audit_user_date', '{{%audit_log}}', ['user_id', 'created_at']);

        $this->createTable('{{%idempotency_keys}}', [
            'id' => $this->char(36)->notNull(),
            'idempotency_key' => $this->string(100)->notNull()->unique(),
            'status' => $this->string(20)->notNull()->defaultValue('processing'),
            'result' => $this->json(),
            'error' => $this->text(),
            'created_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'completed_at' => $this->dateTime(),
            'expires_at' => $this->dateTime()->notNull(),
            'PRIMARY KEY (id)',
        ], $tableOptions);

        $this->createIndex('idx_idempotency_expires', '{{%idempotency_keys}}', ['expires_at']);

        // Log integrasi
        $this->createTable('{{%integration_log}}', [
            'id' => $this->char(36)->notNull(),
            'integration_type' => $this->string(50)->notNull(),
            'request_payload' => $this->json(),
            'response_payload' => $this->json(),
            'status' => $this->string(20)->notNull(),
            'error_message' => $this->text(),
            'retry_count' => $this->integer()->notNull()->defaultValue(0),
            'created_at' => $this->dateTime()->notNull()->defaultExpression('NOW()'),
            'PRIMARY KEY (id)',
        ], $tableOptions);

        $this->createIndex('idx_integration_type_date', '{{%integration_log}}', ['integration_type', 'created_at']);
        $this->createIndex('idx_integration_status', '{{%integration_log}}', ['status']);

        // ============================================
        // TABEL RBAC (standar Yii2)
        // ============================================

        $this->createTable('{{%auth_item}}', [
            'name' => $this->string(64)->notNull(),
            'type' => $this->smallInteger()->notNull(),
            'description' => $this->text(),
            'rule_name' => $this->string(64),
            'data' => $this->binary(),
            'created_at' => $this->integer(),
            'updated_at' => $this->integer(),
            'PRIMARY KEY (name)',
        ], $tableOptions);

        $this->createTable('{{%auth_item_child}}', [
            'parent' => $this->string(64)->notNull(),
            'child' => $this->string(64)->notNull(),
            'PRIMARY KEY (parent, child)',
        ], $tableOptions);

        $this->addForeignKey('fk_auth_item_child_parent', '{{%auth_item_child}}', 'parent', '{{%auth_item}}', 'name', 'CASCADE', 'CASCADE');
        $this->addForeignKey('fk_auth_item_child_child', '{{%auth_item_child}}', 'child', '{{%auth_item}}', 'name', 'CASCADE', 'CASCADE');

        $this->createTable('{{%auth_assignment}}', [
            'item_name' => $this->string(64)->notNull(),
            'user_id' => $this->string(64)->notNull(),
            'created_at' => $this->integer(),
            'PRIMARY KEY (item_name, user_id)',
        ], $tableOptions);

        $this->addForeignKey('fk_auth_assignment_item', '{{%auth_assignment}}', 'item_name', '{{%auth_item}}', 'name', 'CASCADE', 'CASCADE');

        $this->createTable('{{%auth_rule}}', [
            'name' => $this->string(64)->notNull(),
            'data' => $this->binary(),
            'created_at' => $this->integer(),
            'updated_at' => $this->integer(),
            'PRIMARY KEY (name)',
        ], $tableOptions);

        return true;
    }

    public function safeDown(): bool
    {
        $tables = [
            '{{%pembayaran}}', '{{%billing_detail}}', '{{%billing}}',
            '{{%laboratorium}}', '{{%resep_detail}}', '{{%resep}}',
            '{{%tindakan_medis}}', '{{%pemeriksaan}}', '{{%rekam_medis}}',
            '{{%antrean}}', '{{%kunjungan}}', '{{%pasien}}',
            '{{%diagnosa}}', '{{%jenis_pemeriksaan_lab}}', '{{%jenis_pemeriksaan_lab_category}}',
            '{{%obat_stock_log}}', '{{%obat}}', '{{%obat_category}}',
            '{{%tindakan_tarif}}', '{{%tindakan}}', '{{%tindakan_category}}',
            '{{%jadwal_praktik}}', '{{%dokter}}', '{{%poli}}', '{{%specialist}}',
            '{{%profile}}', '{{%user}}',
            '{{%audit_log}}', '{{%idempotency_keys}}', '{{%integration_log}}',
            '{{%auth_assignment}}', '{{%auth_item_child}}', '{{%auth_item}}', '{{%auth_rule}}',
        ];

        foreach ($tables as $table) {
            $this->dropTable($table);
        }

        return true;
    }
}
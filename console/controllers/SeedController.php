<?php

namespace console\controllers;

use Yii;
use yii\console\Controller;
use yii\helpers\Console;
use common\models\{
    User, Profile, Specialist, Poli, Dokter, JadwalPraktik,
    TindakanCategory, Tindakan, TindakanTarif,
    ObatCategory, Obat,
    JenisPemeriksaanLabCategory, JenisPemeriksaanLab,
    Diagnosa,
    Pasien, Kunjungan, Billing, Pembayaran, TindakanMedis, Resep, ResepDetail
};
use Ramsey\Uuid\Uuid;

class SeedController extends Controller
{
    public function actionRun(): int
    {
        $this->stdout("Seeding database...\n", Console::FG_GREEN);
        
        $transaction = Yii::$app->db->beginTransaction();
        try {
            $this->seedSpecialists();
            $this->seedPolis();
            $this->seedTindakanCategories();
            $this->seedTindakan();
            $this->seedTindakanTarif();
            $this->seedObatCategories();
            $this->seedObat();
            $this->seedLabCategories();
            $this->seedLabTests();
            $this->seedDiagnosa();
            $this->seedDemoUsers();
            
            $transaction->commit();
            $this->stdout("Database seeded successfully!\n", Console::FG_GREEN);
            return Controller::EXIT_CODE_NORMAL;
        } catch (\Throwable $e) {
            $transaction->rollBack();
            $this->stderr("Seeding failed: " . $e->getMessage() . "\n");
            return Controller::EXIT_CODE_ERROR;
        }
    }
    
    private function seedSpecialists(): void
    {
        $specialists = [
            ['UMUM', 'Dokter Umum', 'Praktik umum dan keluhan ringan'],
            ['ANAK', 'Spesialis Anak', 'Kesehatan anak dan bayi'],
            ['KANDUNGAN', 'Spesialis Kandungan', 'Kehamilan dan persalinan'],
            ['PEN_DALAM', 'Spesialis Penyakit Dalam', 'Penyakit organ dalam'],
            ['JANTUNG', 'Spesialis Jantung', 'Penyakit jantung dan pembuluh darah'],
            ['SARAF', 'Spesialis Saraf', 'Penyakit saraf dan otak'],
            ['KULIT_KEL', 'Spesialis Kulit & Kelamin', 'Penyakit kulit dan kelamin'],
            ['MATA', 'Spesialis Mata', 'Gangguan penglihatan'],
            ['THT', 'Spesialis THT', 'Telinga, Hidung, Tenggorokan'],
            ['ORTHO', 'Spesialis Orthopedi', 'Tulang dan sendi'],
            ['UROLOGI', 'Spesialis Urologi', 'Sistem kemih'],
            ['BEDAH', 'Spesialis Bedah', 'Tindakan bedah'],
            ['ANASTESI', 'Spesialis Anestesi', 'Anestesi dan perawatan intensif'],
            ['RADIOLOGI', 'Spesialis Radiologi', 'Pencitraan medis'],
            ['PAT_ANATO', 'Spesialis Patologi Anatomik', 'Pemeriksaan jaringan'],
            ['MIKROBIO', 'Spesialis Mikrobiologi', 'Pemeriksaan mikroba'],
            ['GIZI', 'Spesialis Gizi', 'Konsultasi gizi klinik'],
            ['REHAB_MED', 'Spesialis Rehabilitasi Medik', 'Fisioterapi dan rehabilitasi'],
        ];
        
        foreach ($specialists as $index => [$kode, $nama, $desc]) {
            $model = new Specialist();
            $model->id = Uuid::uuid4()->toString();
            $model->kode = $kode;
            $model->nama = $nama;
            $model->description = $desc;
            $model->sort_order = $index;
            $model->save(false);
        }
        $this->stdout("  ✓ Specialists seeded\n");
    }
    
    private function seedPolis(): void
    {
        $polis = [
            ['POLI_UMUM', 'Poli Umum', Poli::TYPE_POLIKLINIK, null, 'Lantai 1', 50000, 1],
            ['POLI_ANAK', 'Poli Anak', Poli::TYPE_POLIKLINIK, null, 'Lantai 1', 50000, 2],
            ['POLI_KANDU', 'Poli Kebidanan & Kandungan', Poli::TYPE_POLIKLINIK, null, 'Lantai 2', 75000, 3],
            ['POLI_PENYA', 'Poli Penyakit Dalam', Poli::TYPE_POLIKLINIK, null, 'Lantai 2', 75000, 4],
            ['POLI_JANT', 'Poli Jantung', Poli::TYPE_POLIKLINIK, null, 'Lantai 3', 100000, 5],
            ['POLI_SARAF', 'Poli Saraf', Poli::TYPE_POLIKLINIK, null, 'Lantai 3', 100000, 6],
            ['POLI_KULIT', 'Poli Kulit & Kelamin', Poli::TYPE_POLIKLINIK, null, 'Lantai 1', 75000, 7],
            ['POLI_MATA', 'Poli Mata', Poli::TYPE_POLIKLINIK, null, 'Lantai 2', 75000, 8],
            ['POLI_THT', 'Poli THT', Poli::TYPE_POLIKLINIK, null, 'Lantai 1', 50000, 9],
            ['POLI_ORTHO', 'Poli Orthopedi', Poli::TYPE_POLIKLINIK, null, 'Lantai 2', 75000, 10],
            ['POLI_UROLO', 'Poli Urologi', Poli::TYPE_POLIKLINIK, null, 'Lantai 3', 100000, 11],
            ['POLI_BEDAH', 'Poli Bedah', Poli::TYPE_POLIKLINIK, null, 'Lantai 3', 100000, 12],
            ['POLI_GIZI', 'Poli Gizi', Poli::TYPE_POLIKLINIK, null, 'Lantai 1', 50000, 13],
            ['POLI_REHAB', 'Poli Rehabilitasi Medik', Poli::TYPE_POLIKLINIK, null, 'Lantai 1', 50000, 14],
            ['UGD', 'Unit Gawat Darurat (UGD)', Poli::TYPE_UGD, null, 'Lantai Dasar', 100000, 0],
            ['LAB', 'Laboratorium', Poli::TYPE_LABORATORIUM, null, 'Lantai 1', 0, 15],
            ['RAD', 'Radiologi', Poli::TYPE_RADIOLOGI, null, 'Lantai 2', 0, 16],
            ['FARMASI', 'Farmasi', Poli::TYPE_FARMASI, null, 'Lantai Dasar', 0, 17],
        ];
        
        foreach ($polis as [$kode, $nama, $type, $parent, $loc, $fee, $sort]) {
            $model = new Poli();
            $model->id = Uuid::uuid4()->toString();
            $model->kode = $kode;
            $model->nama = $nama;
            $model->type = $type;
            $model->parent_id = $parent;
            $model->location = $loc;
            $model->registration_fee = $fee;
            $model->sort_order = $sort;
            $model->save(false);
        }
        $this->stdout("  ✓ Polis seeded\n");
    }
    
    private function seedTindakanCategories(): void
    {
        $categories = [
            ['KONSULTASI', 'Konsultasi', null, 'Konsultasi dokter', 1],
            ['KEPERAWAT', 'Tindakan Keperawatan', null, 'Tindakan keperawatan dasar', 2],
            ['TINDAKAN', 'Tindakan Medik', null, 'Tindakan medik invasif/non-invasif', 3],
            ['OPERASI', 'Operasi', null, 'Tindakan operasi', 4],
            ['KEBIDANAN', 'Kebidanan', null, 'Tindakan kebidanan', 5],
            ['FISIOTERP', 'Fisioterapi', null, 'Terapi fisik', 6],
        ];
        
        foreach ($categories as [$kode, $nama, $parent, $desc, $sort]) {
            $model = new TindakanCategory();
            $model->id = Uuid::uuid4()->toString();
            $model->kode = $kode;
            $model->nama = $nama;
            $model->parent_id = $parent;
            $model->description = $desc;
            $model->sort_order = $sort;
            $model->save(false);
        }
        $this->stdout("  ✓ Tindakan categories seeded\n");
    }
    
    private function seedTindakan(): void
    {
        $konsultasiCat = TindakanCategory::find()->where(['kode' => 'KONSULTASI'])->one()->id;
        $keperawatanCat = TindakanCategory::find()->where(['kode' => 'KEPERAWAT'])->one()->id;
        $medikCat = TindakanCategory::find()->where(['kode' => 'TINDAKAN'])->one()->id;
        $operasiCat = TindakanCategory::find()->where(['kode' => 'OPERASI'])->one()->id;
        $kebidamanCat = TindakanCategory::find()->where(['kode' => 'KEBIDANAN'])->one()->id;
        $fisioCat = TindakanCategory::find()->where(['kode' => 'FISIOTERP'])->one()->id;
        
        $tindakan = [
            // Konsultasi
            ['KONS001', 'Konsultasi Umum', Tindakan::TYPE_KONSULTASI, $konsultasiCat, 'Konsultasi umum dokter', false, 15],
            ['KONS002', 'Konsultasi Spesialis', Tindakan::TYPE_KONSULTASI, $konsultasiCat, 'Konsultasi dokter spesialis', false, 20],
            ['KONS003', 'Konsultasi Kontrol', Tindakan::TYPE_KONSULTASI, $konsultasiCat, 'Konsultasi kontrol pasien lama', false, 10],
            
            // Keperawatan
            ['KPR001', 'Pemasangan Infus', Tindakan::TYPE_TINDAKAN_MEDIK, $keperawatanCat, 'Pemasangan kanul infus', false, 10],
            ['KPR002', 'Injeksi IM/IV/SC', Tindakan::TYPE_TINDAKAN_MEDIK, $keperawatanCat, 'Injeksi intramuskular/intravena/subkutan', false, 5],
            ['KPR003', 'Pengambilan Darah', Tindakan::TYPE_TINDAKAN_MEDIK, $keperawatanCat, 'Vensektomi untuk lab', false, 5],
            ['KPR004', 'Pemasangan Kateter', Tindakan::TYPE_TINDAKAN_MEDIK, $keperawatanCat, 'Kateter Foley', false, 15],
            ['KPR005', 'Nebulizer', Tindakan::TYPE_TINDAKAN_MEDIK, $keperawatanCat, 'Terapi nebulizer', false, 15],
            
            // Tindakan Medik
            ['TMED001', 'Suntik Vitamin', Tindakan::TYPE_TINDAKAN_MEDIK, $medikCat, 'Suplemen vitamin', false, 5],
            ['TMED002', 'Pembersihan Luka', Tindakan::TYPE_TINDAKAN_MEDIK, $medikCat, 'Debridement dan dressing', false, 20],
            ['TMED003', 'Jahitan Luka', Tindakan::TYPE_TINDAKAN_MEDIK, $medikCat, 'Sutur luka sayat', false, 30],
            ['TMED004', 'Incisi & Drainase Abses', Tindakan::TYPE_TINDAKAN_MEDIK, $medikCat, 'Tindakan kecil abses', false, 30],
            ['TMED005', 'EKG', Tindakan::TYPE_TINDAKAN_MEDIK, $medikCat, 'Elektrokardiografi', false, 10],
            
            // Operasi
            ['OPR001', 'Apendektomi', Tindakan::TYPE_OPERASI, $operasiCat, 'Pengangkatan usus buntu', true, 60],
            ['OPR002', 'Herniorafi', Tindakan::TYPE_OPERASI, $operasiCat, 'Perbaikan hernia', true, 90],
            ['OPR003', 'Sirkumcisi', Tindakan::TYPE_OPERASI, $operasiCat, 'Sunat', true, 30],
            
            // Kebidanan
            ['KEB001', 'Pemeriksaan Kehamilan', Tindakan::TYPE_KEBIDANAN, $kebidamanCat, 'ANC rutin', false, 20],
            ['KEB002', 'Persalinan Normal', Tindakan::TYPE_KEBIDANAN, $kebidamanCat, 'Partus normal', true, 120],
            ['KEB003', 'Sectio Caesarea', Tindakan::TYPE_OPERASI, $operasiCat, 'Bedah sesar', true, 90],
            
            // Fisioterapi
            ['FIS001', 'Terapi Panas', Tindakan::TYPE_TINDAKAN_MEDIK, $fisioCat, 'Infrared/parafin', false, 20],
            ['FIS002', 'Latihan Gerak', Tindakan::TYPE_TINDAKAN_MEDIK, $fisioCat, 'Range of motion exercise', false, 30],
        ];
        
        foreach ($tindakan as [$kode, $nama, $type, $cat, $desc, $anest, $dur]) {
            $model = new Tindakan();
            $model->id = Uuid::uuid4()->toString();
            $model->kode = $kode;
            $model->nama = $nama;
            $model->type = $type;
            $model->category_id = $cat;
            $model->description = $desc;
            $model->requires_anesthesia = $anest;
            $model->duration_minutes = $dur;
            $model->save(false);
        }
        $this->stdout("  ✓ Tindakan seeded\n");
    }
    
    private function seedTindakanTarif(): void
    {
        $tindakans = Tindakan::find()->all();
        $kelasList = [TindakanTarif::KELAS_VIP, TindakanTarif::KELAS_1, TindakanTarif::KELAS_2, TindakanTarif::KELAS_3, TindakanTarif::KELAS_UMUM];
        $types = [TindakanTarif::TYPE_UMUM, TindakanTarif::TYPE_BPJS, TindakanTarif::TYPE_KONTRAKTOR];
        
        $basePrices = [
            'KONS001' => [50000, 75000, 100000, 150000, 200000],
            'KONS002' => [100000, 150000, 200000, 300000, 400000],
            'KONS003' => [30000, 50000, 75000, 100000, 150000],
            'KPR001' => [25000, 50000, 75000, 100000, 150000],
            'KPR002' => [15000, 25000, 40000, 50000, 75000],
            'KPR003' => [20000, 35000, 50000, 75000, 100000],
            'TMED001' => [30000, 50000, 75000, 100000, 150000],
            'TMED002' => [50000, 75000, 100000, 150000, 200000],
            'TMED003' => [100000, 150000, 200000, 300000, 500000],
            'TMED004' => [150000, 200000, 300000, 500000, 750000],
            'TMED005' => [50000, 75000, 100000, 150000, 200000],
            'OPR001' => [2000000, 3000000, 5000000, 7500000, 10000000],
            'OPR002' => [1500000, 2500000, 4000000, 6000000, 8000000],
            'OPR003' => [500000, 750000, 1000000, 1500000, 2000000],
            'KEB001' => [75000, 100000, 150000, 200000, 300000],
            'KEB002' => [1000000, 1500000, 2000000, 3000000, 5000000],
            'KEB003' => [2500000, 3500000, 5000000, 7500000, 10000000],
            'FIS001' => [50000, 75000, 100000, 150000, 200000],
            'FIS002' => [75000, 100000, 150000, 200000, 300000],
        ];
        
        foreach ($tindakans as $tindakan) {
            $prices = $basePrices[$tindakan->kode] ?? [50000, 75000, 100000, 150000, 200000];
            
            foreach ($kelasList as $kIndex => $kelas) {
                foreach ($types as $type) {
                    $multiplier = $type === TindakanTarif::TYPE_BPJS ? 0.7 : ($type === TindakanTarif::TYPE_KONTRAKTOR ? 0.85 : 1);
                    $tarif = (int)($prices[$kIndex] * $multiplier);
                    
                    $model = new TindakanTarif();
                    $model->id = Uuid::uuid4()->toString();
                    $model->tindakan_id = $tindakan->id;
                    $model->kelas = $kelas;
                    $model->pembayaran_type = $type;
                    $model->tarif = $tarif;
                    $model->tarif_dokter = (int)($tarif * 0.3);
                    $model->tarif_petugas = (int)($tarif * 0.1);
                    $model->tarif_alat = (int)($tarif * 0.2);
                    $model->tarif_bhp = (int)($tarif * 0.15);
                    $model->tarif_lain = $tarif - $model->tarif_dokter - $model->tarif_petugas - $model->tarif_alat - $model->tarif_bhp;
                    $model->save(false);
                }
            }
        }
        $this->stdout("  ✓ Tindakan tarif seeded\n");
    }
    
    private function seedObatCategories(): void
    {
        $categories = [
            ['ANALGESIK', 'Analgesik/Antipiretik', null, 'Obat pereda nyeri dan demam', 1],
            ['ANTIBIOTIK', 'Antibiotik', null, 'Obat anti bakteri', 2],
            ['ANTIHISTA', 'Antihistamin', null, 'Obat anti alergi', 3],
            ['GASTRO', 'Obat Gastrointestinal', null, 'Obat pencernaan', 4],
            ['CARDIO', 'Obat Kardiovaskular', null, 'Obat jantung & darah', 5],
            ['RESPIRASI', 'Obat Respirasi', null, 'Obat saluran napas', 6],
            ['VITAMIN', 'Vitamin & Suplemen', null, 'Vitamin dan mineral', 7],
            ['TOPIKAL', 'Obat Topikal', null, 'Obat oles/kulit', 8],
            ['INJEKSI', 'Obat Injeksi', null, 'Obat suntik', 9],
            ['ALKES', 'Alat Kesehatan', null, 'Alat kesehatan (alkes)', 10],
            ['BHP', 'Bahan Habis Pakai', null, 'BHP medis', 11],
        ];
        
        foreach ($categories as [$kode, $nama, $parent, $desc, $sort]) {
            $model = new ObatCategory();
            $model->id = Uuid::uuid4()->toString();
            $model->kode = $kode;
            $model->nama = $nama;
            $model->parent_id = $parent;
            $model->description = $desc;
            $model->sort_order = $sort;
            $model->save(false);
        }
        $this->stdout("  ✓ Obat categories seeded\n");
    }
    
    private function seedObat(): void
    {
        $analgesikCat = ObatCategory::find()->where(['kode' => 'ANALGESIK'])->one()->id;
        $antibiotikCat = ObatCategory::find()->where(['kode' => 'ANTIBIOTIK'])->one()->id;
        $antihistaminCat = ObatCategory::find()->where(['kode' => 'ANTIHISTA'])->one()->id;
        $gastroCat = ObatCategory::find()->where(['kode' => 'GASTRO'])->one()->id;
        $cardioCat = ObatCategory::find()->where(['kode' => 'CARDIO'])->one()->id;
        $respirasiCat = ObatCategory::find()->where(['kode' => 'RESPIRASI'])->one()->id;
        $vitaminCat = ObatCategory::find()->where(['kode' => 'VITAMIN'])->one()->id;
        $topikalCat = ObatCategory::find()->where(['kode' => 'TOPIKAL'])->one()->id;
        $injeksiCat = ObatCategory::find()->where(['kode' => 'INJEKSI'])->one()->id;
        $alkesCat = ObatCategory::find()->where(['kode' => 'ALKES'])->one()->id;
        $bhpCat = ObatCategory::find()->where(['kode' => 'BHP'])->one()->id;
        
        $obat = [
            // Analgesik
            ['PARA500', 'Paracetamol 500mg', 'Paracetamol', Obat::TYPE_GENERIK, $analgesikCat, Obat::UNIT_TABLET, '500mg', 'Kimia Farma', 500, 1500, 1000, 50, 500, 100, '2026-12-31', 'B001', 'A-01'],
            ['IBU400', 'Ibuprofen 400mg', 'Ibuprofen', Obat::TYPE_GENERIK, $analgesikCat, Obat::UNIT_TABLET, '400mg', 'Kimia Farma', 800, 2000, 1500, 50, 500, 100, '2026-12-31', 'B002', 'A-02'],
            ['MEFE500', 'Mefenamic Acid 500mg', 'Mefenamic Acid', Obat::TYPE_GENERIK, $analgesikCat, Obat::UNIT_TABLET, '500mg', 'Dexa Medica', 1000, 2500, 2000, 50, 500, 100, '2026-12-31', 'B003', 'A-03'],
            
            // Antibiotik
            ['AMOX500', 'Amoxicillin 500mg', 'Amoxicillin', Obat::TYPE_GENERIK, $antibiotikCat, Obat::UNIT_KAPSUL, '500mg', 'Sandoz', 2000, 5000, 3000, 50, 500, 100, '2026-12-31', 'B010', 'B-01'],
            ['CIPRO500', 'Ciprofloxacin 500mg', 'Ciprofloxacin', Obat::TYPE_GENERIK, $antibiotikCat, Obat::UNIT_TABLET, '500mg', 'Bayer', 3000, 7000, 5000, 30, 300, 50, '2026-12-31', 'B011', 'B-02'],
            ['AZITH500', 'Azithromycin 500mg', 'Azithromycin', Obat::TYPE_PATEN, $antibiotikCat, Obat::UNIT_TABLET, '500mg', 'Pfizer', 15000, 25000, 20000, 20, 200, 50, '2026-12-31', 'B012', 'B-03'],
            
            // Antihistamin
            ['CETI10', 'Cetirizine 10mg', 'Cetirizine', Obat::TYPE_GENERIK, $antihistaminCat, Obat::UNIT_TABLET, '10mg', 'Kimia Farma', 800, 2000, 1500, 50, 500, 100, '2026-12-31', 'B020', 'C-01'],
            ['LORA10', 'Loratadine 10mg', 'Loratadine', Obat::TYPE_GENERIK, $antihistaminCat, Obat::UNIT_TABLET, '10mg', 'Schering', 1200, 3000, 2000, 50, 500, 100, '2026-12-31', 'B021', 'C-02'],
            
            // Gastro
            ['OMEP20', 'Omeprazole 20mg', 'Omeprazole', Obat::TYPE_GENERIK, $gastroCat, Obat::UNIT_KAPSUL, '20mg', 'AstraZeneca', 1500, 3500, 2500, 50, 500, 100, '2026-12-31', 'B030', 'D-01'],
            ['RANI150', 'Ranitidine 150mg', 'Ranitidine', Obat::TYPE_GENERIK, $gastroCat, Obat::UNIT_TABLET, '150mg', 'Glaxo', 1000, 2500, 2000, 50, 500, 100, '2026-12-31', 'B031', 'D-02'],
            
            // Cardiovascular
            ['AMLO5', 'Amlodipine 5mg', 'Amlodipine', Obat::TYPE_GENERIK, $cardioCat, Obat::UNIT_TABLET, '5mg', 'Pfizer', 1500, 3000, 2000, 50, 500, 100, '2026-12-31', 'B040', 'E-01'],
            ['CAPTO25', 'Captopril 25mg', 'Captopril', Obat::TYPE_GENERIK, $cardioCat, Obat::UNIT_TABLET, '25mg', 'Bristol', 800, 2000, 1500, 50, 500, 100, '2026-12-31', 'B041', 'E-02'],
            ['SIMVA20', 'Simvastatin 20mg', 'Simvastatin', Obat::TYPE_GENERIK, $cardioCat, Obat::UNIT_TABLET, '20mg', 'Merck', 2000, 4000, 3000, 50, 500, 100, '2026-12-31', 'B042', 'E-03'],
            
            // Respirasi
            ['SALBU', 'Salbutamol Inhaler', 'Salbutamol', Obat::TYPE_GENERIK, $respirasiCat, Obat::UNIT_BOTOL, '100mcg/dose', 'GSK', 25000, 45000, 35000, 20, 200, 50, '2026-12-31', 'B050', 'F-01'],
            ['BUDESO', 'Budesonide Inhaler', 'Budesonide', Obat::TYPE_PATEN, $respirasiCat, Obat::UNIT_BOTOL, '200mcg/dose', 'AstraZeneca', 150000, 250000, 200000, 10, 100, 20, '2026-12-31', 'B051', 'F-02'],
            
            // Vitamin
            ['VITB', 'Vitamin B Complex', 'Vitamin B1 B6 B12', Obat::TYPE_GENERIK, $vitaminCat, Obat::UNIT_TABLET, 'Kombinasi', 'Kimia Farma', 1000, 2500, 2000, 100, 1000, 200, '2026-12-31', 'B060', 'G-01'],
            ['VITC500', 'Vitamin C 500mg', 'Ascorbic Acid', Obat::TYPE_GENERIK, $vitaminCat, Obat::UNIT_TABLET, '500mg', 'Roche', 1200, 3000, 2000, 100, 1000, 200, '2026-12-31', 'B061', 'G-02'],
            ['VITD', 'Vitamin D3 1000 IU', 'Cholecalciferol', Obat::TYPE_GENERIK, $vitaminCat, Obat::UNIT_KAPSUL, '1000 IU', 'Sanbe', 2000, 5000, 3500, 50, 500, 100, '2026-12-31', 'B062', 'G-03'],
            
            // Topikal
            ['BETAD', 'Betadine Solution 10%', 'Povidone Iodine', Obat::TYPE_GENERIK, $topikalCat, Obat::UNIT_BOTOL, '10% 60ml', 'Mundipharma', 15000, 25000, 20000, 50, 500, 100, '2026-12-31', 'B070', 'H-01'],
            ['FUSID', 'Fucidin Cream 2%', 'Fusidic Acid', Obat::TYPE_PATEN, $topikalCat, Obat::UNIT_TUBE, '2% 15g', 'Leo Pharma', 45000, 75000, 60000, 30, 300, 50, '2026-12-31', 'B071', 'H-02'],
            
            // Injeksi
            ['TRAMADOL', 'Tramadol 50mg/ml', 'Tramadol HCl', Obat::TYPE_GENERIK, $injeksiCat, Obat::UNIT_AMPUL, '50mg/ml 2ml', 'Grunenthal', 8000, 15000, 12000, 50, 500, 100, '2026-12-31', 'B080', 'I-01', true],
            ['KETOROL', 'Ketorolac 30mg/ml', 'Ketorolac Trometamol', Obat::TYPE_GENERIK, $injeksiCat, Obat::UNIT_AMPUL, '30mg/ml 1ml', 'Roche', 12000, 25000, 20000, 50, 500, 100, '2026-12-31', 'B081', 'I-02'],
            ['DEXAMET', 'Dexamethasone 4mg/ml', 'Dexamethasone', Obat::TYPE_GENERIK, $injeksiCat, Obat::UNIT_AMPUL, '4mg/ml 2ml', 'Merck', 5000, 12000, 8000, 50, 500, 100, '2026-12-31', 'B082', 'I-03'],
            
            // Alkes
            ['IVCAN', 'IV Cannula 22G', 'Kanul Infus', Obat::TYPE_ALKES, $alkesCat, Obat::UNIT_BOX, '22G x 50', 'Terumo', 150000, 250000, 200000, 20, 200, 50, '2026-12-31', 'B090', 'J-01'],
            ['SYRINGE', 'Syringe 10ml', 'Suntik 10ml', Obat::TYPE_ALKES, $alkesCat, Obat::UNIT_BOX, '10ml x 100', 'Terumo', 200000, 350000, 300000, 20, 200, 50, '2026-12-31', 'B091', 'J-02'],
            
            // BHP
            ['GLOVE', 'Sarung Tangan Steril', 'Latex Gloves', Obat::TYPE_BHP, $bhpCat, Obat::UNIT_BOX, '50 pasang', 'Ansell', 150000, 250000, 200000, 30, 300, 50, '2026-12-31', 'B100', 'K-01'],
            ['GAUZE', 'Kasa Steril 10x10', 'Gauze Pad', Obat::TYPE_BHP, $bhpCat, Obat::UNIT_BOX, '100 lembar', 'Johnson', 50000, 80000, 65000, 50, 500, 100, '2026-12-31', 'B101', 'K-02'],
        ];
        
        foreach ($obat as $o) {
            $model = new Obat();
            $model->id = Uuid::uuid4()->toString();
            $model->kode = $o[0];
            $model->nama = $o[1];
            $model->generic_name = $o[2];
            $model->type = $o[3];
            $model->category_id = $o[4];
            $model->unit = $o[5];
            $model->strength = $o[6];
            $model->manufacturer = $o[7];
            $model->purchase_price = $o[8];
            $model->selling_price = $o[9];
            $model->bpjs_price = $o[10];
            $model->min_stock = $o[11];
            $model->max_stock = $o[12];
            $model->current_stock = $o[13];
            $model->expired_date = $o[14];
            $model->batch_number = $o[15];
            $model->location = $o[16];
            $model->is_controlled = $o[17] ?? false;
            $model->save(false);
        }
        $this->stdout("  ✓ Obat seeded\n");
    }
    
    private function seedLabCategories(): void
    {
        $categories = [
            ['HEMATOLOGI', 'Hematologi', null, 'Pemeriksaan darah lengkap', 1],
            ['KIMIA_DARA', 'Kimia Darah', null, 'Fungsi organ & metabolisme', 2],
            ['URINALISIS', 'Urinalisis', null, 'Pemeriksaan urine', 3],
            ['MIKROBIOLO', 'Mikrobiologi', null, 'Culture & sensitivitas', 4],
            ['IMUNOLOGI', 'Imunologi', null, 'Serologi & autoimun', 5],
            ['KOAGULASI', 'Koagulasi', null, 'Pengegaran darah', 6],
        ];
        
        foreach ($categories as [$kode, $nama, $parent, $desc, $sort]) {
            $model = new JenisPemeriksaanLabCategory();
            $model->id = Uuid::uuid4()->toString();
            $model->kode = $kode;
            $model->nama = $nama;
            $model->parent_id = $parent;
            $model->description = $desc;
            $model->sort_order = $sort;
            $model->save(false);
        }
        $this->stdout("  ✓ Lab categories seeded\n");
    }
    
    private function seedLabTests(): void
    {
        $hematoCat = JenisPemeriksaanLabCategory::find()->where(['kode' => 'HEMATOLOGI'])->one()->id;
        $kimiaCat = JenisPemeriksaanLabCategory::find()->where(['kode' => 'KIMIA_DARA'])->one()->id;
        $urineCat = JenisPemeriksaanLabCategory::find()->where(['kode' => 'URINALISIS'])->one()->id;
        $microCat = JenisPemeriksaanLabCategory::find()->where(['kode' => 'MIKROBIOLO'])->one()->id;
        $immunoCat = JenisPemeriksaanLabCategory::find()->where(['kode' => 'IMUNOLOGI'])->one()->id;
        $coagCat = JenisPemeriksaanLabCategory::find()->where(['kode' => 'KOAGULASI'])->one()->id;
        
        $tests = [
            // Hematologi
            ['DARAH_LENGKAP', 'Darah Lengkap (CBC)', JenisPemeriksaanLab::TYPE_HEMATOLOGI, $hematoCat, JenisPemeriksaanLab::SAMPLE_BLOOD, '2-3 ml', 'Tube EDTA', 'Puas', 'L: 4.5-11.0; E: 4.0-5.5; Hb: 12-16; Hct: 37-47; Tr: 150-400', 'x10^3/uL', 25000, 1],
            ['ERITROSIT', 'Eritrosit', JenisPemeriksaanLab::TYPE_HEMATOLOGI, $hematoCat, JenisPemeriksaanLab::SAMPLE_BLOOD, '2-3 ml', 'Tube EDTA', 'Puas', 'L: 4.0-5.5', 'x10^6/uL', 15000, 1],
            ['LEUKOSIT', 'Leukosit', JenisPemeriksaanLab::TYPE_HEMATOLOGI, $hematoCat, JenisPemeriksaanLab::SAMPLE_BLOOD, '2-3 ml', 'Tube EDTA', 'Puas', 'L: 4.5-11.0', 'x10^3/uL', 15000, 1],
            ['HEMOGLOBIN', 'Hemoglobin', JenisPemeriksaanLab::TYPE_HEMATOLOGI, $hematoCat, JenisPemeriksaanLab::SAMPLE_BLOOD, '2-3 ml', 'Tube EDTA', 'Puas', 'L: 12-16', 'g/dL', 15000, 1],
            ['HEMATOKRIT', 'Hematokrit', JenisPemeriksaanLab::TYPE_HEMATOLOGI, $hematoCat, JenisPemeriksaanLab::SAMPLE_BLOOD, '2-3 ml', 'Tube EDTA', 'Puas', 'L: 37-47', '%', 15000, 1],
            ['TROMBOSIT', 'Trombosit', JenisPemeriksaanLab::TYPE_HEMATOLOGI, $hematoCat, JenisPemeriksaanLab::SAMPLE_BLOOD, '2-3 ml', 'Tube EDTA', 'Puas', 'L: 150-400', 'x10^3/uL', 15000, 1],
            ['LED', 'LED (Laju Endap Darah)', JenisPemeriksaanLab::TYPE_HEMATOLOGI, $hematoCat, JenisPemeriksaanLab::SAMPLE_BLOOD, '2-3 ml', 'Tube EDTA', 'Puas', 'L: 0-20', 'mm/jam', 10000, 1],
            
            // Kimia Darah
            ['GDA', 'Gula Darah Acak (GDA)', JenisPemeriksaanLab::TYPE_KIMIA_DARAH, $kimiaCat, JenisPemeriksaanLab::SAMPLE_BLOOD, '2-3 ml', 'Tube Plain/Serum', 'Puas 2-4 jam', 'L: <200', 'mg/dL', 20000, 1],
            ['GDP', 'Gula Darah Puasa (GDP)', JenisPemeriksaanLab::TYPE_KIMIA_DARAH, $kimiaCat, JenisPemeriksaanLab::SAMPLE_BLOOD, '2-3 ml', 'Tube Plain/Serum', 'Puas 8-10 jam', 'L: 70-100', 'mg/dL', 20000, 1],
            ['GPP', 'Gula Darah 2 Jam PP', JenisPemeriksaanLab::TYPE_KIMIA_DARAH, $kimiaCat, JenisPemeriksaanLab::SAMPLE_BLOOD, '2-3 ml', 'Tube Plain/Serum', '2 jam setelah makan', 'L: <140', 'mg/dL', 20000, 1],
            ['HbA1C', 'HbA1C', JenisPemeriksaanLab::TYPE_KIMIA_DARAH, $kimiaCat, JenisPemeriksaanLab::SAMPLE_BLOOD, '2-3 ml', 'Tube EDTA', 'Tidak perlu puasa', 'L: <5.7%', '%', 80000, 2],
            ['KOL_TOTAL', 'Kolesterol Total', JenisPemeriksaanLab::TYPE_KIMIA_DARAH, $kimiaCat, JenisPemeriksaanLab::SAMPLE_BLOOD, '2-3 ml', 'Tube Plain/Serum', 'Puas 8-12 jam', 'L: <200', 'mg/dL', 25000, 1],
            ['TRIGLISERIDA', 'Trigliserida', JenisPemeriksaanLab::TYPE_KIMIA_DARAH, $kimiaCat, JenisPemeriksaanLab::SAMPLE_BLOOD, '2-3 ml', 'Tube Plain/Serum', 'Puas 8-12 jam', 'L: <150', 'mg/dL', 25000, 1],
            ['HDL', 'HDL Cholesterol', JenisPemeriksaanLab::TYPE_KIMIA_DARAH, $kimiaCat, JenisPemeriksaanLab::SAMPLE_BLOOD, '2-3 ml', 'Tube Plain/Serum', 'Puas 8-12 jam', 'L: >40 (L), >50 (P)', 'mg/dL', 30000, 1],
            ['LDL', 'LDL Cholesterol', JenisPemeriksaanLab::TYPE_KIMIA_DARAH, $kimiaCat, JenisPemeriksaanLab::SAMPLE_BLOOD, '2-3 ml', 'Tube Plain/Serum', 'Puas 8-12 jam', 'L: <100', 'mg/dL', 35000, 1],
            ['UREUM', 'Ureum', JenisPemeriksaanLab::TYPE_KIMIA_DARAH, $kimiaCat, JenisPemeriksaanLab::SAMPLE_BLOOD, '2-3 ml', 'Tube Plain/Serum', 'Tidak perlu puasa', 'L: 10-50', 'mg/dL', 20000, 1],
            ['KREATININ', 'Kreatinin', JenisPemeriksaanLab::TYPE_KIMIA_DARAH, $kimiaCat, JenisPemeriksaanLab::SAMPLE_BLOOD, '2-3 ml', 'Tube Plain/Serum', 'Tidak perlu puasa', 'L: 0.6-1.3', 'mg/dL', 20000, 1],
            ['ASAM_URAT', 'Asam Urat', JenisPemeriksaanLab::TYPE_KIMIA_DARAH, $kimiaCat, JenisPemeriksaanLab::SAMPLE_BLOOD, '2-3 ml', 'Tube Plain/Serum', 'Puas 4 jam', 'L: 3.5-7.0 (L), 2.5-6.0 (P)', 'mg/dL', 20000, 1],
            ['SGOT', 'SGOT (AST)', JenisPemeriksaanLab::TYPE_KIMIA_DARAH, $kimiaCat, JenisPemeriksaanLab::SAMPLE_BLOOD, '2-3 ml', 'Tube Plain/Serum', 'Tidak perlu puasa', 'L: 5-40', 'U/L', 20000, 1],
            ['SGPT', 'SGPT (ALT)', JenisPemeriksaanLab::TYPE_KIMIA_DARAH, $kimiaCat, JenisPemeriksaanLab::SAMPLE_BLOOD, '2-3 ml', 'Tube Plain/Serum', 'Tidak perlu puasa', 'L: 5-40', 'U/L', 20000, 1],
            ['BIL_TOTAL', 'Bilirubin Total', JenisPemeriksaanLab::TYPE_KIMIA_DARAH, $kimiaCat, JenisPemeriksaanLab::SAMPLE_BLOOD, '2-3 ml', 'Tube Plain/Serum', 'Tidak perlu puasa', 'L: 0.3-1.2', 'mg/dL', 20000, 1],
            ['BIL_DIREK', 'Bilirubin Direk', JenisPemeriksaanLab::TYPE_KIMIA_DARAH, $kimiaCat, JenisPemeriksaanLab::SAMPLE_BLOOD, '2-3 ml', 'Tube Plain/Serum', 'Tidak perlu puasa', 'L: 0.0-0.3', 'mg/dL', 20000, 1],
            ['ALBUMIN', 'Albumin', JenisPemeriksaanLab::TYPE_KIMIA_DARAH, $kimiaCat, JenisPemeriksaanLab::SAMPLE_BLOOD, '2-3 ml', 'Tube Plain/Serum', 'Tidak perlu puasa', 'L: 3.5-5.0', 'g/dL', 20000, 1],
            ['PROT_TOTAL', 'Protein Total', JenisPemeriksaanLab::TYPE_KIMIA_DARAH, $kimiaCat, JenisPemeriksaanLab::SAMPLE_BLOOD, '2-3 ml', 'Tube Plain/Serum', 'Tidak perlu puasa', 'L: 6.0-8.0', 'g/dL', 20000, 1],
            ['NA', 'Natrium (Na)', JenisPemeriksaanLab::TYPE_KIMIA_DARAH, $kimiaCat, JenisPemeriksaanLab::SAMPLE_BLOOD, '2-3 ml', 'Tube Plain/Serum', 'Tidak perlu puasa', 'L: 135-145', 'mmol/L', 20000, 1],
            ['K', 'Kalium (K)', JenisPemeriksaanLab::TYPE_KIMIA_DARAH, $kimiaCat, JenisPemeriksaanLab::SAMPLE_BLOOD, '2-3 ml', 'Tube Plain/Serum', 'Tidak perlu puasa', 'L: 3.5-5.0', 'mmol/L', 20000, 1],
            ['CL', 'Klorida (Cl)', JenisPemeriksaanLab::TYPE_KIMIA_DARAH, $kimiaCat, JenisPemeriksaanLab::SAMPLE_BLOOD, '2-3 ml', 'Tube Plain/Serum', 'Tidak perlu puasa', 'L: 98-107', 'mmol/L', 20000, 1],
            
            // Urinalisis
            ['URINALISIS', 'Urinalisis Lengkap', JenisPemeriksaanLab::TYPE_URINALISIS, $urineCat, JenisPemeriksaanLab::SAMPLE_URINE, '10-20 ml', 'Cup steril', 'Urine tengah', 'Khusus', '-', 15000, 1],
            
            // Mikrobiologi
            ['CULTURE_DARAH', 'Culture Darah', JenisPemeriksaanLab::TYPE_MIKROBIOLOGI, $microCat, JenisPemeriksaanLab::SAMPLE_BLOOD, '10 ml x 2', 'Botol culture', 'Steril', 'Negatif', '-', 150000, 24],
            ['CULTURE_URINE', 'Culture Urine', JenisPemeriksaanLab::TYPE_MIKROBIOLOGI, $microCat, JenisPemeriksaanLab::SAMPLE_URINE, '10-20 ml', 'Cup steril', 'Urine tengah', 'Negatif', '-', 100000, 24],
            ['CULTURE_TENGGOROK', 'Culture Tenggorokan', JenisPemeriksaanLab::TYPE_MIKROBIOLOGI, $microCat, JenisPemeriksaanLab::SAMPLE_SWAB, 'Swab', 'Transport media', 'Steril', 'Normal flora', '-', 100000, 24],
            
            // Imunologi
            ['WIDAL', 'Widal', JenisPemeriksaanLab::TYPE_IMUNOLOGI, $immunoCat, JenisPemeriksaanLab::SAMPLE_BLOOD, '2-3 ml', 'Tube Plain/Serum', 'Tidak perlu puasa', 'Negatif', '-', 30000, 2],
            ['ASLO', 'ASLO', JenisPemeriksaanLab::TYPE_IMUNOLOGI, $immunoCat, JenisPemeriksaanLab::SAMPLE_BLOOD, '2-3 ml', 'Tube Plain/Serum', 'Tidak perlu puasa', 'L: <200', 'IU/mL', 50000, 2],
            ['RF', 'Faktor Reumatoit (RF)', JenisPemeriksaanLab::TYPE_IMUNOLOGI, $immunoCat, JenisPemeriksaanLab::SAMPLE_BLOOD, '2-3 ml', 'Tube Plain/Serum', 'Tidak perlu puasa', 'L: <20', 'IU/mL', 40000, 2],
            ['CRP', 'CRP (C-Reactive Protein)', JenisPemeriksaanLab::TYPE_IMUNOLOGI, $immunoCat, JenisPemeriksaanLab::SAMPLE_BLOOD, '2-3 ml', 'Tube Plain/Serum', 'Tidak perlu puasa', 'L: <10', 'mg/L', 50000, 1],
            ['HIV', 'Anti HIV', JenisPemeriksaanLab::TYPE_IMUNOLOGI, $immunoCat, JenisPemeriksaanLab::SAMPLE_BLOOD, '2-3 ml', 'Tube Plain/Serum', 'Tidak perlu puasa', 'Non-reaktif', '-', 60000, 2],
            ['HBSAG', 'HBsAg', JenisPemeriksaanLab::TYPE_IMUNOLOGI, $immunoCat, JenisPemeriksaanLab::SAMPLE_BLOOD, '2-3 ml', 'Tube Plain/Serum', 'Tidak perlu puasa', 'Non-reaktif', '-', 40000, 2],
            ['ANTI_HCV', 'Anti HCV', JenisPemeriksaanLab::TYPE_IMUNOLOGI, $immunoCat, JenisPemeriksaanLab::SAMPLE_BLOOD, '2-3 ml', 'Tube Plain/Serum', 'Tidak perlu puasa', 'Non-reaktif', '-', 80000, 2],
            ['VDRL', 'VDRL/RPR (Sifilis)', JenisPemeriksaanLab::TYPE_IMUNOLOGI, $immunoCat, JenisPemeriksaanLab::SAMPLE_BLOOD, '2-3 ml', 'Tube Plain/Serum', 'Tidak perlu puasa', 'Non-reaktif', '-', 30000, 2],
            
            // Koagulasi
            ['PT', 'Prothrombin Time (PT)', JenisPemeriksaanLab::TYPE_KIMIA_DARAH, $coagCat, JenisPemeriksaanLab::SAMPLE_BLOOD, '2-3 ml', 'Tube Sodium Citrat', 'Tidak perlu puasa', 'L: 11-14', 'detik', 30000, 1],
            ['APTT', 'APTT', JenisPemeriksaanLab::TYPE_KIMIA_DARAH, $coagCat, JenisPemeriksaanLab::SAMPLE_BLOOD, '2-3 ml', 'Tube Sodium Citrat', 'Tidak perlu puasa', 'L: 25-35', 'detik', 30000, 1],
            ['INR', 'INR', JenisPemeriksaanLab::TYPE_KIMIA_DARAH, $coagCat, JenisPemeriksaanLab::SAMPLE_BLOOD, '2-3 ml', 'Tube Sodium Citrat', 'Tidak perlu puasa', 'L: 0.8-1.2', '-', 30000, 1],
            ['FIBRINOGEN', 'Fibrinogen', JenisPemeriksaanLab::TYPE_KIMIA_DARAH, $coagCat, JenisPemeriksaanLab::SAMPLE_BLOOD, '2-3 ml', 'Tube Sodium Citrat', 'Tidak perlu puasa', 'L: 200-400', 'mg/dL', 40000, 1],
            ['DDIMER', 'D-Dimer', JenisPemeriksaanLab::TYPE_KIMIA_DARAH, $coagCat, JenisPemeriksaanLab::SAMPLE_BLOOD, '2-3 ml', 'Tube Sodium Citrat', 'Tidak perlu puasa', 'L: <500', 'ng/mL', 100000, 2],
        ];
        
        foreach ($tests as $t) {
            $model = new JenisPemeriksaanLab();
            $model->id = Uuid::uuid4()->toString();
            $model->kode = $t[0];
            $model->nama = $t[1];
            $model->type = $t[2];
            $model->category_id = $t[3];
            $model->sample_type = $t[4];
            $model->sample_volume = $t[5];
            $model->container_type = $t[6];
            $model->preparation_instructions = $t[7];
            $model->reference_range = $t[8];
            $model->unit = $t[9];
            $model->tarif = $t[10];
            $model->turnaround_time_hours = $t[11];
            $model->save(false);
        }
        $this->stdout("  ✓ Lab tests seeded\n");
    }
    
    private function seedDiagnosa(): void
    {
        // Sample ICD-10 codes
        $icd10 = [
            ['A09', 'Diare dan gastroenteritis yang diasumsikan bersifat infeksi', null, 'A00-B99'],
            ['E11', 'Diabetes mellitus tipe 2', null, 'E00-E90'],
            ['E78.0', 'Kolesterol murni tinggi', null, 'E00-E90'],
            ['I10', 'Hipertensi esensial (primer)', null, 'I00-I99'],
            ['I20.9', 'Angina pektoris, tidak spesifik', null, 'I00-I99'],
            ['I25.1', 'Penyakit jantung koroner aterosklerotik', null, 'I00-I99'],
            ['I50.9', 'Gagal jantung, tidak spesifik', null, 'I00-I99'],
            ['J06.9', 'Infeksi saluran pernapasan atas akut, tidak spesifik', null, 'J00-J99'],
            ['J18.9', 'Pneumonia, organisme tidak spesifik', null, 'J00-J99'],
            ['J45.9', 'Asma, tidak spesifik', null, 'J00-J99'],
            ['K21.9', 'Refluks gastroesofageal tanpa esofagitis', null, 'K00-K93'],
            ['K29.7', 'Gastritis, tidak spesifik', null, 'K00-K93'],
            ['K59.1', 'Sembelit fungsional', null, 'K00-K93'],
            ['M54.5', 'Low back pain', null, 'M00-M99'],
            ['M79.3', 'Pannikulitis, tidak spesifik', null, 'M00-M99'],
            ['N39.0', 'Infeksi saluran kemih, tempat tidak spesifik', null, 'N00-N99'],
            ['R50.9', 'Demam, tidak spesifik', null, 'R00-R99'],
            ['R51', 'Sakit kepala', null, 'R00-R99'],
            ['R53', 'Malaise dan kelelahan', null, 'R00-R99'],
            ['Z00.0', 'Pemeriksaan kesehatan umum', null, 'Z00-Z99'],
        ];
        
        foreach ($icd10 as [$kode, $nama, $parent, $chapter]) {
            $model = new Diagnosa();
            $model->id = Uuid::uuid4()->toString();
            $model->kode = $kode;
            $model->nama = $nama;
            $model->parent_kode = $parent;
            $model->chapter = $chapter;
            $model->save(false);
        }
        $this->stdout("  ✓ Diagnosa (ICD-10) seeded\n");
    }
    
    private function seedDemoUsers(): void
    {
        // Admin user (already created by RBAC init)
        
        // Demo Dokter
        $dokterData = [
            ['dr_ahmad', 'dr. Ahmad Wijaya, Sp.PD', 'Dokter Umum / Sp.PD', 'ahmad@simrs.local', 'dokter123'],
            ['dr_siti', 'dr. Siti Nurhaliza, Sp.A', 'Spesialis Anak', 'siti@simrs.local', 'dokter123'],
            ['dr_budi', 'dr. Budi Santoso, Sp.OG', 'Spesialis Kebidanan', 'budi@simrs.local', 'dokter123'],
            ['dr_citra', 'dr. Citra Dewi, Sp.JP', 'Spesialis Jantung', 'citra@simrs.local', 'dokter123'],
        ];
        
        foreach ($dokterData as $index => [$username, $fullName, $spec, $email, $pass]) {
            $user = new User();
            $user->id = Uuid::uuid4()->toString();
            $user->username = $username;
            $user->email = $email;
            $user->password = $pass;
            $user->status = User::STATUS_ACTIVE;
            $user->save(false);
            
            $profile = new Profile();
            $profile->id = Uuid::uuid4()->toString();
            $profile->user_id = $user->id;
            $profile->full_name = $fullName;
            $profile->phone = '08123456789' . ($index + 1);
            $profile->save(false);
            
            // Assign dokter role
            $auth = Yii::$app->authManager;
            $role = $auth->getRole('dokter');
            $auth->assign($role, $user->id);
        }
        
        // Demo Petugas
        $staffData = [
            ['pendaftaran1', 'Budi Santoso', 'pendaftaran@simrs.local', 'staff123', 'petugas_pendaftaran'],
            ['farmasi1', 'Siti Aisyah', 'farmasi@simrs.local', 'staff123', 'petugas_farmasi'],
            ['lab1', 'Ahmad Fauzi', 'lab@simrs.local', 'staff123', 'petugas_laboratorium'],
            ['kasir1', 'Dewi Sartika', 'kasir@simrs.local', 'staff123', 'kasir'],
        ];
        
        foreach ($staffData as $index => [$username, $fullName, $email, $pass, $role]) {
            $user = new User();
            $user->id = Uuid::uuid4()->toString();
            $user->username = $username;
            $user->email = $email;
            $user->password = $pass;
            $user->status = User::STATUS_ACTIVE;
            $user->save(false);
            
            $profile = new Profile();
            $profile->id = Uuid::uuid4()->toString();
            $profile->user_id = $user->id;
            $profile->full_name = $fullName;
            $profile->phone = '0812345678' . (5 + $index);
            $profile->save(false);
            
            $auth = Yii::$app->authManager;
            $roleObj = $auth->getRole($role);
            $auth->assign($roleObj, $user->id);
        }
        
        // Demo Pasien
        $pasienData = [
            ['1234567890123456', 'Andi Wijaya', 'L', '1985-05-15', '085712345670', 'Jl. Merdeka No. 10, Jakarta', 'umum'],
            ['1234567890123457', 'Siti Rahma', 'P', '1990-08-22', '085712345671', 'Jl. Sudirman No. 25, Jakarta', 'bpjs'],
            ['1234567890123458', 'Budi Hartono', 'L', '1978-11-30', '085712345672', 'Jl. Thamrin No. 5, Jakarta', 'umum'],
            ['1234567890123459', 'Dewi Lestari', 'P', '1995-03-18', '085712345673', 'Jl. Gatot Subroto No. 12, Jakarta', 'bpjs'],
            ['1234567890123460', 'Ahmad Fauzan', 'L', '2010-07-10', '085712345674', 'Jl. Kebon Jeruk No. 8, Jakarta', 'umum'],
        ];
        
        foreach ($pasienData as [$nik, $name, $gender, $dob, $phone, $addr, $regType]) {
            $user = new User();
            $user->id = Uuid::uuid4()->toString();
            $user->username = 'pasien_' . substr($nik, -6);
            $user->email = strtolower(str_replace(' ', '.', $name)) . '@simrs.local';
            $user->password = 'pasien123';
            $user->status = User::STATUS_ACTIVE;
            $user->save(false);
            
            $profile = new Profile();
            $profile->id = Uuid::uuid4()->toString();
            $profile->user_id = $user->id;
            $profile->full_name = $name;
            $profile->nik = $nik;
            $profile->birth_date = $dob;
            $profile->gender = $gender;
            $profile->phone = $phone;
            $profile->address = $addr;
            $profile->save(false);
            
            $pasien = new \common\models\Pasien();
            $pasien->id = Uuid::uuid4()->toString();
            $pasien->no_rm = 'RM' . substr($nik, -8);
            $pasien->user_id = $user->id;
            $pasien->registration_type = $regType;
            if ($regType === 'bpjs') {
                $pasien->bpjs_number = '000123456789' . substr($nik, -1);
                $pasien->bpjs_class = '3';
            }
            $pasien->save(false);
        }
        
        $this->stdout("  ✓ Demo users seeded\n");
    }

    public function actionDemoTransactions(): int
    {
        $this->stdout("Seeding demo transactions for reports...\n", Console::FG_GREEN);

        $transaction = Yii::$app->db->beginTransaction();
        try {
            $this->seedDemoKunjungan();
            $this->seedDemoBilling();
            $this->seedDemoPembayaran();
            $this->seedDemoTindakanMedis();
            $this->seedDemoResep();
            $this->seedDemoResepDetail();

            $transaction->commit();
            $this->stdout("Demo transactions seeded successfully!\n", Console::FG_GREEN);
            return Controller::EXIT_CODE_NORMAL;
        } catch (\Throwable $e) {
            $transaction->rollBack();
            $this->stderr("Demo transactions seeding failed: " . $e->getMessage() . "\n");
            return Controller::EXIT_CODE_ERROR;
        }
    }

    private function seedDemoKunjungan(): void
    {
        // Check if demo kunjungan already exist (marker in notes)
        $existing = Kunjungan::find()->where(['like', 'notes', 'BILL-DEMO-'])->exists();
        if ($existing) {
            $this->stdout("  ⊘ Demo kunjungan already exist, skipping\n");
            return;
        }

        $pasienList = Pasien::find()->with('user.profile')->all();
        $poliList = Poli::find()->where(['is_active' => true])->all();
        $dokterList = Dokter::find()->where(['is_active' => true])->with('user.profile')->all();

        if (empty($pasienList) || empty($poliList)) {
            $this->stdout("  ⚠ No pasien or poli found, skipping kunjungan seed\n");
            return;
        }

        $statuses = [
            Kunjungan::STATUS_DONE,
            Kunjungan::STATUS_DONE,
            Kunjungan::STATUS_DONE,
            Kunjungan::STATUS_WAITING,
            Kunjungan::STATUS_IN_PROGRESS,
            Kunjungan::STATUS_CANCELLED,
        ];
        $types = [Kunjungan::TYPE_BARU, Kunjungan::TYPE_LAMA, Kunjungan::TYPE_KONTROL];

        $startDate = new DateTime('-30 days');
        $endDate = new DateTime();

        foreach ($pasienList as $pasien) {
            // Create 2-5 kunjungan per pasien
            $count = rand(2, 5);
            for ($i = 0; $i < $count; $i++) {
                $daysAgo = rand(0, 30);
                $tanggal = (clone $startDate)->modify("+$daysAgo days")->format('Y-m-d');
                $poli = $poliList[array_rand($poliList)];
                $dokter = $dokterList ? $dokterList[array_rand($dokterList)] : null;

                // Get next antrean number for this poli/date
                $maxAntrean = Kunjungan::find()
                    ->where(['poli_id' => $poli->id, 'tanggal' => $tanggal, 'is_deleted' => false])
                    ->max('no_antrean');
                $noAntrean = ($maxAntrean ?? 0) + 1;

                $kunjungan = new Kunjungan();
                $kunjungan->id = Uuid::uuid4()->toString();
                $kunjungan->pasien_id = $pasien->id;
                $kunjungan->poli_id = $poli->id;
                $kunjungan->dokter_id = $dokter?->id;
                $kunjungan->tanggal = $tanggal;
                $kunjungan->no_antrean = $noAntrean;
                $kunjungan->type = $types[array_rand($types)];
                $kunjungan->status = $statuses[array_rand($statuses)];
                $kunjungan->keluhan = 'Keluhan demo ' . ($i + 1);
                $kunjungan->registration_fee = $poli->registration_fee ?? 50000;
                $kunjungan->is_bpjs = $pasien->bpjs_number ? (rand(0, 1) === 1) : false;
                $kunjungan->notes = 'BILL-DEMO-' . $kunjungan->id;
                $kunjungan->created_at = date('Y-m-d H:i:s', strtotime($tanggal . ' 08:00:00'));

                if ($kunjungan->status === Kunjungan::STATUS_DONE) {
                    $kunjungan->completed_at = date('Y-m-d H:i:s', strtotime($tanggal . ' 10:00:00'));
                } elseif ($kunjungan->status === Kunjungan::STATUS_IN_PROGRESS) {
                    $kunjungan->started_at = date('Y-m-d H:i:s', strtotime($tanggal . ' 09:30:00'));
                } elseif ($kunjungan->status === Kunjungan::STATUS_WAITING) {
                    $kunjungan->called_at = date('Y-m-d H:i:s', strtotime($tanggal . ' 09:00:00'));
                }

                $kunjungan->save(false);
            }
        }
        $this->stdout("  ✓ Demo kunjungan seeded\n");
    }

    private function seedDemoBilling(): void
    {
        // Check if demo billing already exist
        $existing = Billing::find()->where(['like', 'notes', 'BILL-DEMO-'])->exists();
        if ($existing) {
            $this->stdout("  ⊘ Demo billing already exist, skipping\n");
            return;
        }

        $kunjunganList = Kunjungan::find()
            ->where(['like', 'notes', 'BILL-DEMO-'])
            ->andWhere(['status' => [Kunjungan::STATUS_DONE, Kunjungan::STATUS_IN_PROGRESS, Kunjungan::STATUS_WAITING]])
            ->with('pasien')
            ->all();

        foreach ($kunjunganList as $kunjungan) {
            // Check if billing already exists for this kunjungan
            $billExists = Billing::find()->where(['kunjungan_id' => $kunjungan->id])->exists();
            if ($billExists) continue;

            $total = 0;
            // Registration fee
            $total += $kunjungan->registration_fee ?? 50000;

            // Add some random tindakan costs
            $tindakanCount = rand(1, 3);
            for ($j = 0; $j < $tindakanCount; $j++) {
                $total += rand(50000, 500000);
            }

            // Add some random obat costs
            $obatCount = rand(1, 4);
            for ($j = 0; $j < $obatCount; $j++) {
                $total += rand(10000, 200000);
            }

            $billing = new Billing();
            $billing->id = Uuid::uuid4()->toString();
            $billing->kunjungan_id = $kunjungan->id;
            $billing->pasien_id = $kunjungan->pasien_id;
            $billing->no_billing = 'BILL-DEMO-' . substr($billing->id, 0, 8);
            $billing->total = $total;
            $billing->paid_amount = 0;
            $billing->status = Billing::STATUS_UNPAID;
            $billing->notes = 'BILL-DEMO-' . $billing->id;
            $billing->save(false);

            // Update kunjungan with billing reference (optional)
        }
        $this->stdout("  ✓ Demo billing seeded\n");
    }

    private function seedDemoPembayaran(): void
    {
        // Check if demo pembayaran already exist
        $existing = Pembayaran::find()->where(['like', 'notes', 'BILL-DEMO-'])->exists();
        if ($existing) {
            $this->stdout("  ⊘ Demo pembayaran already exist, skipping\n");
            return;
        }

        $billingList = Billing::find()->where(['like', 'notes', 'BILL-DEMO-'])->all();
        $methods = [
            Pembayaran::METHOD_CASH,
            Pembayaran::METHOD_DEBIT,
            Pembayaran::METHOD_CREDIT,
            Pembayaran::METHOD_TRANSFER,
            Pembayaran::METHOD_EWALLET,
            Pembayaran::METHOD_BPJS,
        ];

        foreach ($billingList as $billing) {
            // Randomly decide payment status: 70% paid, 20% partial, 10% unpaid
            $rand = rand(1, 100);
            $targetStatus = $rand <= 70 ? Billing::STATUS_PAID : ($rand <= 90 ? Billing::STATUS_PARTIAL : Billing::STATUS_UNPAID);

            $paidAmount = 0;
            if ($targetStatus === Billing::STATUS_PAID) {
                $paidAmount = $billing->total;
            } elseif ($targetStatus === Billing::STATUS_PARTIAL) {
                $paidAmount = $billing->total * (rand(30, 80) / 100);
            }

            if ($paidAmount > 0) {
                // Create 1-2 payment records
                $paymentCount = $targetStatus === Billing::STATUS_PAID ? 1 : rand(1, 2);
                $remaining = $paidAmount;

                for ($i = 0; $i < $paymentCount; $i++) {
                    $amount = $i === $paymentCount - 1 ? $remaining : rand(10000, (int)($remaining * 0.8));
                    $remaining -= $amount;

                    $pembayaran = new Pembayaran();
                    $pembayaran->id = Uuid::uuid4()->toString();
                    $pembayaran->billing_id = $billing->id;
                    $pembayaran->no_bukti = 'PAY-DEMO-' . substr($pembayaran->id, 0, 8);
                    $pembayaran->amount = $amount;
                    $pembayaran->method = $methods[array_rand($methods)];
                    $pembayaran->status = Pembayaran::STATUS_SUCCESS;
                    $pembayaran->paid_at = date('Y-m-d H:i:s');
                    $pembayaran->notes = 'BILL-DEMO-' . $pembayaran->id;
                    $pembayaran->save(false);
                }
            }

            // Update billing status and paid_amount
            $billing->paid_amount = $paidAmount;
            $billing->status = $targetStatus;
            $billing->save(false, ['paid_amount', 'status']);
        }
        $this->stdout("  ✓ Demo pembayaran seeded\n");
    }

    private function seedDemoTindakanMedis(): void
    {
        // Check if demo tindakan medis already exist
        $existing = TindakanMedis::find()->where(['like', 'notes', 'BILL-DEMO-'])->exists();
        if ($existing) {
            $this->stdout("  ⊘ Demo tindakan medis already exist, skipping\n");
            return;
        }

        $kunjunganList = Kunjungan::find()
            ->where(['like', 'notes', 'BILL-DEMO-'])
            ->andWhere(['status' => [Kunjungan::STATUS_DONE, Kunjungan::STATUS_IN_PROGRESS]])
            ->with('dokter')
            ->all();

        $tindakanList = Tindakan::find()->where(['is_active' => true])->all();
        $kelasList = ['VIP', '1', '2', '3', 'UMUM'];

        foreach ($kunjunganList as $kunjungan) {
            $count = rand(1, 3);
            for ($i = 0; $i < $count; $i++) {
                $tindakan = $tindakanList[array_rand($tindakanList)];
                $kelas = $kelasList[array_rand($kelasList)];

                // Get tarif for this tindakan and kelas
                $tarifModel = TindakanTarif::find()
                    ->where(['tindakan_id' => $tindakan->id, 'kelas' => $kelas, 'is_active' => true])
                    ->one();
                $tarif = $tarifModel?->tarif ?? rand(50000, 300000);

                $tm = new TindakanMedis();
                $tm->id = Uuid::uuid4()->toString();
                $tm->kunjungan_id = $kunjungan->id;
                $tm->tindakan_id = $tindakan->id;
                $tm->dokter_id = $kunjungan->dokter_id ?? $tindakan->dokter_id ?? null;
                $tm->petugas_id = null;
                $tm->quantity = 1;
                $tm->kelas = $kelas;
                $tm->tarif = $tarif;
                $tm->pembayaran_type = 'umum';
                $tm->status = TindakanMedis::STATUS_COMPLETED;
                $tm->notes = 'BILL-DEMO-' . $tm->id;
                $tm->save(false);
            }
        }
        $this->stdout("  ✓ Demo tindakan medis seeded\n");
    }

    private function seedDemoResep(): void
    {
        // Check if demo resep already exist
        $existing = Resep::find()->where(['like', 'notes', 'BILL-DEMO-'])->exists();
        if ($existing) {
            $this->stdout("  ⊘ Demo resep already exist, skipping\n");
            return;
        }

        $kunjunganList = Kunjungan::find()
            ->where(['like', 'notes', 'BILL-DEMO-'])
            ->andWhere(['status' => [Kunjungan::STATUS_DONE, Kunjungan::STATUS_IN_PROGRESS]])
            ->with('dokter')
            ->all();

        $types = [Resep::TYPE_RACIKAN, Resep::TYPE_TIDAK_RACIKAN];

        foreach ($kunjunganList as $kunjungan) {
            if (rand(1, 100) > 80) continue; // 80% chance to have resep

            $resep = new Resep();
            $resep->id = Uuid::uuid4()->toString();
            $resep->kunjungan_id = $kunjungan->id;
            $resep->dokter_id = $kunjungan->dokter_id;
            $resep->type = $types[array_rand($types)];
            $resep->no_resep = 'RES-DEMO-' . substr($resep->id, 0, 8);
            $resep->status = Resep::STATUS_PRESCRIBED;
            $resep->notes = 'BILL-DEMO-' . $resep->id;
            $resep->save(false);
        }
        $this->stdout("  ✓ Demo resep seeded\n");
    }

    private function seedDemoResepDetail(): void
    {
        // Check if demo resep detail already exist
        $existing = ResepDetail::find()->where(['like', 'notes', 'BILL-DEMO-'])->exists();
        if ($existing) {
            $this->stdout("  ⊘ Demo resep detail already exist, skipping\n");
            return;
        }

        $resepList = Resep::find()->where(['like', 'notes', 'BILL-DEMO-'])->all();
        $obatList = Obat::find()->where(['is_active' => true])->all();
        $freqOptions = [
            ResepDetail::FREQ_1X1, ResepDetail::FREQ_2X1, ResepDetail::FREQ_3X1,
            ResepDetail::FREQ_1X2, ResepDetail::FREQ_2X2, ResepDetail::FREQ_3X2,
            ResepDetail::FREQ_1X3, ResepDetail::FREQ_2X3, ResepDetail::FREQ_3X3,
        ];
        $routeOptions = [
            ResepDetail::ROUTE_ORAL, ResepDetail::ROUTE_SUBLINGUAL, ResepDetail::ROUTE_TOPICAL,
            ResepDetail::ROUTE_INHALASI, ResepDetail::ROUTE_INJEKSI, ResepDetail::ROUTE_REKTAL,
        ];

        foreach ($resepList as $resep) {
            $count = rand(1, 4);
            for ($i = 0; $i < $count; $i++) {
                $obat = $obatList[array_rand($obatList)];
                $quantity = rand(1, 30);
                $hargaSatuan = $obat->selling_price ?? rand(1000, 50000);

                $detail = new ResepDetail();
                $detail->id = Uuid::uuid4()->toString();
                $detail->resep_id = $resep->id;
                $detail->obat_id = $obat->id;
                $detail->quantity = $quantity;
                $detail->harga_satuan = $hargaSatuan;
                $detail->frequency = $freqOptions[array_rand($freqOptions)];
                $detail->route = $routeOptions[array_rand($routeOptions)];
                $detail->duration = rand(1, 14) . ' hari';
                $detail->instructions = 'Diminum setelah makan';
                $detail->notes = 'BILL-DEMO-' . $detail->id;
                $detail->save(false);
            }
        }
        $this->stdout("  ✓ Demo resep detail seeded\n");
    }
}
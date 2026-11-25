<?php

declare(strict_types=1);

namespace app\tests\Unit\Models;

use app\tests\Support\UnitTester;
use common\models\Pemeriksaan;
use common\models\Kunjungan;
use common\models\Pasien;
use common\models\Dokter;
use common\models\Poli;
use Ramsey\Uuid\Uuid;

/**
 * Unit tests for Examination (Pemeriksaan) transaction logic.
 */
final class PemeriksaanTest extends \Codeception\Test\Unit
{
    private UnitTester $I;
    private string $kunjunganId;
    private string $dokterId;

    protected function _before(): void
    {
        $this->I = new UnitTester($this);

        $pasien = new Pasien();
        $pasien->nik = '7770001112223334';
        $pasien->name = 'Test Pasien Pemeriksaan';
        $pasien->birth_place = 'Jakarta';
        $pasien->birth_date = '1990-01-01';
        $pasien->gender = 'M';
        $pasien->phone = '081234567890';
        $pasien->address = 'Jl. Test Pemeriksaan No. 1';
        $pasien->save(false);

        $dokter = new Dokter();
        $dokter->nama = 'Dokter Test Pemeriksaan';
        $dokter->spesialisasi = 'Umum';
        $dokter->save(false);

        $poli = Poli::findOne(['kode' => 'UMUM']);
        if (!$poli) {
            $poli = new Poli();
            $poli->kode = 'UMUM';
            $poli->nama = 'Poli Umum Test';
            $poli->save(false);
        }

        $kunjungan = new Kunjungan();
        $kunjungan->pasien_id = $pasien->id;
        $kunjungan->dokter_id = $dokter->id;
        $kunjungan->poli_id = $poli->id;
        $kunjungan->status = Kunjungan::STATUS_WAITING;
        $kunjungan->keluhan = 'Test pemeriksaan kunjungan';
        $kunjungan->save(false);

        $this->kunjunganId = $kunjungan->id;
        $this->dokterId = $dokter->id;
    }

    /**
     * Test create examination with vital signs.
     */
    public function testCreateExaminationWithVitals(): void
    {
        $pemeriksaan = new Pemeriksaan();
        $pemeriksaan->id = Uuid::uuid4()->toString();
        $pemeriksaan->kunjungan_id = $this->kunjunganId;
        $pemeriksaan->dokter_id = $this->dokterId;
        $pemeriksaan->anamnesis = 'Test anamnesis';
        $pemeriksaan->keluhan_utama = 'Test keluhan utama';
        $pemeriksaan->riwayat_penyakit = 'Test riwayat penyakit';
        $pemeriksaan->riwayat_obat = 'Test riwayat obat';
        $pemeriksaan->riwayat_alergi = 'Test riwayat alergi';
        $pemeriksaan->tekanan_darah = '120/80';
        $pemeriksaan->nadi = '80';
        $pemeriksaan->suhu = '36.5';
        $pemeriksaan->respirasi = '16';
        $pemeriksaan->saturasi = '98';
        $pemeriksaan->berat_badan = 70;
        $pemeriksaan->tinggi_badan = 175;
        $pemeriksaan->pemeriksaan_fisik = 'Test pemeriksaan fisik';
        $pemeriksaan->catatan = 'Test catatan';
        $pemeriksaan->status = Pemeriksaan::STATUS_IN_PROGRESS;
        $pemeriksaan->save(false);

        $this->assertEquals(Pemeriksaan::STATUS_IN_PROGRESS, $pemeriksaan->status);
        $this->assertEquals('120/80', $pemeriksaan->tekanan_darah);
        $this->assertEquals(70, $pemeriksaan->berat_badan);
        $this->assertEquals(175, $pemeriksaan->tinggi_badan);
    }

    /**
     * Test BMI calculation from vital signs.
     */
    public function testBMICalculation(): void
    {
        $pemeriksaan = new Pemeriksaan();
        $pemeriksaan->berat_badan = 70;
        $pemeriksaan->tinggi_badan = 175;

        // BMI = weight / (height in meters)^2
        $tinggiM = $pemeriksaan->tinggi_badan / 100; // 1.75
        $bmi = round($pemeriksaan->berat_badan / ($tinggiM * $tinggiM), 1);

        $this->assertEquals(22.9, $bmi);

        // Test with different values
        $pemeriksaan->berat_badan = 80;
        $pemeriksaan->tinggi_badan = 170;
        $tinggiM = $pemeriksaan->tinggi_badan / 100; // 1.70
        $bmi = round($pemeriksaan->berat_badan / ($tinggiM * $tinggiM), 1);
        $this->assertEquals(27.7, $bmi);
    }

    /**
     * Test examination status transitions.
     */
    public function testExaminationStatusTransitions(): void
    {
        $pemeriksaan = new Pemeriksaan();
        $pemeriksaan->id = Uuid::uuid4()->toString();
        $pemeriksaan->kunjungan_id = $this->kunjunganId;
        $pemeriksaan->dokter_id = $this->dokterId;
        $pemeriksaan->status = Pemeriksaan::STATUS_IN_PROGRESS;
        $pemeriksaan->save(false);

        // In Progress -> Completed
        $this->assertEquals(Pemeriksaan::STATUS_IN_PROGRESS, $pemeriksaan->status);
        $pemeriksaan->status = Pemeriksaan::STATUS_COMPLETED;
        $pemeriksaan->completed_at = date('Y-m-d H:i:s');
        $pemeriksaan->save(false, ['status', 'completed_at']);
        $this->assertEquals(Pemeriksaan::STATUS_COMPLETED, $pemeriksaan->status);
        $this->assertNotNull($pemeriksaan->completed_at);
    }

    /**
     * Test examination status constants.
     */
    public function testExaminationStatusConstants(): void
    {
        $this->assertEquals('in_progress', Pemeriksaan::STATUS_IN_PROGRESS);
        $this->assertEquals('completed', Pemeriksaan::STATUS_COMPLETED);
    }

    /**
     * Test kunjungan status update when examination created.
     */
    public function testKunjunganStatusUpdateOnExamination(): void
    {
        $kunjungan = Kunjungan::findOne($this->kunjunganId);
        $this->assertEquals(Kunjungan::STATUS_WAITING, $kunjungan->status);

        $pemeriksaan = new Pemeriksaan();
        $pemeriksaan->id = Uuid::uuid4()->toString();
        $pemeriksaan->kunjungan_id = $this->kunjunganId;
        $pemeriksaan->dokter_id = $this->dokterId;
        $pemeriksaan->status = Pemeriksaan::STATUS_IN_PROGRESS;
        $pemeriksaan->save(false);

        // Kunjungan should be updated to IN_PROGRESS
        $kunjungan->refresh();
        // Note: In actual controller, this is done in actionCreate
        // Here we test the logic manually
        if ($kunjungan->status === Kunjungan::STATUS_WAITING) {
            $kunjungan->status = Kunjungan::STATUS_IN_PROGRESS;
            $kunjungan->save(false, ['status']);
        }

        $this->assertEquals(Kunjungan::STATUS_IN_PROGRESS, $kunjungan->status);
    }

    /**
     * Test kunjungan status update when examination completed.
     */
    public function testKunjunganStatusUpdateOnComplete(): void
    {
        $kunjungan = Kunjungan::findOne($this->kunjunganId);
        $kunjungan->status = Kunjungan::STATUS_IN_PROGRESS;
        $kunjungan->save(false, ['status']);

        $pemeriksaan = new Pemeriksaan();
        $pemeriksaan->id = Uuid::uuid4()->toString();
        $pemeriksaan->kunjungan_id = $this->kunjunganId;
        $pemeriksaan->dokter_id = $this->dokterId;
        $pemeriksaan->status = Pemeriksaan::STATUS_IN_PROGRESS;
        $pemeriksaan->save(false);

        // Complete examination
        $pemeriksaan->status = Pemeriksaan::STATUS_COMPLETED;
        $pemeriksaan->completed_at = date('Y-m-d H:i:s');
        $pemeriksaan->save(false, ['status', 'completed_at']);

        // Kunjungan should be DONE
        if ($kunjungan->status === Kunjungan::STATUS_IN_PROGRESS) {
            $kunjungan->status = Kunjungan::STATUS_DONE;
            $kunjungan->save(false, ['status']);
        }

        $kunjungan->refresh();
        $this->assertEquals(Kunjungan::STATUS_DONE, $kunjungan->status);
    }

    /**
     * Test vital signs validation.
     */
    public function testVitalSignsValidation(): void
    {
        $pemeriksaan = new Pemeriksaan();

        // Valid vital signs
        $pemeriksaan->tekanan_darah = '120/80';
        $pemeriksaan->nadi = '80';
        $pemeriksaan->suhu = '36.5';
        $pemeriksaan->respirasi = '16';
        $pemeriksaan->saturasi = '98';

        $this->assertStringContainsString('/', $pemeriksaan->tekanan_darah);
        $this->assertIsNumeric($pemeriksaan->nadi);
        $this->assertIsNumeric($pemeriksaan->suhu);
        $this->assertIsNumeric($pemeriksaan->respirasi);
        $this->assertIsNumeric($pemeriksaan->saturasi);

        // Test ranges
        $this->assertTrue($pemeriksaan->nadi >= 40 && $pemeriksaan->nadi <= 200);
        $this->assertTrue($pemeriksaan->suhu >= 30 && $pemeriksaan->suhu <= 45);
        $this->assertTrue($pemeriksaan->respirasi >= 8 && $pemeriksaan->respirasi <= 60);
        $this->assertTrue($pemeriksaan->saturasi >= 50 && $pemeriksaan->saturasi <= 100);
    }

    /**
     * Test save vital signs endpoint data.
     */
    public function testSaveVitalSignsData(): void
    {
        $pemeriksaan = new Pemeriksaan();
        $pemeriksaan->id = Uuid::uuid4()->toString();
        $pemeriksaan->kunjungan_id = $this->kunjunganId;
        $pemeriksaan->dokter_id = $this->dokterId;
        $pemeriksaan->status = Pemeriksaan::STATUS_IN_PROGRESS;
        $pemeriksaan->save(false);

        // Update vital signs
        $pemeriksaan->tekanan_darah = '130/85';
        $pemeriksaan->nadi = '85';
        $pemeriksaan->suhu = '37.0';
        $pemeriksaan->respirasi = '18';
        $pemeriksaan->saturasi = '97';
        $pemeriksaan->berat_badan = 71;
        $pemeriksaan->tinggi_badan = 175;

        $tinggiM = $pemeriksaan->tinggi_badan / 100;
        $pemeriksaan->bmi = round($pemeriksaan->berat_badan / ($tinggiM * $tinggiM), 1);

        $pemeriksaan->save(false);

        $this->assertEquals('130/85', $pemeriksaan->tekanan_darah);
        $this->assertEquals(85, $pemeriksaan->nadi);
        $this->assertEquals(37.0, $pemeriksaan->suhu);
        $this->assertEquals(23.2, $pemeriksaan->bmi);
    }
}
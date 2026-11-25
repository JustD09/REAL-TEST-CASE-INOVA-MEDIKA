<?php

declare(strict_types=1);

namespace app\tests\Functional;

use app\tests\Support\ApiTester;
use app\models\Kunjungan;
use app\models\Dokter;
use app\models\Pasien;
use app\models\Pemeriksaan;
use app\models\Resep;
use app\models\ResepDetail;
use app\models\Billing;
use app\models\Pembayaran;
use Ramsey\Uuid\Uuid;

/**
 * Integration tests for significant transaction processes.
 * Tests cover: Pembayaran (Payment), Resep (Prescription), and Pemeriksaan (Examination) workflows.
 */
final class APITransactionCest
{
    /**
     * Creates test Patient, Doctor, Visit, Billing.
     */
    public function _before(ApiTester $I): void
    {
        // Create test patient
        $patientData = [
            'title' => 'Test',
            'nik' => '1234567890123456',
            'name' => 'Test Pasien Integration',
            'birth_place' => 'Jakarta',
            'birth_date' => '1990-01-01',
            'gender' => 'M',
            'phone' => '081234567890',
            'address' => 'Jl. Test Integration No. 1',
        ];

        $pasien = Pasien::findOne(['nik' => $patientData['nik']]);
        if (!$pasien) {
            $pasien = new Pasien();
            $pasien->attributes = $patientData;
            $pasien->save(false);
        }

        // Create test doctor
        $dokter = Dokter::findOne(['nama' => 'Dokter Integration Test']);
        if (!$dokter) {
            $dokter = new Dokter();
            $dokter->nama = 'Dokter Integration Test';
            $dokter->spesialisasi = 'Umum';
            $dokter->save(false);
        }

        // Create visit
        $kunjungan = new Kunjungan();
        $kunjungan->pasien_id = $pasien->id;
        $kunjungan->dokter_id = $dokter->id;
        $kunjungan->poli_id = 1; // Assume existing poli
        $kunjungan->status = Kunjungan::STATUS_WAITING;
        $kunjungan->keluhan = 'Integration test kunjungan';
        $kunjungan->save(false);
    }

    /**
     * Creates a dental examination.
     * Transaction: Pemeriksaan.
     */
    public function createExamination(ApiTester $I): void
    {
        $I->amHttpAuthenticated('admin', 'admin123');
        $I->haveHttpHeader('Content-Type', 'application/json');

        $I->sendPost('/api/v1/pemeriksaan', [
            'kunjungan_id' => $I->grabFromDatabase('kunjungan', 'id', ['status' => Kunjungan::STATUS_WAITING, 'created_at' => '2026-01-01 00:00:00']),
            'dokter_id' => $I->grabFromDatabase('dokter', 'id', ['nama' => 'Dokter Integration Test', 'created_at' => '2026-01-01 00:00:00']),
            'anamnesis' => 'Pemeriksaan integration test',
            'keluhan_utama' => 'Integration keluhan',
            'riwayat_penyakit' => '',
            'riwayat_obat' => '',
            'riwayat_alergi' => '',
            'tekanan_darah' => '120/80',
            'nadi' => '80',
            'suhu' => '36.5',
            'respirasi' => '16',
            'saturasi' => '98',
            'berat_badan' => '70',
            'tinggi_badan' => '175',
            'pemeriksaan_fisik' => 'Integration pemeriksaan fisik',
            'catatan' => '',
        ]);

        $I->seeResponseCodeIs(201);
        $I->seeResponseIsJson();

        $response = json_decode($I->grabResponse(), true);
        if (isset($response['data']['id'])) {
            $I->comment('Created examination: ' . $response['data']['id']);
        }
    }

    /**
     * Completes an examination and generates a billing.
     * Transaction: Pemeriksaan + Billing.
     */
    public function completeExaminationAndCreateBilling(ApiTester $I): void
    {
        $examinationId = $I->grabFromDatabase('pemeriksaan', 'id', ['catatan' => 'Integration test kunjungan', 'created_at' => '2026-01-01 00:00:00']);

        $I->amHttpAuthenticated('admin', 'admin123');
        $I->haveHttpHeader('Content-Type', 'application/json');

        $I->sendPost('/api/v1/pemeriksaan/complete/' . $examinationId, [
            'diagnosa_utama_id' => 1,
            'diagnosa_sekunder_ids' => [1, 2],
        ]);

        $I->seeResponseCodeIs(200);
        $I->seeResponseIsJson();

        $response = json_decode($I->grabResponse(), true);
        if (isset($response['success'])) {
            $I->comment('Examination completed, billing created');
        }

        // Verify billing was created
        $billingId = $I->grabFromDatabase('billing', 'id', [
            'kunjungan_id' => $I->grabFromDatabase('kunjungan', 'id', ['status' => Kunjungan::STATUS_DONE, 'created_at' => '2026-01-01 00:00:00']),
            'created_at' => '2026-01-01 00:00:00'
        ]);

        if ($billingId) {
            $I->comment('Billing created: ' . $billingId);
        }
    }

    /**
     * Creates a prescription for a completed examination.
     * Transaction: Resep.
     */
    public function createPrescription(ApiTester $I): void
    {
        $billingId = $I->grabFromDatabase('billing', 'id', [
            'kunjungan_id' => $I->grabFromDatabase('kunjungan', 'id', ['status' => Kunjungan::STATUS_DONE, 'created_at' => '2026-01-01 00:00:00']),
            'total' => $I->grabDataFromDatabase('billing', 'total', ['status' => Billing::STATUS_UNPAID, 'created_at' => '2026-01-01 00:00:00']),
            'created_at' => '2026-01-01 00:00:00'
        ]);

        $kunjunganId = $I->grabFromDatabase('kunjungan', 'id', ['status' => Kunjungan::STATUS_DONE, 'created_at' => '2026-01-01 00:00:00']);
        $dokterId = $I->grabFromDatabase('dokter', 'id', ['nama' => 'Dokter Integration Test', 'created_at' => '2026-01-01 00:00:00']);
        $pemeriksaanId = $I->grabFromDatabase('pemeriksaan', 'id', ['catatan' => 'Integration test kunjungan', 'created_at' => '2026-01-01 00:00:00']);

        $I->amHttpAuthenticated('admin', 'admin123');
        $I->haveHttpHeader('Content-Type', 'application/json');

        $I->sendPost('/api/v1/resep', [
            'kunjungan_id' => $kunjunganId,
            'dokter_id' => $dokterId,
            'pemeriksaan_id' => $pemeriksaanId,
            'catatan' => 'Integrasi resep created test',
            'details' => [
                [
                    'obat_id' => 1,
                    'qty' => 5,
                    'harga' => 10000,
                    'aturan_pakai' => '1 tablet 3x sehari',
                    'jumlah_hari' => 3,
                ],
                [
                    'obat_id'  => 2,
                    'qty' => 3,
                    'harga' => 15000,
                    'aturan_pakai' => '2 tablet 2x sehari',
                    'jumlah_hari' => 5,
                ],
            ],
        ]);

        $I->seeResponseCodeIs(201);
        $I->seeResponseIsJson();

        $response = json_decode($I->grabResponse(), true);
        if (isset($response['data']['id'])) {
            $I->comment('Created prescription: ' . $response['data']['id']);
        }
    }

    /**
     * Submits and dispenses the prescription.
     * Transaction: Resep.
     */
    public function submitAndDispensePrescription(ApiTester $I): void
    {
        $resepId = $I->grabFromDatabase('resep', 'id', ['catatan' => 'Integrasi resep created test', 'status' => Resep::STATUS_DRAFT, 'created_at' => '2026-01-01 00:00:00']);

        $I->amHttpAuthenticated('admin', 'admin123');
        $I->haveHttpHeader('Content-Type', 'application/json');

        // Submit prescription
        $I->sendPost('/api/v1/resep/submit/' . $resepId);
        $I->seeResponseCodeIs(200);
        $I->seeResponseIsJson();
        $I->comment('Prescription submitted');

        // Dispense prescription
        $I->sendPost('/api/v1/resep/dispense/' . $resepId, [
            'details' => [
                [
                    'detail_id' => $I->grabFromDatabase('resep_detail', 'id', ['resep_id' => $resepId, 'qty' => 5, 'created_at' => '2026-01-01 00:00:00']),
                    'dispensed_qty' => 2,
                ],
                [
                    'detail_id' => $I->grabFromDatabase('resep_detail', 'id', ['resep_id' => $resepId, 'qty' => 3, 'dispensed_quantity' => 0, 'created_at' => '2026-01-01 00:00:00']),
                    'dispensed_qty' => 3,
                ],
            ],
        ]);

        $I->seeResponseCodeIs(200);
        $I->seeResponseIsJson();

        $response = json_decode($I->grabResponse(), true);
        if (isset($response['success'])) {
            $I->comment('Prescription dispensed');
        }
    }

    /**
     * Processes payment for the billing.
     * Transaction: Pembayaran.
     */
    public function processPayment(ApiTester $I): void
    {
        $billingId = $I->grabFromDatabase('billing', 'id', [
            'kunjungan_id' => $I->grabFromDatabase('kunjungan', 'id', ['status' => Kunjungan::STATUS_DONE, 'created_at' => '2026-01-01 00:00:00']),
            'status' => Billing::STATUS_UNPAID,
            'created_at' => '2026-01-01 00:00:00'
        ]);

        $I->amHttpAuthenticated('admin', 'admin123');
        $I->haveHttpHeader('Content-Type', 'application/json');
        $I->haveHttpHeader('Idempotency-Key', 'test-payment-' . time());

        $paymentAmount = $I->grabFromDatabase('billing', 'total', ['id' => $billingId]);
        $reference = 'INV/' . $billingId . '/' . time();

        $I->sendPost('/api/v1/pembayaran', [
            'billing_id' => $billingId,
            'amount' => round($paymentAmount * 0.5, 2), // Pay 50%
            'method' => 'cash',
            'reference' => $reference,
            'notes' => 'Integrasi payment partial',
        ]);

        $I->seeResponseCodeIs(200);
        $I->seeResponseIsJson();

        $response = json_decode($I->grabResponse(), true);
        if (isset($response['data']['id'])) {
            $paymentId = $response['data']['id'];
            $I->comment('Payment processed: ' . $paymentId);
        }
    }

    /**
     * Partial payment for the billing.
     * Transaction: Pembayaran.
     */
    public function processPartialPayment(ApiTester $I): void
    {
        $billingId = $I->grabFromDatabase('billing', 'id', [
            'kunjungan_id' => $I->grabFromDatabase('kunjungan', 'id', ['status' => Kunjungan::STATUS_DONE, 'created_at' => '2026-01-01 00:00:00']),
            'status' => Billing::STATUS_PARTIAL,
            'created_at' => '2026-01-01 00:00:00'
        ]);

        $I->amHttpAuthenticated('admin', 'admin123');
        $I->haveHttpHeader('Content-Type', 'application/json');
        $I->haveHttpHeader('Idempotency-Key', 'test-payment-partial-' . time());

        $paymentAmount = $I->grabFromDatabase('billing', 'total', ['id' => $billingId]) - $I->grabFromDatabase('billing', 'paid_amount', ['id' => $billingId]);

        $I->sendPost('/api/v1/pembayaran', [
            'billing_id' => $billingId,
            'amount' => round($paymentAmount * 0.7, 2), // Pay remaining 70%
            'method' => 'transfer',
            'reference' => 'INV/' . $billingId . '/' . time(),
            'notes' => 'Integrasi payment remaining',
        ]);

        $I->seeResponseCodeIs(200);
        $I->seeResponseIsJson();

        $response = json_decode($I->grabResponse(), true);
        if (isset($response['success'])) {
            $I->comment('Partial payment processed');
        }
    }

    /**
     * Refund a payment.
     * Transaction: Pembayaran.
     */
    public function refundPayment(ApiTester $I): void
    {
        $billingId = $I->grabFromDatabase('billing', 'id', [
            'kunjungan_id' => $I->grabFromDatabase('kunjungan', 'id', ['status' => Kunjungan::STATUS_DONE, 'created_at' => '2026-01-01 00:00:00']),
            'status' => Billing::STATUS_PARTIAL,
            'created_at' => '2026-01-01 00:00:00'
        ]);

        $paymentId = $I->grabFromDatabase('pembayaran', 'id', [
            'billing_id' => $billingId,
            'status' => Pembayaran::STATUS_SUCCESS,
            'created_at' => '2026-01-01 00:00:00'
        ]);

        $I->amHttpAuthenticated('admin', 'admin123');
        $I->haveHttpHeader('Content-Type', 'application/json');

        $I->sendPost('/api/v1/pembayaran/refund/' . $paymentId, [
            'reason' => 'Refund integration test',
        ]);

        $I->seeResponseCodeIs(200);
        $I->seeResponseIsJson();

        $response = json_decode($I->grabResponse(), true);
        if (isset($response['success'])) {
            $I->comment('Payment refunded');
        }
    }

    /**
     * Invalid payment exceeds outstanding balance.
     * Validation: Payment max amount check.
     */
    public function invalidPaymentAmount(ApiTester $I): void
    {
        $billingId = $I->grabFromDatabase('billing', 'id', [
            'kunjungan_id' => $I->grabFromDatabase('kunjungan', 'id', ['status' => Kunjungan::STATUS_DONE, 'created_at' => '2026-01-01 00:00:00']),
            'status' => Billing::STATUS_UNPAID,
            'created_at' => '2026-01-01 00:00:00'
        ]);

        $I->amHttpAuthenticated('admin', 'admin123');
        $I->haveHttpHeader('Content-Type', 'application/json');

        $outstanding = $I->grabFromDatabase('billing', 'total', ['id' => $billingId]) - $I->grabFromDatabase('billing', 'paid_amount', ['id' => $billingId]);

        $I->sendPost('/api/v1/pembayaran', [
            'billing_id' => $billingId,
            'amount' => round($outstanding + 1000.00, 2), // Exceeds outstanding
            'method' => 'cash',
            'reference' => 'INV/' . $billingId . '/' . time(),
        ]);

        $I->seeResponseCodeIs(400);
        $I->seeResponseContains('lebihi sisa tagihan');
        $I->comment('Invalid payment amount rejected');
    }

    /**
     * Duplicate payment prevented by idempotency key.
     * Validation: Duplicate prevention.
     */
    public function duplicatePaymentPrevented(ApiTester $I): void
    {
        $billingId = $I->grabFromDatabase('billing', 'id', [
            'kunjungan_id' => $I->grabFromDatabase('kunjungan', 'id', ['status' => Kunjungan::STATUS_DONE, 'created_at' => '2026-01-01 00:00:00']),
            'status' => Billing::STATUS_UNPAID,
            'created_at' => '2026-01-01 00:00:00'
        ]);

        $I->amHttpAuthenticated('admin', 'admin123');
        $I->haveHttpHeader('Content-Type', 'application/json');

        // First payment
        $reference = 'INV/' . $billingId . '/test-' . time();
        $I->sendPost('/api/v1/pembayaran', [
            'billing_id' => $billingId,
            'amount' => 10000,
            'method' => 'cash',
            'reference' => $reference,
        ]);
        $I->seeResponseCodeIs(201);
        $I->seeResponseIsJson();

        // Second payment with same idempotency
        $I->sendPost('/api/v1/pembayaran', [
            'billing_id' => $billingId,
            'amount' => 10000,
            'method' => 'cash',
            'reference' => $reference,
        ]);
        $I->seeResponseCodeIs(200);
        $I->seeResponseContains('duplikat');
        $I->comment('Duplicate payment prevented');
    }

    /**
     * Medical examination with all vital signs.
     * Validation: Vitals completeness.
     */
    public function examinationWithAllVitals(ApiTester $I): void
    {
        $kunjunganId = $I->grabFromDatabase('kunjungan', 'id', ['status' => Kunjungan::STATUS_WAITING, 'created_at' => '2026-01-01 00:00:00']);

        // Save vital signs directly first
        $I->amHttpAuthenticated('admin', 'admin123');
        $I->amHttpAuthenticated('admin', 'admin123');
        $I->haveHttpHeader('Content-Type', 'application/json');

        // Create examination
        $I->sendPost('/api/v1/pemeriksaan', [
            'kunjungan_id' => $kunjunganId,
            'dokter_id' => $I->grabFromDatabase('dokter', 'id', ['nama' => 'Dokter Integration Test', 'created_at' => '2026-01-01 00:00:00']),
            'anamnesis' => 'Pemeriksaan vitals integration',
            'keluhan_utama' => 'Integration keluhan',
            'riwayat_penyakit' => '',
            'riwayat_obat' => '',
            'riwayat_alergi' => '',
            'tekanan_darah' => '120/80',
            'nadi' => '80',
            'suhu' => '36.5',
            'respirasi' => '16',
            'saturasi' => '98',
            'berat_badan' => '70',
            'tinggi_badan' => '175',
            'pemeriksaan_fisik' => 'Integration pemeriksaan fisik',
            'catatan' => '',
        ]);

        $I->seeResponseCodeIs(201);
        $I->seeResponseIsJson();

        $response = json_decode($I->grabResponse(), true);
        if (isset($response['data']['id'])) {
            $examinationId = $response['data']['id'];

            // Get saved vital signs
            $I->sendGet('/api/v1/pemeriksaan/' . $examinationId . '/vital-signs');
            $I->seeResponseCodeIs(200);
            $I->seeResponseIsJson();

            $response = json_decode($I->grabResponse(), true);
            if (isset($response['data']['tekanan_darah'])) {
                $I->comment('Vital signs saved and retrieved');
            }
        }
    }
}
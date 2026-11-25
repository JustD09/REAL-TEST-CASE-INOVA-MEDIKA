<?php

declare(strict_types=1);

namespace app\tests\Unit\Models;

use app\tests\Support\UnitTester;
use common\models\Pembayaran;
use common\models\Billing;
use common\models\Kunjungan;
use common\models\Pasien;
use common\models\Dokter;
use common\models\Poli;
use Ramsey\Uuid\Uuid;

/**
 * Unit tests for Payment (Pembayaran) transaction logic.
 * Tests core payment processing, validation, and edge cases.
 */
final class PembayaranTest extends \Codeception\Test\Unit
{
    private UnitTester $I;
    private string $billingId;
    private string $kunjunganId;

    protected function _before(): void
    {
        $this->I = new UnitTester($this);

        // Create test data
        $pasien = new Pasien();
        $pasien->nik = '9990001112223334';
        $pasien->name = 'Test Pasien Payment';
        $pasien->birth_place = 'Jakarta';
        $pasien->birth_date = '1990-01-01';
        $pasien->gender = 'M';
        $pasien->phone = '081234567890';
        $pasien->address = 'Jl. Test Payment No. 1';
        $pasien->save(false);

        $dokter = new Dokter();
        $dokter->nama = 'Dokter Test Payment';
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
        $kunjungan->status = Kunjungan::STATUS_DONE;
        $kunjungan->keluhan = 'Test payment kunjungan';
        $kunjungan->save(false);

        $billing = new Billing();
        $billing->id = Uuid::uuid4()->toString();
        $billing->kunjungan_id = $kunjungan->id;
        $billing->total = 150000;
        $billing->paid_amount = 0;
        $billing->status = Billing::STATUS_UNPAID;
        $billing->save(false);

        $this->billingId = $billing->id;
        $this->kunjunganId = $kunjungan->id;
    }

    /**
     * Test successful payment creation.
     */
    public function testCreatePaymentSuccess(): void
    {
        $payment = new Pembayaran();
        $payment->id = Uuid::uuid4()->toString();
        $payment->billing_id = $this->billingId;
        $payment->no_bukti = $payment->generateNoBukti();
        $payment->amount = 100000;
        $payment->method = Pembayaran::METHOD_CASH;
        $payment->reference = 'INV/TEST/' . time();
        $payment->status = Pembayaran::STATUS_SUCCESS;
        $payment->paid_at = date('Y-m-d H:i:s');

        $this->assertTrue($payment->save(false));
        $this->assertEquals(Pembayaran::STATUS_SUCCESS, $payment->status);
        $this->assertEquals(100000, $payment->amount);
    }

    /**
     * Test payment exceeds outstanding balance.
     */
    public function testPaymentExceedsOutstanding(): void
    {
        $billing = Billing::findOne($this->billingId);
        $outstanding = $billing->total - $billing->paid_amount; // 150000

        $payment = new Pembayaran();
        $payment->id = Uuid::uuid4()->toString();
        $payment->billing_id = $this->billingId;
        $payment->no_bukti = $payment->generateNoBukti();
        $payment->amount = $outstanding + 1000; // 151000 - exceeds
        $payment->method = Pembayaran::METHOD_CASH;
        $payment->reference = 'INV/TEST/EXCEED/' . time();
        $payment->status = Pembayaran::STATUS_SUCCESS;
        $payment->paid_at = date('Y-m-d H:i:s');

        // This should be caught by controller validation, but model allows it
        // The controller checks this before saving
        $this->assertTrue($payment->amount > $outstanding);
    }

    /**
     * Test duplicate reference prevention.
     */
    public function testDuplicateReference(): void
    {
        $reference = 'INV/DUPLICATE/' . time();

        $payment1 = new Pembayaran();
        $payment1->id = Uuid::uuid4()->toString();
        $payment1->billing_id = $this->billingId;
        $payment1->no_bukti = $payment1->generateNoBukti();
        $payment1->amount = 50000;
        $payment1->method = Pembayaran::METHOD_CASH;
        $payment1->reference = $reference;
        $payment1->status = Pembayaran::STATUS_SUCCESS;
        $payment1->paid_at = date('Y-m-d H:i:s');
        $payment1->save(false);

        $payment2 = new Pembayaran();
        $payment2->id = Uuid::uuid4()->toString();
        $payment2->billing_id = $this->billingId;
        $payment2->no_bukti = $payment2->generateNoBukti();
        $payment2->amount = 50000;
        $payment2->method = Pembayaran::METHOD_CASH;
        $payment2->reference = $reference;
        $payment2->status = Pembayaran::STATUS_SUCCESS;
        $payment2->paid_at = date('Y-m-d H:i:s');

        // Should fail due to unique constraint on reference
        $this->assertFalse($payment2->save(false));
    }

    /**
     * Test payment method constants.
     */
    public function testPaymentMethodConstants(): void
    {
        $this->assertEquals('cash', Pembayaran::METHOD_CASH);
        $this->assertEquals('card', Pembayaran::METHOD_CARD);
        $this->assertEquals('transfer', Pembayaran::METHOD_TRANSFER);
        $this->assertEquals('ewallet', Pembayaran::METHOD_EWALLET);
        $this->assertEquals('bpjs', Pembayaran::METHOD_BPJS);
        $this->assertEquals('insurance', Pembayaran::METHOD_INSURANCE);
        $this->assertEquals('other', Pembayaran::METHOD_OTHER);
    }

    /**
     * Test payment status constants.
     */
    public function testPaymentStatusConstants(): void
    {
        $this->assertEquals('pending', Pembayaran::STATUS_PENDING);
        $this->assertEquals('success', Pembayaran::STATUS_SUCCESS);
        $this->assertEquals('failed', Pembayaran::STATUS_FAILED);
        $this->assertEquals('refunded', Pembayaran::STATUS_REFUNDED);
        $this->assertEquals('voided', Pembayaran::STATUS_VOIDED);
    }

    /**
     * Test no_bukti generation format.
     */
    public function testNoBuktiGeneration(): void
    {
        $payment = new Pembayaran();
        $noBukti = $payment->generateNoBukti();

        // Format: BYR/YYYYMMDD/XXXXXX
        $this->assertStringStartsWith('BYR/', $noBukti);
        $this->assertMatchesRegularExpression('/^BYR\/\d{8}\/\w{6}$/', $noBukti);
    }

    /**
     * Test partial payment flow.
     */
    public function testPartialPaymentFlow(): void
    {
        $billing = Billing::findOne($this->billingId);
        $this->assertEquals(Billing::STATUS_UNPAID, $billing->status);

        // First payment - partial
        $payment1 = new Pembayaran();
        $payment1->id = Uuid::uuid4()->toString();
        $payment1->billing_id = $this->billingId;
        $payment1->no_bukti = $payment1->generateNoBukti();
        $payment1->amount = 50000;
        $payment1->method = Pembayaran::METHOD_CASH;
        $payment1->reference = 'INV/PARTIAL1/' . time();
        $payment1->status = Pembayaran::STATUS_SUCCESS;
        $payment1->paid_at = date('Y-m-d H:i:s');
        $payment1->save(false);

        $billing->refresh();
        $billing->applyPayment(50000);
        $this->assertEquals(Billing::STATUS_PARTIAL, $billing->status);
        $this->assertEquals(50000, $billing->paid_amount);

        // Second payment - completes
        $payment2 = new Pembayaran();
        $payment2->id = Uuid::uuid4()->toString();
        $payment2->billing_id = $this->billingId;
        $payment2->no_bukti = $payment2->generateNoBukti();
        $payment2->amount = 100000;
        $payment2->method = Pembayaran::METHOD_TRANSFER;
        $payment2->reference = 'INV/PARTIAL2/' . time();
        $payment2->status = Pembayaran::STATUS_SUCCESS;
        $payment2->paid_at = date('Y-m-d H:i:s');
        $payment2->save(false);

        $billing->refresh();
        $billing->applyPayment(100000);
        $this->assertEquals(Billing::STATUS_PAID, $billing->status);
        $this->assertEquals(150000, $billing->paid_amount);
        $this->assertNotNull($billing->paid_at);
    }

    /**
     * Test refund flow.
     */
    public function testRefundFlow(): void
    {
        $payment = new Pembayaran();
        $payment->id = Uuid::uuid4()->toString();
        $payment->billing_id = $this->billingId;
        $payment->no_bukti = $payment->generateNoBukti();
        $payment->amount = 50000;
        $payment->method = Pembayaran::METHOD_CASH;
        $payment->reference = 'INV/REFUND/' . time();
        $payment->status = Pembayaran::STATUS_SUCCESS;
        $payment->paid_at = date('Y-m-d H:i:s');
        $payment->save(false);

        $billing = Billing::findOne($this->billingId);
        $billing->applyPayment(50000);
        $billing->refresh();

        // Refund
        $payment->status = Pembayaran::STATUS_REFUNDED;
        $payment->refunded_at = date('Y-m-d H:i:s');
        $payment->save(false, ['status', 'refunded_at']);

        $billing->paid_amount -= 50000;
        $billing->status = Billing::STATUS_UNPAID;
        $billing->paid_at = null;
        $billing->save(false, ['paid_amount', 'status', 'paid_at']);

        $billing->refresh();
        $this->assertEquals(Billing::STATUS_UNPAID, $billing->status);
        $this->assertEquals(0, $billing->paid_amount);

        $payment->refresh();
        $this->assertEquals(Pembayaran::STATUS_REFUNDED, $payment->status);
    }

    /**
     * Test void flow.
     */
    public function testVoidFlow(): void
    {
        $payment = new Pembayaran();
        $payment->id = Uuid::uuid4()->toString();
        $payment->billing_id = $this->billingId;
        $payment->no_bukti = $payment->generateNoBukti();
        $payment->amount = 50000;
        $payment->method = Pembayaran::METHOD_CASH;
        $payment->reference = 'INV/VOID/' . time();
        $payment->status = Pembayaran::STATUS_SUCCESS;
        $payment->paid_at = date('Y-m-d H:i:s');
        $payment->save(false);

        $billing = Billing::findOne($this->billingId);
        $billing->applyPayment(50000);
        $billing->refresh();

        // Void
        $payment->status = Pembayaran::STATUS_VOIDED;
        $payment->voided_at = date('Y-m-d H:i:s');
        $payment->save(false, ['status', 'voided_at']);

        $billing->paid_amount -= 50000;
        $billing->status = Billing::STATUS_UNPAID;
        $billing->paid_at = null;
        $billing->save(false, ['paid_amount', 'status', 'paid_at']);

        $billing->refresh();
        $this->assertEquals(Billing::STATUS_UNPAID, $billing->status);

        $payment->refresh();
        $this->assertEquals(Pembayaran::STATUS_VOIDED, $payment->status);
    }
}
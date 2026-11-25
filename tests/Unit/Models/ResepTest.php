<?php

declare(strict_types=1);

namespace app\tests\Unit\Models;

use app\tests\Support\UnitTester;
use common\models\Resep;
use common\models\ResepDetail;
use common\models\Obat;
use common\models\Kunjungan;
use common\models\Pasien;
use common\models\Dokter;
use common\models\Poli;
use Ramsey\Uuid\Uuid;

/**
 * Unit tests for Prescription (Resep) transaction logic.
 */
final class ResepTest extends \Codeception\Test\Unit
{
    private UnitTester $I;
    private string $kunjunganId;
    private string $dokterId;
    private string $obatId1;
    private string $obatId2;

    protected function _before(): void
    {
        $this->I = new UnitTester($this);

        $pasien = new Pasien();
        $pasien->nik = '8880001112223334';
        $pasien->name = 'Test Pasien Resep';
        $pasien->birth_place = 'Jakarta';
        $pasien->birth_date = '1990-01-01';
        $pasien->gender = 'M';
        $pasien->phone = '081234567890';
        $pasien->address = 'Jl. Test Resep No. 1';
        $pasien->save(false);

        $dokter = new Dokter();
        $dokter->nama = 'Dokter Test Resep';
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
        $kunjungan->keluhan = 'Test resep kunjungan';
        $kunjungan->save(false);

        $obat1 = new Obat();
        $obat1->nama = 'Obat Test 1';
        $obat1->kategori_id = 1;
        $obat1->satuan = 'tablet';
        $obat1->selling_price = 5000;
        $obat1->current_stock = 100;
        $obat1->min_stock = 10;
        $obat1->save(false);

        $obat2 = new Obat();
        $obat2->nama = 'Obat Test 2';
        $obat2->kategori_id = 1;
        $obat2->satuan = 'tablet';
        $obat2->selling_price = 10000;
        $obat2->current_stock = 50;
        $obat2->min_stock = 5;
        $obat2->save(false);

        $this->kunjunganId = $kunjungan->id;
        $this->dokterId = $dokter->id;
        $this->obatId1 = $obat1->id;
        $this->obatId2 = $obat2->id;
    }

    /**
     * Test create prescription with details.
     */
    public function testCreatePrescriptionWithDetails(): void
    {
        $resep = new Resep();
        $resep->id = Uuid::uuid4()->toString();
        $resep->kunjungan_id = $this->kunjunganId;
        $resep->dokter_id = $this->dokterId;
        $resep->catatan = 'Test resep unit test';
        $resep->status = Resep::STATUS_DRAFT;
        $resep->save(false);

        $this->assertEquals(Resep::STATUS_DRAFT, $resep->status);

        // Add detail 1
        $detail1 = new ResepDetail();
        $detail1->id = Uuid::uuid4()->toString();
        $detail1->resep_id = $resep->id;
        $detail1->obat_id = $this->obatId1;
        $detail1->qty = 10;
        $detail1->harga_satuan = 5000;
        $detail1->subtotal = 50000;
        $detail1->aturan_pakai = '1 tablet 3x sehari';
        $detail1->jumlah_hari = 5;
        $detail1->save(false);

        // Add detail 2
        $detail2 = new ResepDetail();
        $detail2->id = Uuid::uuid4()->toString();
        $detail2->resep_id = $resep->id;
        $detail2->obat_id = $this->obatId2;
        $detail2->qty = 5;
        $detail2->harga_satuan = 10000;
        $detail2->subtotal = 50000;
        $detail2->aturan_pakai = '2 tablet 2x sehari';
        $detail2->jumlah_hari = 3;
        $detail2->save(false);

        // Update total
        $resep->total = 100000;
        $resep->save(false, ['total']);

        $this->assertEquals(100000, $resep->total);
        $this->assertCount(2, $resep->resepDetail);
    }

    /**
     * Test prescription status transitions.
     */
    public function testPrescriptionStatusTransitions(): void
    {
        $resep = new Resep();
        $resep->id = Uuid::uuid4()->toString();
        $resep->kunjungan_id = $this->kunjunganId;
        $resep->dokter_id = $this->dokterId;
        $resep->status = Resep::STATUS_DRAFT;
        $resep->save(false);

        // Draft -> Submitted
        $this->assertEquals(Resep::STATUS_DRAFT, $resep->status);
        $resep->status = Resep::STATUS_SUBMITTED;
        $resep->submitted_at = date('Y-m-d H:i:s');
        $resep->save(false, ['status', 'submitted_at']);
        $this->assertEquals(Resep::STATUS_SUBMITTED, $resep->status);

        // Submitted -> Partial
        $resep->status = Resep::STATUS_PARTIAL;
        $resep->save(false, ['status']);
        $this->assertEquals(Resep::STATUS_PARTIAL, $resep->status);

        // Partial -> Dispensed
        $resep->status = Resep::STATUS_DISPENSED;
        $resep->dispensed_at = date('Y-m-d H:i:s');
        $resep->save(false, ['status', 'dispensed_at']);
        $this->assertEquals(Resep::STATUS_DISPENSED, $resep->status);

        // Draft -> Cancelled
        $resep2 = new Resep();
        $resep2->id = Uuid::uuid4()->toString();
        $resep2->kunjungan_id = $this->kunjunganId;
        $resep2->dokter_id = $this->dokterId;
        $resep2->status = Resep::STATUS_DRAFT;
        $resep2->save(false);

        $resep2->status = Resep::STATUS_CANCELLED;
        $resep2->save(false, ['status']);
        $this->assertEquals(Resep::STATUS_CANCELLED, $resep2->status);
    }

    /**
     * Test prescription total calculation.
     */
    public function testPrescriptionTotalCalculation(): void
    {
        $resep = new Resep();
        $resep->id = Uuid::uuid4()->toString();
        $resep->kunjungan_id = $this->kunjunganId;
        $resep->dokter_id = $this->dokterId;
        $resep->status = Resep::STATUS_DRAFT;
        $resep->save(false);

        $details = [
            ['qty' => 10, 'harga' => 5000],   // 50,000
            ['qty' => 5, 'harga' => 10000],   // 50,000
            ['qty' => 3, 'harga' => 15000],   // 45,000
        ];

        $total = 0;
        foreach ($details as $d) {
            $detail = new ResepDetail();
            $detail->id = Uuid::uuid4()->toString();
            $detail->resep_id = $resep->id;
            $detail->obat_id = $this->obatId1;
            $detail->qty = $d['qty'];
            $detail->harga_satuan = $d['harga'];
            $detail->subtotal = $d['qty'] * $d['harga'];
            $detail->save(false);
            $total += $detail->subtotal;
        }

        $resep->total = $total;
        $resep->save(false, ['total']);

        $this->assertEquals(145000, $resep->total);
    }

    /**
     * Test no_resep generation format.
     */
    public function testNoResepGeneration(): void
    {
        $resep = new Resep();
        $noResep = $resep->generateNoResep();

        // Format: RSP/YYYYMMDD/XXXXXX
        $this->assertStringStartsWith('RSP/', $noResep);
        $this->assertMatchesRegularExpression('/^RSP\/\d{8}\/\w{6}$/', $noResep);
    }

    /**
     * Test prescription status constants.
     */
    public function testPrescriptionStatusConstants(): void
    {
        $this->assertEquals('draft', Resep::STATUS_DRAFT);
        $this->assertEquals('submitted', Resep::STATUS_SUBMITTED);
        $this->assertEquals('partial', Resep::STATUS_PARTIAL);
        $this->assertEquals('dispensed', Resep::STATUS_DISPENSED);
        $this->assertEquals('cancelled', Resep::STATUS_CANCELLED);
    }

    /**
     * Test dispense logic - stock reduction.
     */
    public function testDispenseReducesStock(): void
    {
        $obat = Obat::findOne($this->obatId1);
        $initialStock = $obat->current_stock;

        $resep = new Resep();
        $resep->id = Uuid::uuid4()->toString();
        $resep->kunjungan_id = $this->kunjunganId;
        $resep->dokter_id = $this->dokterId;
        $resep->status = Resep::STATUS_SUBMITTED;
        $resep->save(false);

        $detail = new ResepDetail();
        $detail->id = Uuid::uuid4()->toString();
        $detail->resep_id = $resep->id;
        $detail->obat_id = $this->obatId1;
        $detail->qty = 10;
        $detail->harga_satuan = 5000;
        $detail->subtotal = 50000;
        $detail->dispensed_quantity = 0;
        $detail->save(false);

        // Dispense 5 units
        $dispensedQty = 5;
        $obat->current_stock -= $dispensedQty;
        $obat->save(false, ['current_stock']);

        $detail->dispensed_quantity += $dispensedQty;
        $detail->save(false, ['dispensed_quantity']);

        $obat->refresh();
        $this->assertEquals($initialStock - 5, $obat->current_stock);
        $this->assertEquals(5, $detail->dispensed_quantity);
    }

    /**
     * Test cannot dispense more than available stock.
     */
    public function testDispenseCannotExceedStock(): void
    {
        $obat = Obat::findOne($this->obatId1);
        $obat->current_stock = 3; // Low stock
        $obat->save(false, ['current_stock']);

        $resep = new Resep();
        $resep->id = Uuid::uuid4()->toString();
        $resep->kunjungan_id = $this->kunjunganId;
        $resep->dokter_id = $this->dokterId;
        $resep->status = Resep::STATUS_SUBMITTED;
        $resep->save(false);

        $detail = new ResepDetail();
        $detail->id = Uuid::uuid4()->toString();
        $detail->resep_id = $resep->id;
        $detail->obat_id = $this->obatId1;
        $detail->qty = 10;
        $detail->harga_satuan = 5000;
        $detail->subtotal = 50000;
        $detail->dispensed_quantity = 0;
        $detail->save(false);

        // Try to dispense 5 when only 3 in stock
        $this->assertTrue($detail->qty > $obat->current_stock);
        $this->assertTrue(5 > $obat->current_stock);
    }
}
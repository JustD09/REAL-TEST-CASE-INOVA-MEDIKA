<?php

namespace common\models;

use Yii;
use yii\db\ActiveQuery;
use Ramsey\Uuid\Uuid;

class Billing extends ActiveRecord
{
    public const STATUS_OPEN = 'open';
    public const STATUS_UNPAID = 'unpaid';
    public const STATUS_PARTIAL = 'partial';
    public const STATUS_PAID = 'paid';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_REFUNDED = 'refunded';
    
    public static function tableName(): string
    {
        return '{{%billing}}';
    }
    
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            [['kunjungan_id', 'pasien_id', 'no_billing'], 'required'],
            [['kunjungan_id', 'pasien_id'], 'string', 'max' => 36],
            [['kunjungan_id'], 'unique', 'filter' => ['is_deleted' => false]],
            [['no_billing'], 'string', 'max' => 30],
            [['no_billing'], 'unique', 'filter' => ['is_deleted' => false]],
            [['status'], 'in', 'range' => [
                self::STATUS_OPEN, self::STATUS_UNPAID, self::STATUS_PARTIAL,
                self::STATUS_PAID, self::STATUS_CANCELLED, self::STATUS_REFUNDED,
            ]],
            [['registration_fee', 'tindakan_fee', 'laboratorium_fee', 'obat_fee',
              'subtotal', 'discount', 'tax', 'service_charge', 'total', 'paid_amount'],
             'number', 'min' => 0],
            [['discount_type'], 'in', 'range' => ['percent', 'nominal', '']],
            [['discount_reason'], 'string'],
            [['notes'], 'string'],
            [['due_date'], 'date', 'format' => 'php:Y-m-d'],
            [['paid_at'], 'safe'],
        ]);
    }
    
    public function attributeLabels(): array
    {
        return [
            'id' => 'ID',
            'kunjungan_id' => 'Kunjungan',
            'pasien_id' => 'Pasien',
            'no_billing' => 'No. Billing',
            'status' => 'Status',
            'registration_fee' => 'Biaya Daftar',
            'tindakan_fee' => 'Biaya Tindakan',
            'laboratorium_fee' => 'Biaya Lab',
            'obat_fee' => 'Biaya Obat',
            'subtotal' => 'Subtotal',
            'discount' => 'Diskon',
            'discount_type' => 'Tipe Diskon',
            'discount_reason' => 'Alasan Diskon',
            'tax' => 'Pajak',
            'service_charge' => 'Service Charge',
            'total' => 'Total',
            'paid_amount' => 'Terbayar',
            'due_date' => 'Jatuh Tempo',
            'paid_at' => 'Lunas Pada',
            'notes' => 'Catatan',
        ];
    }
    
    public function getKunjungan(): ActiveQuery
    {
        return $this->hasOne(Kunjungan::class, ['id' => 'kunjungan_id']);
    }
    
    public function getPasien(): ActiveQuery
    {
        return $this->hasOne(Pasien::class, ['id' => 'pasien_id']);
    }
    
    public function getDetails(): ActiveQuery
    {
        return $this->hasMany(BillingDetail::class, ['billing_id' => 'id']);
    }
    
    public function getPayments(): ActiveQuery
    {
        return $this->hasMany(Pembayaran::class, ['billing_id' => 'id']);
    }
    
    public function getStatusLabel(): string
    {
        $labels = [
            self::STATUS_OPEN => 'Terbuka',
            self::STATUS_UNPAID => 'Belum Bayar',
            self::STATUS_PARTIAL => 'Sebagian Bayar',
            self::STATUS_PAID => 'Lunas',
            self::STATUS_CANCELLED => 'Dibatalkan',
            self::STATUS_REFUNDED => 'Dikembalikan',
        ];
        return $labels[$this->status] ?? $this->status;
    }
    
    public function getOutstandingAmount(): float
    {
        return max(0, $this->total - $this->paid_amount);
    }
    
    public function generateNoBilling(): string
    {
        $date = date('Ymd');
        $last = static::find()
            ->select('no_billing')
            ->where(['like', 'no_billing', "BIL{$date}%"])
            ->orderBy(['no_billing' => SORT_DESC])
            ->limit(1)
            ->scalar();
        
        if ($last && str_starts_with($last, "BIL{$date}")) {
            $num = (int) substr($last, 7) + 1;
        } else {
            $num = 1;
        }
        
        return "BIL{$date}" . str_pad($num, 4, '0', STR_PAD_LEFT);
    }
    
    public function beforeValidate(): bool
    {
        if (parent::beforeValidate()) {
            if ($this->isNewRecord) {
                if (empty($this->no_billing)) {
                    $this->no_billing = $this->generateNoBilling();
                }
                if (empty($this->status)) {
                    $this->status = self::STATUS_OPEN;
                }
                if (empty($this->due_date)) {
                    $this->due_date = date('Y-m-d', strtotime('+7 days'));
                }
            }
            return true;
        }
        return false;
    }
    
    public function recalculate(): void
    {
        $this->registration_fee = 0;
        $this->tindakan_fee = 0;
        $this->laboratorium_fee = 0;
        $this->obat_fee = 0;
        
        foreach ($this->details as $detail) {
            switch ($detail->type) {
                case BillingDetail::TYPE_REGISTRATION:
                    $this->registration_fee += $detail->amount;
                    break;
                case BillingDetail::TYPE_TINDAKAN:
                    $this->tindakan_fee += $detail->amount;
                    break;
                case BillingDetail::TYPE_LABORATORIUM:
                    $this->laboratorium_fee += $detail->amount;
                    break;
                case BillingDetail::TYPE_OBAT:
                    $this->obat_fee += $detail->amount;
                    break;
            }
        }
        
        $this->subtotal = $this->registration_fee + $this->tindakan_fee + $this->laboratorium_fee + $this->obat_fee;
        
        // Hitung diskon
        $discountAmount = 0;
        if ($this->discount > 0) {
            if ($this->discount_type === 'percent') {
                $discountAmount = $this->subtotal * ($this->discount / 100);
            } else {
                $discountAmount = $this->discount;
            }
        }
        
        $taxableAmount = $this->subtotal - $discountAmount;
        $taxAmount = $taxableAmount * (Yii::$app->params['billing.taxPercent'] / 100);
        $serviceAmount = $taxableAmount * (Yii::$app->params['billing.serviceChargePercent'] / 100);
        
        $this->tax = $taxAmount;
        $this->service_charge = $serviceAmount;
        
        $rawTotal = $taxableAmount + $taxAmount + $serviceAmount;
        
        // Pembulatan
        $rounding = Yii::$app->params['billing.rounding'];
        if ($rounding > 0) {
            $this->total = ceil($rawTotal / $rounding) * $rounding;
        } else {
            $this->total = $rawTotal;
        }
    }
    
    public function applyPayment(float $amount, string $method, string $reference): bool
    {
        $transaction = Yii::$app->db->beginTransaction();
        try {
            $this->refresh();
            
            if ($this->paid_amount + $amount > $this->total + 0.01) {
                throw new \Exception('Jumlah pembayaran melebihi total tagihan');
            }
            
            $pembayaran = new Pembayaran();
            $pembayaran->id = Uuid::uuid4()->toString();
            $pembayaran->billing_id = $this->id;
            $pembayaran->no_bukti = $pembayaran->generateNoBukti();
            $pembayaran->amount = $amount;
            $pembayaran->method = $method;
            $pembayaran->reference = $reference;
            $pembayaran->status = Pembayaran::STATUS_SUCCESS;
            $pembayaran->paid_at = date('Y-m-d H:i:s');
            $pembayaran->save(false);
            
            $this->paid_amount += $amount;
            
            if ($this->paid_amount >= $this->total - 0.01) {
                $this->status = self::STATUS_PAID;
                $this->paid_at = date('Y-m-d H:i:s');
            } elseif ($this->paid_amount > 0) {
                $this->status = self::STATUS_PARTIAL;
            }
            
            $this->save(false, ['paid_amount', 'status', 'paid_at']);
            
            // Catat audit
            Yii::$app->auditLogger->logPayment($this->id, $amount, $method, 'success');
            
            $transaction->commit();
            return true;
        } catch (\Throwable $e) {
            $transaction->rollBack();
            throw $e;
        }
    }
    
    public static function createFromKunjungan(Kunjungan $kunjungan): ?self
    {
        $transaction = Yii::$app->db->beginTransaction();
        try {
            $billing = new self();
            $billing->id = Uuid::uuid4()->toString();
            $billing->kunjungan_id = $kunjungan->id;
            $billing->pasien_id = $kunjungan->pasien_id;
            $billing->no_billing = $billing->generateNoBilling();
            $billing->status = self::STATUS_OPEN;
            $billing->due_date = date('Y-m-d', strtotime('+7 days'));
            $billing->save(false);
            
            // Tambahkan biaya pendaftaran
            if ($kunjungan->registration_fee > 0) {
                $detail = new BillingDetail();
                $detail->id = Uuid::uuid4()->toString();
                $detail->billing_id = $billing->id;
                $detail->type = BillingDetail::TYPE_REGISTRATION;
                $detail->reference_id = $kunjungan->id;
                $detail->description = "Biaya pendaftaran {$kunjungan->poli->nama}";
                $detail->quantity = 1;
                $detail->unit_price = $kunjungan->registration_fee;
                $detail->amount = $kunjungan->registration_fee;
                $detail->save(false);
            }
            
            // Tambahkan tindakan
            foreach ($kunjungan->tindakanMedis as $tindakan) {
                if ($tindakan->status === TindakanMedis::STATUS_COMPLETED) {
                    $detail = new BillingDetail();
                    $detail->id = Uuid::uuid4()->toString();
                    $detail->billing_id = $billing->id;
                    $detail->type = BillingDetail::TYPE_TINDAKAN;
                    $detail->reference_id = $tindakan->id;
                    $detail->description = $tindakan->tindakan->nama;
                    $detail->quantity = $tindakan->quantity;
                    $detail->unit_price = $tindakan->total_tarif / $tindakan->quantity;
                    $detail->amount = $tindakan->total_tarif;
                    $detail->save(false);
                }
            }
            
            // Tambahkan laboratorium
            foreach ($kunjungan->laboratorium as $lab) {
                if (in_array($lab->status, [Laboratorium::STATUS_COMPLETED, Laboratorium::STATUS_VERIFIED])) {
                    $detail = new BillingDetail();
                    $detail->id = Uuid::uuid4()->toString();
                    $detail->billing_id = $billing->id;
                    $detail->type = BillingDetail::TYPE_LABORATORIUM;
                    $detail->reference_id = $lab->id;
                    $detail->description = $lab->jenisPemeriksaan->nama;
                    $detail->quantity = 1;
                    $detail->unit_price = $lab->tarif;
                    $detail->amount = $lab->tarif;
                    $detail->save(false);
                }
            }
            
            // Tambahkan obat
            foreach ($kunjungan->resep as $resep) {
                if ($resep->status === Resep::STATUS_DISPENSED || $resep->status === Resep::STATUS_PARTIAL) {
                    foreach ($resep->details as $detail) {
                        if ($detail->dispensed_quantity > 0) {
                            $billDetail = new BillingDetail();
                            $billDetail->id = Uuid::uuid4()->toString();
                            $billDetail->billing_id = $billing->id;
                            $billDetail->type = BillingDetail::TYPE_OBAT;
                            $billDetail->reference_id = $detail->id;
                            $billDetail->description = $detail->obat->nama;
                            $billDetail->quantity = $detail->dispensed_quantity;
                            $billDetail->unit_price = $detail->harga_satuan;
                            $billDetail->amount = $detail->harga_satuan * $detail->dispensed_quantity;
                            $billDetail->save(false);
                        }
                    }
                }
            }
            
            $billing->recalculate();
            $billing->save(false);
            
            $transaction->commit();
            return $billing;
        } catch (\Throwable $e) {
            $transaction->rollBack();
            throw $e;
        }
    }
}
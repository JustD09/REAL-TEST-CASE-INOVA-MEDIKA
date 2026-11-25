<?php

namespace common\models;

use Yii;
use yii\db\ActiveQuery;
use Ramsey\Uuid\Uuid;

class Pembayaran extends ActiveRecord
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_SUCCESS = 'success';
    public const STATUS_FAILED = 'failed';
    public const STATUS_REFUNDED = 'refunded';
    public const STATUS_CANCELLED = 'cancelled';
    
    public const METHOD_CASH = 'cash';
    public const METHOD_DEBIT = 'debit';
    public const METHOD_CREDIT = 'credit';
    public const METHOD_TRANSFER = 'transfer';
    public const METHOD_EWALLET = 'ewallet';
    public const METHOD_BPJS = 'bpjs';
    public const METHOD_INSURANCE = 'insurance';
    public const METHOD_OTHER = 'other';
    
    public static function tableName(): string
    {
        return '{{%pembayaran}}';
    }
    
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            [['billing_id', 'no_bukti', 'amount', 'method'], 'required'],
            [['billing_id'], 'string', 'max' => 36],
            [['no_bukti'], 'string', 'max' => 30],
            [['no_bukti'], 'unique', 'filter' => ['is_deleted' => false]],
            [['amount'], 'number', 'min' => 0.01],
            [['method'], 'in', 'range' => [
                self::METHOD_CASH, self::METHOD_DEBIT, self::METHOD_CREDIT,
                self::METHOD_TRANSFER, self::METHOD_EWALLET, self::METHOD_BPJS,
                self::METHOD_INSURANCE, self::METHOD_OTHER,
            ]],
            [['status'], 'in', 'range' => [
                self::STATUS_PENDING, self::STATUS_SUCCESS, self::STATUS_FAILED,
                self::STATUS_REFUNDED, self::STATUS_CANCELLED,
            ]],
            [['reference'], 'string', 'max' => 100],
            [['reference'], 'unique', 'filter' => ['is_deleted' => false]],
            [['notes'], 'string'],
            [['paid_at', 'verified_at'], 'safe'],
        ]);
    }
    
    public function attributeLabels(): array
    {
        return [
            'id' => 'ID',
            'billing_id' => 'Billing',
            'no_bukti' => 'No. Bukti',
            'amount' => 'Jumlah',
            'method' => 'Metode',
            'status' => 'Status',
            'reference' => 'Referensi',
            'notes' => 'Catatan',
            'paid_at' => 'Waktu Bayar',
            'verified_at' => 'Diverifikasi',
        ];
    }
    
    public function getBilling(): ActiveQuery
    {
        return $this->hasOne(Billing::class, ['id' => 'billing_id']);
    }
    
    public function getStatusLabel(): string
    {
        $labels = [
            self::STATUS_PENDING => 'Menunggu',
            self::STATUS_SUCCESS => 'Berhasil',
            self::STATUS_FAILED => 'Gagal',
            self::STATUS_REFUNDED => 'Dikembalikan',
            self::STATUS_CANCELLED => 'Dibatalkan',
        ];
        return $labels[$this->status] ?? $this->status;
    }
    
    public function getMethodLabel(): string
    {
        $labels = [
            self::METHOD_CASH => 'Tunai',
            self::METHOD_DEBIT => 'Debit',
            self::METHOD_CREDIT => 'Kredit',
            self::METHOD_TRANSFER => 'Transfer',
            self::METHOD_EWALLET => 'E-Wallet',
            self::METHOD_BPJS => 'BPJS',
            self::METHOD_INSURANCE => 'Asuransi',
            self::METHOD_OTHER => 'Lainnya',
        ];
        return $labels[$this->method] ?? $this->method;
    }
    
    public function generateNoBukti(): string
    {
        $date = date('Ymd');
        $last = static::find()
            ->select('no_bukti')
            ->where(['like', 'no_bukti', "BKT{$date}%"])
            ->orderBy(['no_bukti' => SORT_DESC])
            ->limit(1)
            ->scalar();
        
        if ($last && str_starts_with($last, "BKT{$date}")) {
            $num = (int) substr($last, 7) + 1;
        } else {
            $num = 1;
        }
        
        return "BKT{$date}" . str_pad($num, 4, '0', STR_PAD_LEFT);
    }
    
    public function beforeValidate(): bool
    {
        if (parent::beforeValidate()) {
            if ($this->isNewRecord) {
                if (empty($this->no_bukti)) {
                    $this->no_bukti = $this->generateNoBukti();
                }
                if (empty($this->status)) {
                    $this->status = self::STATUS_PENDING;
                }
                if (empty($this->reference)) {
                    $this->reference = $this->generateReference();
                }
            }
            return true;
        }
        return false;
    }
    
    public function generateReference(): string
    {
        return 'PAY_' . bin2hex(random_bytes(8));
    }
    
    public function process(string $idempotencyKey = null): bool
    {
        if ($this->status !== self::STATUS_PENDING) return false;
        
        $handler = new \common\components\IdempotencyHandler();
        $key = $idempotencyKey ?? $this->reference;
        
        return $handler->process($key, function($transaction) {
            $this->status = self::STATUS_SUCCESS;
            $this->paid_at = date('Y-m-d H:i:s');
            $this->save(false, ['status', 'paid_at']);
            
            // Update billing
            $this->billing->applyPayment($this->amount, $this->method, $this->reference);
            
            return true;
        })[0];
    }
    
    public function refund(string $reason): bool
    {
        if ($this->status !== self::STATUS_SUCCESS) return false;
        
        $transaction = Yii::$app->db->beginTransaction();
        try {
            $this->status = self::STATUS_REFUNDED;
            $this->notes = ($this->notes ? $this->notes . "\n" : '') . "Refund: $reason";
            $this->save(false, ['status', 'notes']);
            
            // Reverse billing payment
            $this->billing->paid_amount -= $this->amount;
            if ($this->billing->paid_amount <= 0) {
                $this->billing->status = Billing::STATUS_UNPAID;
                $this->billing->paid_at = null;
            } elseif ($this->billing->paid_amount < $this->billing->total) {
                $this->billing->status = Billing::STATUS_PARTIAL;
            }
            $this->billing->save(false, ['paid_amount', 'status', 'paid_at']);
            
            $transaction->commit();
            return true;
        } catch (\Throwable $e) {
            $transaction->rollBack();
            throw $e;
        }
    }
}
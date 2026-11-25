<?php

namespace common\models;

use Yii;
use yii\db\ActiveQuery;
use Ramsey\Uuid\Uuid;

class Resep extends ActiveRecord
{
    public const STATUS_DRAFT = 'draft';
    public const STATUS_PRESCRIBED = 'prescribed';
    public const STATUS_DISPENSING = 'dispensing';
    public const STATUS_DISPENSED = 'dispensed';
    public const STATUS_PARTIAL = 'partial';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_RETURNED = 'returned';
    
    public const TYPE_RACIKAN = 'racikan';
    public const TYPE_TIDAK_RACIKAN = 'tidak_racikan';
    
    public static function tableName(): string
    {
        return '{{%resep}}';
    }
    
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            [['kunjungan_id', 'dokter_id', 'type'], 'required'],
            [['kunjungan_id', 'dokter_id', 'farmasi_id'], 'string', 'max' => 36],
            [['no_resep'], 'string', 'max' => 30],
            [['no_resep'], 'unique', 'filter' => ['is_deleted' => false]],
            [['type'], 'in', 'range' => [self::TYPE_RACIKAN, self::TYPE_TIDAK_RACIKAN]],
            [['status'], 'in', 'range' => [
                self::STATUS_DRAFT, self::STATUS_PRESCRIBED, self::STATUS_DISPENSING,
                self::STATUS_DISPENSED, self::STATUS_PARTIAL, self::STATUS_CANCELLED, self::STATUS_RETURNED,
            ]],
            [['diagnosa_id'], 'string', 'max' => 20],
            [['catatan'], 'string'],
            [['total_harga'], 'number', 'min' => 0],
            [['prescribed_at', 'dispensed_at'], 'safe'],
        ]);
    }
    
    public function attributeLabels(): array
    {
        return [
            'id' => 'ID',
            'kunjungan_id' => 'Kunjungan',
            'dokter_id' => 'Dokter',
            'farmasi_id' => 'Petugas Farmasi',
            'no_resep' => 'No. Resep',
            'type' => 'Tipe Resep',
            'status' => 'Status',
            'diagnosa_id' => 'Diagnosa (ICD-10)',
            'catatan' => 'Catatan',
            'total_harga' => 'Total Harga',
            'prescribed_at' => 'Diresepkan',
            'dispensed_at' => 'Diserahkan',
        ];
    }
    
    public function getKunjungan(): ActiveQuery
    {
        return $this->hasOne(Kunjungan::class, ['id' => 'kunjungan_id']);
    }
    
    public function getDokter(): ActiveQuery
    {
        return $this->hasOne(Dokter::class, ['id' => 'dokter_id']);
    }
    
    public function getFarmasi(): ActiveQuery
    {
        return $this->hasOne(User::class, ['id' => 'farmasi_id']);
    }
    
    public function getDetails(): ActiveQuery
    {
        return $this->hasMany(ResepDetail::class, ['resep_id' => 'id']);
    }
    
    public function getStatusLabel(): string
    {
        $labels = [
            self::STATUS_DRAFT => 'Draft',
            self::STATUS_PRESCRIBED => 'Diresepkan',
            self::STATUS_DISPENSING => 'Sedang Disiapkan',
            self::STATUS_DISPENSED => 'Sudah Diserahkan',
            self::STATUS_PARTIAL => 'Sebagian Diserahkan',
            self::STATUS_CANCELLED => 'Dibatalkan',
            self::STATUS_RETURNED => 'Dikembalikan',
        ];
        return $labels[$this->status] ?? $this->status;
    }
    
    public function getTypeLabel(): string
    {
        return $this->type === self::TYPE_RACIKAN ? 'Racikan' : 'Tidak Racikan';
    }
    
    public function generateNoResep(): string
    {
        $date = date('Ymd');
        $last = static::find()
            ->select('no_resep')
            ->where(['like', 'no_resep', "RSP{$date}%"])
            ->orderBy(['no_resep' => SORT_DESC])
            ->limit(1)
            ->scalar();
        
        if ($last && str_starts_with($last, "RSP{$date}")) {
            $num = (int) substr($last, 11) + 1;
        } else {
            $num = 1;
        }
        
        return "RSP{$date}" . str_pad($num, 4, '0', STR_PAD_LEFT);
    }
    
    public function beforeValidate(): bool
    {
        if (parent::beforeValidate()) {
            if ($this->isNewRecord) {
                if (empty($this->no_resep)) {
                    $this->no_resep = $this->generateNoResep();
                }
                if (empty($this->status)) {
                    $this->status = self::STATUS_DRAFT;
                }
            }
            return true;
        }
        return false;
    }
    
    public function prescribe(): bool
    {
        if ($this->status !== self::STATUS_DRAFT) return false;
        $this->status = self::STATUS_PRESCRIBED;
        $this->prescribed_at = date('Y-m-d H:i:s');
        return $this->save(false, ['status', 'prescribed_at']);
    }
    
    public function startDispensing(string $farmasiId): bool
    {
        if ($this->status !== self::STATUS_PRESCRIBED) return false;
        $this->status = self::STATUS_DISPENSING;
        $this->farmasi_id = $farmasiId;
        return $this->save(false, ['status', 'farmasi_id']);
    }
    
    public function completeDispensing(): bool
    {
        if (!in_array($this->status, [self::STATUS_DISPENSING, self::STATUS_PARTIAL])) return false;
        
        $allDispensed = true;
        foreach ($this->details as $detail) {
            if ($detail->quantity > $detail->dispensed_quantity) {
                $allDispensed = false;
                break;
            }
        }
        
        $this->status = $allDispensed ? self::STATUS_DISPENSED : self::STATUS_PARTIAL;
        $this->dispensed_at = date('Y-m-d H:i:s');
        return $this->save(false, ['status', 'dispensed_at']);
    }
    
    public function cancel(): bool
    {
        if (!in_array($this->status, [self::STATUS_DRAFT, self::STATUS_PRESCRIBED, self::STATUS_DISPENSING])) return false;
        
        // Kembalikan stok jika penyerahan sebagian
        $transaction = Yii::$app->db->beginTransaction();
        try {
            foreach ($this->details as $detail) {
                if ($detail->dispensed_quantity > 0) {
                    $detail->obat->addStock(
                        $detail->dispensed_quantity,
                        $this->id,
                        ObatStockLog::REF_RESEP,
                        "Retur resep dibatalkan: {$this->no_resep}"
                    );
                    $detail->dispensed_quantity = 0;
                    $detail->save(false, ['dispensed_quantity']);
                }
            }
            
            $this->status = self::STATUS_CANCELLED;
            $this->save(false, ['status']);
            
            $transaction->commit();
            return true;
        } catch (\Throwable $e) {
            $transaction->rollBack();
            throw $e;
        }
    }
    
    public function calculateTotal(): float
    {
        $total = 0;
        foreach ($this->details as $detail) {
            $total += $detail->subtotal;
        }
        $this->total_harga = $total;
        return $total;
    }
}
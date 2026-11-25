<?php

namespace common\models;

use Yii;
use yii\db\ActiveQuery;

class Obat extends ActiveRecord
{
    public const TYPE_GENERIK = 'generik';
    public const TYPE_PATEN = 'paten';
    public const TYPE_HERBAL = 'herbal';
    public const TYPE_ALKES = 'alkes';
    public const TYPE_BHP = 'bhp';
    
    public const UNIT_TABLET = 'tablet';
    public const UNIT_KAPSUL = 'kapsul';
    public const UNIT_BOTOL = 'botol';
    public const UNIT_AMPUL = 'ampul';
    public const UNIT_VIAL = 'vial';
    public const UNIT_TUBE = 'tube';
    public const UNIT_SACHET = 'sachet';
    public const UNIT_STRIP = 'strip';
    public const UNIT_BOX = 'box';
    public const UNIT_LAINNYA = 'lainnya';
    
    public static function tableName(): string
    {
        return '{{%obat}}';
    }
    
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            [['kode', 'nama', 'unit'], 'required'],
            [['kode'], 'string', 'max' => 30],
            [['kode'], 'unique', 'filter' => ['is_deleted' => false]],
            [['nama'], 'string', 'max' => 150],
            [['generic_name'], 'string', 'max' => 150],
            [['type'], 'in', 'range' => [
                self::TYPE_GENERIK,
                self::TYPE_PATEN,
                self::TYPE_HERBAL,
                self::TYPE_ALKES,
                self::TYPE_BHP,
            ]],
            [['category_id'], 'string', 'max' => 36],
            [['unit'], 'string', 'max' => 20],
            [['unit'], 'in', 'range' => [
                self::UNIT_TABLET, self::UNIT_KAPSUL, self::UNIT_BOTOL,
                self::UNIT_AMPUL, self::UNIT_VIAL, self::UNIT_TUBE,
                self::UNIT_SACHET, self::UNIT_STRIP, self::UNIT_BOX,
                self::UNIT_LAINNYA,
            ]],
            [['strength'], 'string', 'max' => 50],
            [['manufacturer'], 'string', 'max' => 150],
            [['registration_number'], 'string', 'max' => 50],
            [['purchase_price', 'selling_price', 'bpjs_price'], 'number', 'min' => 0],
            [['min_stock', 'max_stock'], 'integer', 'min' => 0],
            [['current_stock'], 'integer', 'min' => 0, 'default' => 0],
            [['expired_date'], 'date', 'format' => 'php:Y-m-d'],
            [['batch_number'], 'string', 'max' => 50],
            [['location'], 'string', 'max' => 100],
            [['is_active'], 'boolean'],
            [['is_controlled'], 'boolean'],
            [['notes'], 'string'],
        ]);
    }
    
    public function attributeLabels(): array
    {
        return [
            'id' => 'ID',
            'kode' => 'Kode',
            'nama' => 'Nama Obat',
            'generic_name' => 'Nama Generik',
            'type' => 'Tipe',
            'category_id' => 'Kategori',
            'unit' => 'Satuan',
            'strength' => 'Kekuatan',
            'manufacturer' => 'Pabrik',
            'registration_number' => 'No. Registrasi',
            'purchase_price' => 'Harga Beli',
            'selling_price' => 'Harga Jual',
            'bpjs_price' => 'Harga BPJS',
            'min_stock' => 'Stok Minimum',
            'max_stock' => 'Stok Maksimum',
            'current_stock' => 'Stok Saat Ini',
            'expired_date' => 'Tanggal Kadaluarsa',
            'batch_number' => 'No. Batch',
            'location' => 'Lokasi Rak',
            'is_active' => 'Aktif',
            'is_controlled' => 'Narkotika/Psikotropika',
            'notes' => 'Catatan',
        ];
    }
    
    public function getCategory(): ActiveQuery
    {
        return $this->hasOne(ObatCategory::class, ['id' => 'category_id']);
    }
    
    public function getStockLogs(): ActiveQuery
    {
        return $this->hasMany(ObatStockLog::class, ['obat_id' => 'id']);
    }
    
    public function getResepDetail(): ActiveQuery
    {
        return $this->hasMany(ResepDetail::class, ['obat_id' => 'id']);
    }
    
    public function getTypeLabel(): string
    {
        $labels = [
            self::TYPE_GENERIK => 'Generik',
            self::TYPE_PATEN => 'Paten',
            self::TYPE_HERBAL => 'Herbal',
            self::TYPE_ALKES => 'Alkes',
            self::TYPE_BHP => 'BHP',
        ];
        return $labels[$this->type] ?? $this->type;
    }
    
    public function isLowStock(): bool
    {
        return $this->current_stock <= $this->min_stock;
    }
    
    public function isExpired(): bool
    {
        if (!$this->expired_date) return false;
        return date('Y-m-d') >= $this->expired_date;
    }
    
    public function isNearExpiry(int $days = 90): bool
    {
        if (!$this->expired_date) return false;
        $expiry = strtotime($this->expired_date);
        $threshold = strtotime("+{$days} days");
        return $expiry <= $threshold;
    }
    
    public function getAvailableStock(): int
    {
        // Could be enhanced with reserved stock logic
        return $this->current_stock;
    }
    
    /**
     * Atomically deduct stock using SELECT FOR UPDATE
     * Returns true on success, false if insufficient stock
     * Supports idempotent dispensing with unique dispensing reference
     */
    public function deductStock(int $quantity, string $referenceId, string $referenceType, string $reason, ?string $dispenseId = null): bool
    {
        $transaction = Yii::$app->db->beginTransaction();
        try {
            // Check for idempotent dispensing
            if ($dispenseId) {
                $existingLog = ObatStockLog::find()
                    ->where(['reference_id' => $dispenseId, 'reference_type' => 'dispense'])
                    ->one();
                
                if ($existingLog && $existingLog->obat_id === $this->id) {
                    // Already dispensed, return success without double deduction
                    $transaction->rollBack();
                    return true;
                }
            }
            
            // Lock the row
            $obat = static::findOneForUpdate(['id' => $this->id]);
            
            if (!$obat) {
                $transaction->rollBack();
                throw new \Exception('Obat tidak ditemukan');
            }
            
            if ($obat->current_stock < $quantity) {
                $transaction->rollBack();
                throw new \Exception("Stok tidak mencukupi. Tersedia: {$obat->current_stock}, Dibutuhkan: {$quantity}");
            }
            
            $oldStock = $obat->current_stock;
            $obat->current_stock -= $quantity;
            $obat->save(false, ['current_stock']);
            
            // Log stock change with dispense ID for idempotency
            ObatStockLog::createLog(
                $this->id,
                $oldStock,
                $obat->current_stock,
                -$quantity,
                $dispenseId ?? $referenceId,
                $dispenseId ? 'dispense' : $referenceType,
                $reason
            );
            
            $transaction->commit();
            return true;
        } catch (\Throwable $e) {
            $transaction->rollBack();
            throw $e;
        }
    }
    
    /**
     * Atomically add stock
     */
    public function addStock(int $quantity, string $referenceId, string $referenceType, string $reason): bool
    {
        $transaction = Yii::$app->db->beginTransaction();
        try {
            $obat = static::findOneForUpdate(['id' => $this->id]);
            
            if (!$obat) {
                $transaction->rollBack();
                return false;
            }
            
            $oldStock = $obat->current_stock;
            $obat->current_stock += $quantity;
            $obat->save(false, ['current_stock']);
            
            ObatStockLog::createLog(
                $this->id,
                $oldStock,
                $obat->current_stock,
                $quantity,
                $referenceId,
                $referenceType,
                $reason
            );
            
            $transaction->commit();
            return true;
        } catch (\Throwable $e) {
            $transaction->rollBack();
            throw $e;
        }
    }
}
<?php

namespace common\models;

use Yii;
use yii\db\ActiveQuery;
use Ramsey\Uuid\Uuid;

class ObatStockLog extends ActiveRecord
{
    public function behaviors(): array
    {
        return [];
    }

    public const TYPE_IN = 'in';
    public const TYPE_OUT = 'out';
    public const TYPE_ADJUSTMENT = 'adjustment';
    public const TYPE_OPNAME = 'opname';
    public const TYPE_RETURN = 'return';
    public const TYPE_EXPIRED = 'expired';
    public const TYPE_DAMAGED = 'damaged';
    
    public const REF_RESEP = 'resep';
    public const REF_PEMBELIAN = 'pembelian';
    public const REF_RETUR = 'retur';
    public const REF_OPNAME = 'opname';
    public const REF_PENAYESAAN = 'penyesuaian';
    public const REF_KADALUARSA = 'kadaluarsa';
    public const REF_RUSAK = 'rusak';
    
    public static function tableName(): string
    {
        return '{{%obat_stock_log}}';
    }
    
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            [['obat_id', 'type', 'quantity', 'reference_type'], 'required'],
            [['obat_id'], 'string', 'max' => 36],
            [['type'], 'in', 'range' => [
                self::TYPE_IN, self::TYPE_OUT, self::TYPE_ADJUSTMENT,
                self::TYPE_OPNAME, self::TYPE_RETURN, self::TYPE_EXPIRED, self::TYPE_DAMAGED,
            ]],
            [['quantity'], 'integer'],
            [['old_stock', 'new_stock'], 'integer', 'min' => 0],
            [['reference_id'], 'string', 'max' => 36],
            [['reference_type'], 'string', 'max' => 30],
            [['reference_type'], 'in', 'range' => [
                self::REF_RESEP, self::REF_PEMBELIAN, self::REF_RETUR,
                self::REF_OPNAME, self::REF_PENAYESAAN, self::REF_KADALUARSA, self::REF_RUSAK,
            ]],
            [['reason'], 'string'],
            [['user_id'], 'string', 'max' => 36],
            // Log tables don't use soft delete - remove is_deleted from parent rules
            [['is_deleted', 'deleted_at'], 'safe'],
        ]);
    }
    
    public function attributeLabels(): array
    {
        return [
            'id' => 'ID',
            'obat_id' => 'Obat',
            'type' => 'Tipe',
            'quantity' => 'Jumlah',
            'old_stock' => 'Stok Sebelum',
            'new_stock' => 'Stok Sesudah',
            'reference_id' => 'Referensi ID',
            'reference_type' => 'Tipe Referensi',
            'reason' => 'Alasan',
            'user_id' => 'User',
            'created_at' => 'Waktu',
        ];
    }
    
    public function getObat(): ActiveQuery
    {
        return $this->hasOne(Obat::class, ['id' => 'obat_id']);
    }
    
    public function getUser(): ActiveQuery
    {
        return $this->hasOne(User::class, ['id' => 'user_id']);
    }
    
    public static function createLog(
        string $obatId,
        int $oldStock,
        int $newStock,
        int $quantity,
        string $referenceId,
        string $referenceType,
        string $reason,
        ?string $type = null
    ): self {
        $log = new self();
        $log->id = Uuid::uuid4()->toString();
        $log->obat_id = $obatId;
        $log->type = $type ?? ($quantity >= 0 ? self::TYPE_IN : self::TYPE_OUT);
        $log->quantity = $quantity;
        $log->old_stock = $oldStock;
        $log->new_stock = $newStock;
        $log->reference_id = $referenceId;
        $log->reference_type = $referenceType;
        $log->reason = $reason;
        $log->user_id = Yii::$app->user->id ?? null;
        $log->save(false);
        return $log;
    }
    
    public function getTypeLabel(): string
    {
        $labels = [
            self::TYPE_IN => 'Masuk',
            self::TYPE_OUT => 'Keluar',
            self::TYPE_ADJUSTMENT => 'Penyesuaian',
            self::TYPE_OPNAME => 'Opname',
            self::TYPE_RETURN => 'Retur',
            self::TYPE_EXPIRED => 'Kadaluarsa',
            self::TYPE_DAMAGED => 'Rusak',
        ];
        return $labels[$this->type] ?? $this->type;
    }
}
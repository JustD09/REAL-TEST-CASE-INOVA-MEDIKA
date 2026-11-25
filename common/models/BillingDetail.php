<?php

namespace common\models;

use Yii;
use yii\db\ActiveQuery;
use Ramsey\Uuid\Uuid;

class BillingDetail extends ActiveRecord
{
    public const TYPE_REGISTRATION = 'registration';
    public const TYPE_TINDAKAN = 'tindakan';
    public const TYPE_LABORATORIUM = 'laboratorium';
    public const TYPE_OBAT = 'obat';
    public const TYPE_LAINNYA = 'lainnya';
    
    public static function tableName(): string
    {
        return '{{%billing_detail}}';
    }
    
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            [['billing_id', 'type', 'reference_id', 'description', 'quantity', 'unit_price', 'amount'], 'required'],
            [['billing_id', 'reference_id'], 'string', 'max' => 36],
            [['type'], 'in', 'range' => [
                self::TYPE_REGISTRATION, self::TYPE_TINDAKAN, self::TYPE_LABORATORIUM,
                self::TYPE_OBAT, self::TYPE_LAINNYA,
            ]],
            [['description'], 'string', 'max' => 255],
            [['quantity'], 'integer', 'min' => 1],
            [['unit_price', 'amount', 'discount'], 'number', 'min' => 0],
            [['notes'], 'string'],
        ]);
    }
    
    public function attributeLabels(): array
    {
        return [
            'id' => 'ID',
            'billing_id' => 'Billing',
            'type' => 'Tipe',
            'reference_id' => 'Referensi ID',
            'description' => 'Deskripsi',
            'quantity' => 'Jumlah',
            'unit_price' => 'Harga Satuan',
            'amount' => 'Jumlah',
            'discount' => 'Diskon',
            'notes' => 'Catatan',
        ];
    }
    
    public function getBilling(): ActiveQuery
    {
        return $this->hasOne(Billing::class, ['id' => 'billing_id']);
    }
    
    public function getTypeLabel(): string
    {
        $labels = [
            self::TYPE_REGISTRATION => 'Pendaftaran',
            self::TYPE_TINDAKAN => 'Tindakan',
            self::TYPE_LABORATORIUM => 'Laboratorium',
            self::TYPE_OBAT => 'Obat',
            self::TYPE_LAINNYA => 'Lainnya',
        ];
        return $labels[$this->type] ?? $this->type;
    }
}
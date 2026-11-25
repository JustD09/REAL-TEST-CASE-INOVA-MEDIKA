<?php

namespace common\models;

use Yii;
use yii\db\ActiveQuery;
use Ramsey\Uuid\Uuid;

class ResepDetail extends ActiveRecord
{
    public const FREQ_1X1 = '1x1';
    public const FREQ_2X1 = '2x1';
    public const FREQ_3X1 = '3x1';
    public const FREQ_1X2 = '1x2';
    public const FREQ_2X2 = '2x2';
    public const FREQ_3X2 = '3x2';
    public const FREQ_1X3 = '1x3';
    public const FREQ_2X3 = '2x3';
    public const FREQ_3X3 = '3x3';
    public const FREQ_PRN = 'prn';
    public const FREQ_CUSTOM = 'custom';
    
    public const ROUTE_ORAL = 'oral';
    public const ROUTE_SUBLINGUAL = 'sublingual';
    public const ROUTE_TOPICAL = 'topical';
    public const ROUTE_INHALASI = 'inhalasi';
    public const ROUTE_INJEKSI = 'injeksi';
    public const ROUTE_REKTAL = 'rektal';
    public const ROUTE_OKULER = 'okuler';
    public const ROUTE_OTIK = 'otik';
    
    public static function tableName(): string
    {
        return '{{%resep_detail}}';
    }
    
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            [['resep_id', 'obat_id', 'quantity', 'frequency', 'route'], 'required'],
            [['resep_id', 'obat_id'], 'string', 'max' => 36],
            [['quantity'], 'integer', 'min' => 1],
            [['dose'], 'string', 'max' => 50],
            [['frequency'], 'string', 'max' => 20],
            [['frequency'], 'in', 'range' => [
                self::FREQ_1X1, self::FREQ_2X1, self::FREQ_3X1,
                self::FREQ_1X2, self::FREQ_2X2, self::FREQ_3X2,
                self::FREQ_1X3, self::FREQ_2X3, self::FREQ_3X3,
                self::FREQ_PRN, self::FREQ_CUSTOM,
            ]],
            [['custom_frequency'], 'string', 'max' => 100],
            [['duration_days'], 'integer', 'min' => 1],
            [['route'], 'string', 'max' => 20],
            [['route'], 'in', 'range' => [
                self::ROUTE_ORAL, self::ROUTE_SUBLINGUAL, self::ROUTE_TOPICAL,
                self::ROUTE_INHALASI, self::ROUTE_INJEKSI, self::ROUTE_REKTAL,
                self::ROUTE_OKULER, self::ROUTE_OTIK,
            ]],
            [['instructions'], 'string'],
            [['harga_satuan'], 'number', 'min' => 0],
            [['dispensed_quantity'], 'integer', 'min' => 0, 'default' => 0],
            [['is_dispensed'], 'boolean'],
            [['racikan_group'], 'integer', 'min' => 0],
            [['sequence'], 'integer', 'default' => 0],
        ]);
    }
    
    public function attributeLabels(): array
    {
        return [
            'id' => 'ID',
            'resep_id' => 'Resep',
            'obat_id' => 'Obat',
            'quantity' => 'Jumlah',
            'dose' => 'Dosis',
            'frequency' => 'Frekuensi',
            'custom_frequency' => 'Frekuensi Custom',
            'duration_days' => 'Durasi (Hari)',
            'route' => 'Rute',
            'instructions' => 'Petunjuk',
            'harga_satuan' => 'Harga Satuan',
            'dispensed_quantity' => 'Sudah Diserahkan',
            'is_dispensed' => 'Sudah Diserahkan',
            'racikan_group' => 'Grup Racikan',
            'sequence' => 'Urutan',
        ];
    }
    
    public function getResep(): ActiveQuery
    {
        return $this->hasOne(Resep::class, ['id' => 'resep_id']);
    }
    
    public function getObat(): ActiveQuery
    {
        return $this->hasOne(Obat::class, ['id' => 'obat_id']);
    }
    
    public function getSubtotal(): float
    {
        return $this->harga_satuan * $this->quantity;
    }
    
    public function getRemainingQuantity(): int
    {
        return $this->quantity - $this->dispensed_quantity;
    }
    
    public function getFrequencyLabel(): string
    {
        $labels = [
            self::FREQ_1X1 => '1x1',
            self::FREQ_2X1 => '2x1',
            self::FREQ_3X1 => '3x1',
            self::FREQ_1X2 => '1x2',
            self::FREQ_2X2 => '2x2',
            self::FREQ_3X2 => '3x2',
            self::FREQ_1X3 => '1x3',
            self::FREQ_2X3 => '2x3',
            self::FREQ_3X3 => '3x3',
            self::FREQ_PRN => 'Sewaktu-waktu (PRN)',
            self::FREQ_CUSTOM => 'Custom',
        ];
        return $labels[$this->frequency] ?? $this->frequency;
    }
    
    public function getRouteLabel(): string
    {
        $labels = [
            self::ROUTE_ORAL => 'Oral',
            self::ROUTE_SUBLINGUAL => 'Sublingual',
            self::ROUTE_TOPICAL => 'Topikal',
            self::ROUTE_INHALASI => 'Inhalasi',
            self::ROUTE_INJEKSI => 'Injeksi',
            self::ROUTE_REKTAL => 'Rektal',
            self::ROUTE_OKULER => 'Okuler',
            self::ROUTE_OTIK => 'Otik',
        ];
        return $labels[$this->route] ?? $this->route;
    }
    
    public function dispense(int $quantity, string $farmasiId): bool
    {
        if ($this->is_dispensed) return false;
        if ($quantity > $this->getRemainingQuantity()) return false;
        
        $transaction = Yii::$app->db->beginTransaction();
        try {
            // Kurangi stok secara atomik
            if (!$this->obat->deductStock(
                $quantity,
                $this->id,
                ObatStockLog::REF_RESEP,
                "Penyerahan resep: {$this->resep->no_resep}"
            )) {
                $transaction->rollBack();
                return false;
            }
            
            $this->dispensed_quantity += $quantity;
            $this->is_dispensed = $this->dispensed_quantity >= $this->quantity;
            $this->save(false, ['dispensed_quantity', 'is_dispensed']);
            
            $transaction->commit();
            return true;
        } catch (\Throwable $e) {
            $transaction->rollBack();
            throw $e;
        }
    }
    
    public function returnStock(int $quantity, string $reason): bool
    {
        if ($quantity > $this->dispensed_quantity) return false;
        
        $transaction = Yii::$app->db->beginTransaction();
        try {
            if (!$this->obat->addStock(
                $quantity,
                $this->id,
                ObatStockLog::REF_RETUR,
                "Retur resep: {$reason}"
            )) {
                $transaction->rollBack();
                return false;
            }
            
            $this->dispensed_quantity -= $quantity;
            $this->is_dispensed = $this->dispensed_quantity >= $this->quantity;
            $this->save(false, ['dispensed_quantity', 'is_dispensed']);
            
            $transaction->commit();
            return true;
        } catch (\Throwable $e) {
            $transaction->rollBack();
            throw $e;
        }
    }
}
<?php

namespace common\models;

use Yii;
use yii\db\ActiveQuery;

class TindakanTarif extends ActiveRecord
{
    public const KELAS_VIP = 'VIP';
    public const KELAS_1 = '1';
    public const KELAS_2 = '2';
    public const KELAS_3 = '3';
    public const KELAS_UMUM = 'umum';
    
    public const TYPE_UMUM = 'umum';
    public const TYPE_BPJS = 'bpjs';
    public const TYPE_KONTRAKTOR = 'kontraktor';
    public const TYPE_ASURANSI = 'asuransi';
    
    public static function tableName(): string
    {
        return '{{%tindakan_tarif}}';
    }
    
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            [['tindakan_id', 'kelas', 'pembayaran_type', 'tarif'], 'required'],
            [['tindakan_id'], 'string', 'max' => 36],
            [['kelas'], 'string', 'max' => 10],
            [['kelas'], 'in', 'range' => [self::KELAS_VIP, self::KELAS_1, self::KELAS_2, self::KELAS_3, self::KELAS_UMUM]],
            [['pembayaran_type'], 'string', 'max' => 20],
            [['pembayaran_type'], 'in', 'range' => [self::TYPE_UMUM, self::TYPE_BPJS, self::TYPE_KONTRAKTOR, self::TYPE_ASURANSI]],
            [['tarif'], 'number', 'min' => 0],
            [['tarif_dokter', 'tarif_petugas', 'tarif_alat', 'tarif_bhp', 'tarif_lain'], 'number', 'min' => 0, 'default' => 0],
            [['effective_from'], 'date', 'format' => 'php:Y-m-d'],
            [['effective_until'], 'date', 'format' => 'php:Y-m-d'],
            [['is_active'], 'boolean'],
            [['notes'], 'string'],
        ]);
    }
    
    public function attributeLabels(): array
    {
        return [
            'id' => 'ID',
            'tindakan_id' => 'Tindakan',
            'kelas' => 'Kelas',
            'pembayaran_type' => 'Tipe Pembayaran',
            'tarif' => 'Total Tarif',
            'tarif_dokter' => 'Tarif Dokter',
            'tarif_petugas' => 'Tarif Petugas',
            'tarif_alat' => 'Tarif Alat',
            'tarif_bhp' => 'Tarif BHP',
            'tarif_lain' => 'Tarif Lain',
            'effective_from' => 'Berlaku Dari',
            'effective_until' => 'Berlaku Sampai',
            'is_active' => 'Aktif',
            'notes' => 'Catatan',
        ];
    }
    
    public function getTindakan(): ActiveQuery
    {
        return $this->hasOne(Tindakan::class, ['id' => 'tindakan_id']);
    }
    
    public function getKelasLabel(): string
    {
        $labels = [
            self::KELAS_VIP => 'VIP',
            self::KELAS_1 => 'Kelas 1',
            self::KELAS_2 => 'Kelas 2',
            self::KELAS_3 => 'Kelas 3',
            self::KELAS_UMUM => 'Umum',
        ];
        return $labels[$this->kelas] ?? $this->kelas;
    }
    
    public function getPembayaranTypeLabel(): string
    {
        $labels = [
            self::TYPE_UMUM => 'Umum',
            self::TYPE_BPJS => 'BPJS',
            self::TYPE_KONTRAKTOR => 'Kontraktor',
            self::TYPE_ASURANSI => 'Asuransi',
        ];
        return $labels[$this->pembayaran_type] ?? $this->pembayaran_type;
    }
    
    public function isEffectiveOn(string $date): bool
    {
        $checkDate = date('Y-m-d', strtotime($date));
        if ($this->effective_from && $checkDate < $this->effective_from) return false;
        if ($this->effective_until && $checkDate > $this->effective_until) return false;
        return true;
    }
}
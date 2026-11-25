<?php

namespace common\models;

use Yii;
use yii\db\ActiveQuery;

class Tindakan extends ActiveRecord
{
    public const TYPE_KONSULTASI = 'konsultasi';
    public const TYPE_TINDAKAN_MEDIK = 'tindakan_medik';
    public const TYPE_OPERASI = 'operasi';
    public const TYPE_KEBIDANAN = 'kebidaman';
    public const TYPE_LAINNYA = 'lainnya';
    
    public static function tableName(): string
    {
        return '{{%tindakan}}';
    }
    
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            [['kode', 'nama'], 'required'],
            [['kode'], 'string', 'max' => 20],
            [['kode'], 'unique', 'filter' => ['is_deleted' => false]],
            [['nama'], 'string', 'max' => 150],
            [['type'], 'in', 'range' => [
                self::TYPE_KONSULTASI,
                self::TYPE_TINDAKAN_MEDIK,
                self::TYPE_OPERASI,
                self::TYPE_KEBIDANAN,
                self::TYPE_LAINNYA,
            ]],
            [['category_id'], 'string', 'max' => 36],
            [['description'], 'string'],
            [['is_active'], 'boolean'],
            [['requires_anesthesia'], 'boolean'],
            [['duration_minutes'], 'integer', 'min' => 0],
        ]);
    }
    
    public function attributeLabels(): array
    {
        return [
            'id' => 'ID',
            'kode' => 'Kode',
            'nama' => 'Nama Tindakan',
            'type' => 'Tipe',
            'category_id' => 'Kategori',
            'description' => 'Deskripsi',
            'is_active' => 'Aktif',
            'requires_anesthesia' => 'Butuh Anestesi',
            'duration_minutes' => 'Durasi (Menit)',
        ];
    }
    
    public function getCategory(): ActiveQuery
    {
        return $this->hasOne(TindakanCategory::class, ['id' => 'category_id']);
    }
    
    public function getTarif(): ActiveQuery
    {
        return $this->hasMany(TindakanTarif::class, ['tindakan_id' => 'id']);
    }
    
    public function getActiveTarif(): ActiveQuery
    {
        return $this->hasMany(TindakanTarif::class, ['tindakan_id' => 'id'])
            ->where(['is_active' => true])
            ->andWhere(['<=', 'effective_from', date('Y-m-d')])
            ->andWhere(['or', ['effective_until' => null], ['>=', 'effective_until', date('Y-m-d')]])
            ->orderBy(['kelas' => SORT_ASC]);
    }
    
    public function getTarifByKelas(string $kelas, string $pembayaran = 'umum'): ?TindakanTarif
    {
        return $this->getActiveTarif()
            ->andWhere(['kelas' => $kelas])
            ->andWhere(['pembayaran_type' => $pembayaran])
            ->one();
    }
    
    public function getTypeLabel(): string
    {
        $labels = [
            self::TYPE_KONSULTASI => 'Konsultasi',
            self::TYPE_TINDAKAN_MEDIK => 'Tindakan Medik',
            self::TYPE_OPERASI => 'Operasi',
            self::TYPE_KEBIDANAN => 'Kebidanan',
            self::TYPE_LAINNYA => 'Lainnya',
        ];
        return $labels[$this->type] ?? $this->type;
    }
}
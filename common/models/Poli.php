<?php

namespace common\models;

use Yii;
use yii\db\ActiveQuery;

class Poli extends ActiveRecord
{
    public const TYPE_POLIKLINIK = 'poliklinik';
    public const TYPE_UGD = 'ugd';
    public const TYPE_RAWAT_INAP = 'rawat_inap';
    public const TYPE_LABORATORIUM = 'laboratorium';
    public const TYPE_RADIOLOGI = 'radiologi';
    public const TYPE_FARMASI = 'farmasi';
    
    public static function tableName(): string
    {
        return '{{%poli}}';
    }
    
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            [['kode', 'nama'], 'required'],
            [['kode'], 'string', 'max' => 10],
            [['kode'], 'unique', 'filter' => ['is_deleted' => false]],
            [['nama'], 'string', 'max' => 100],
            [['type'], 'in', 'range' => [
                self::TYPE_POLIKLINIK,
                self::TYPE_UGD,
                self::TYPE_RAWAT_INAP,
                self::TYPE_LABORATORIUM,
                self::TYPE_RADIOLOGI,
                self::TYPE_FARMASI,
            ]],
            [['parent_id'], 'string', 'max' => 36],
            [['description'], 'string'],
            [['location'], 'string', 'max' => 150],
            [['phone'], 'string', 'max' => 20],
            [['registration_fee'], 'number', 'min' => 0],
            [['is_active'], 'boolean'],
            [['sort_order'], 'integer', 'default' => 0],
        ]);
    }
    
    public function attributeLabels(): array
    {
        return [
            'id' => 'ID',
            'kode' => 'Kode',
            'nama' => 'Nama Poli',
            'type' => 'Tipe',
            'parent_id' => 'Poli Induk',
            'description' => 'Deskripsi',
            'location' => 'Lokasi',
            'phone' => 'Telepon',
            'registration_fee' => 'Biaya Pendaftaran',
            'is_active' => 'Aktif',
            'sort_order' => 'Urutan',
        ];
    }
    
    public function getParent(): ActiveQuery
    {
        return $this->hasOne(self::class, ['id' => 'parent_id']);
    }
    
    public function getChildren(): ActiveQuery
    {
        return $this->hasMany(self::class, ['parent_id' => 'id']);
    }
    
    public function getJadwal(): ActiveQuery
    {
        return $this->hasMany(JadwalPraktik::class, ['poli_id' => 'id']);
    }
    
    public function getKunjungan(): ActiveQuery
    {
        return $this->hasMany(Kunjungan::class, ['poli_id' => 'id']);
    }
    
    public function getActiveDokter(): ActiveQuery
    {
        return $this->hasMany(Dokter::class, ['id' => 'dokter_id'])
            ->via('jadwal')
            ->where(['dokter.is_active' => true])
            ->distinct();
    }
    
    public function getTypeLabel(): string
    {
        $labels = [
            self::TYPE_POLIKLINIK => 'Poliklinik',
            self::TYPE_UGD => 'UGD',
            self::TYPE_RAWAT_INAP => 'Rawat Inap',
            self::TYPE_LABORATORIUM => 'Laboratorium',
            self::TYPE_RADIOLOGI => 'Radiologi',
            self::TYPE_FARMASI => 'Farmasi',
        ];
        return $labels[$this->type] ?? $this->type;
    }
}
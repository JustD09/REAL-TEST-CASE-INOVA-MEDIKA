<?php

namespace common\models;

use Yii;
use yii\db\ActiveQuery;

class Specialist extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%specialist}}';
    }
    
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            [['kode', 'nama'], 'required'],
            [['kode'], 'string', 'max' => 10],
            [['kode'], 'unique', 'filter' => ['is_deleted' => false]],
            [['nama'], 'string', 'max' => 100],
            [['description'], 'string'],
            [['is_active'], 'boolean'],
            [['sort_order'], 'integer', 'default' => 0],
        ]);
    }
    
    public function attributeLabels(): array
    {
        return [
            'id' => 'ID',
            'kode' => 'Kode',
            'nama' => 'Nama Spesialis',
            'description' => 'Deskripsi',
            'is_active' => 'Aktif',
            'sort_order' => 'Urutan',
        ];
    }
    
    public function getDokter(): ActiveQuery
    {
        return $this->hasMany(Dokter::class, ['specialist_id' => 'id']);
    }
}
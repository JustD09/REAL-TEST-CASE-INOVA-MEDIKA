<?php

namespace common\models;

use Yii;
use yii\db\ActiveQuery;

class Diagnosa extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%diagnosa}}';
    }
    
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            [['kode', 'nama'], 'required'],
            [['kode'], 'string', 'max' => 20],
            [['kode'], 'unique', 'filter' => ['is_deleted' => false]],
            [['nama'], 'string', 'max' => 255],
            [['description'], 'string'],
            [['parent_kode'], 'string', 'max' => 20],
            [['chapter'], 'string', 'max' => 10],
            [['is_active'], 'boolean'],
        ]);
    }
    
    public function attributeLabels(): array
    {
        return [
            'id' => 'ID',
            'kode' => 'Kode ICD-10',
            'nama' => 'Nama Diagnosa',
            'description' => 'Deskripsi',
            'parent_kode' => 'Kode Induk',
            'chapter' => 'Bab ICD-10',
            'is_active' => 'Aktif',
        ];
    }
    
    public function getParent(): ActiveQuery
    {
        return $this->hasOne(self::class, ['kode' => 'parent_kode']);
    }
    
    public function getChildren(): ActiveQuery
    {
        return $this->hasMany(self::class, ['parent_kode' => 'kode']);
    }
    
    public static function search(string $query, int $limit = 20): array
    {
        return static::findActive()
            ->where(['or',
                ['like', 'kode', $query],
                ['like', 'nama', $query],
            ])
            ->limit($limit)
            ->all();
    }
}
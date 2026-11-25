<?php

namespace common\models;

use yii\db\ActiveQuery;

class JenisPemeriksaanLabCategory extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%jenis_pemeriksaan_lab_category}}';
    }

    public function rules(): array
    {
        return array_merge(parent::rules(), [
            [['kode', 'nama'], 'required'],
            [['kode'], 'string', 'max' => 10],
            [['kode'], 'unique', 'filter' => ['is_deleted' => false]],
            [['nama'], 'string', 'max' => 100],
            [['parent_id'], 'string', 'max' => 36],
            [['description'], 'string'],
            [['is_active'], 'boolean'],
            [['sort_order'], 'integer', 'default' => 0],
        ]);
    }

    public function getParent(): ActiveQuery
    {
        return $this->hasOne(self::class, ['id' => 'parent_id']);
    }

    public function getChildren(): ActiveQuery
    {
        return $this->hasMany(self::class, ['parent_id' => 'id']);
    }

    public function getJenisPemeriksaanLab(): ActiveQuery
    {
        return $this->hasMany(JenisPemeriksaanLab::class, ['category_id' => 'id']);
    }
}

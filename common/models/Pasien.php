<?php

namespace common\models;

use Yii;
use yii\db\ActiveQuery;

class Pasien extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%pasien}}';
    }
    
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            [['no_rm', 'user_id'], 'required'],
            [['no_rm'], 'string', 'max' => 20],
            [['no_rm'], 'unique', 'filter' => ['is_deleted' => false]],
            [['user_id'], 'string', 'max' => 36],
            [['user_id'], 'unique', 'filter' => ['is_deleted' => false]],
            [['bpjs_number'], 'string', 'max' => 20],
            [['bpjs_number'], 'unique', 'filter' => ['is_deleted' => false]],
            [['bpjs_class'], 'in', 'range' => ['1', '2', '3', '']],
            [['bpjs_valid_from', 'bpjs_valid_to'], 'date', 'format' => 'php:Y-m-d'],
            [['registration_type'], 'in', 'range' => ['umum', 'bpjs', 'kontraktor', 'asuransi']],
            [['insurance_name', 'insurance_number', 'insurance_card_number'], 'string', 'max' => 100],
            [['referral_from'], 'string', 'max' => 150],
            [['notes'], 'string'],
            [['is_active'], 'boolean'],
        ]);
    }
    
    public function attributeLabels(): array
    {
        return [
            'id' => 'ID',
            'no_rm' => 'No. Rekam Medis',
            'user_id' => 'User',
            'bpjs_number' => 'No. BPJS',
            'bpjs_class' => 'Kelas BPJS',
            'bpjs_valid_from' => 'BPJS Berlaku Dari',
            'bpjs_valid_to' => 'BPJS Berlaku Sampai',
            'registration_type' => 'Jenis Pendaftaran',
            'insurance_name' => 'Nama Asuransi',
            'insurance_number' => 'No. Polis',
            'insurance_card_number' => 'No. Kartu Asuransi',
            'referral_from' => 'Rujukan Dari',
            'notes' => 'Catatan',
            'is_active' => 'Aktif',
        ];
    }
    
    public function getUser(): ActiveQuery
    {
        return $this->hasOne(User::class, ['id' => 'user_id']);
    }
    
    public function getProfile(): ActiveQuery
    {
        return $this->hasOne(Profile::class, ['user_id' => 'user_id']);
    }
    
    public function getKunjungan(): ActiveQuery
    {
        return $this->hasMany(Kunjungan::class, ['pasien_id' => 'id']);
    }
    
    public function getRekamMedis(): ActiveQuery
    {
        return $this->hasMany(RekamMedis::class, ['pasien_id' => 'id']);
    }
    
    public function getBilling(): ActiveQuery
    {
        return $this->hasMany(Billing::class, ['pasien_id' => 'id']);
    }
    
    public function getActiveKunjungan(): ActiveQuery
    {
        return $this->hasMany(Kunjungan::class, ['pasien_id' => 'id'])
            ->where(['in', 'status', [Kunjungan::STATUS_WAITING, Kunjungan::STATUS_IN_PROGRESS]])
            ->orderBy(['created_at' => SORT_DESC]);
    }
    
    public function getLatestKunjungan(): ActiveQuery
    {
        return $this->hasOne(Kunjungan::class, ['pasien_id' => 'id'])
            ->orderBy(['created_at' => SORT_DESC]);
    }
    
    public function generateNoRM(): string
    {
        $last = static::find()
            ->select('no_rm')
            ->where(['like', 'no_rm', date('Ymd') . '%'])
            ->orderBy(['no_rm' => SORT_DESC])
            ->limit(1)
            ->scalar();
        
        $datePrefix = date('Ymd');
        if ($last && str_starts_with($last, $datePrefix)) {
            $num = (int) substr($last, 8) + 1;
        } else {
            $num = 1;
        }
        
        return $datePrefix . str_pad($num, 4, '0', STR_PAD_LEFT);
    }
    
    public function beforeValidate(): bool
    {
        if (parent::beforeValidate()) {
            if ($this->isNewRecord && empty($this->no_rm)) {
                $this->no_rm = $this->generateNoRM();
            }
            if ($this->isNewRecord && empty($this->registration_type)) {
                $this->registration_type = 'umum';
            }
            if ($this->isNewRecord && empty($this->is_active)) {
                $this->is_active = true;
            }
            return true;
        }
        return false;
    }
}
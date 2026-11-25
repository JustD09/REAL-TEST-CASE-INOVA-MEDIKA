<?php

namespace common\models;

use Yii;
use yii\db\ActiveQuery;

class Profile extends ActiveRecord
{
    public const GENDER_MALE = 'L';
    public const GENDER_FEMALE = 'P';
    
    public const BLOOD_TYPE_A = 'A';
    public const BLOOD_TYPE_B = 'B';
    public const BLOOD_TYPE_AB = 'AB';
    public const BLOOD_TYPE_O = 'O';
    
    public const RH_POSITIVE = '+';
    public const RH_NEGATIVE = '-';
    
    public static function tableName(): string
    {
        return '{{%profile}}';
    }
    
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            [['user_id'], 'required'],
            [['user_id'], 'string', 'max' => 36],
            [['user_id'], 'unique', 'filter' => ['is_deleted' => false]],
            [['full_name'], 'string', 'max' => 150],
            [['nik'], 'string', 'max' => 16],
            [['nik'], 'unique', 'filter' => ['is_deleted' => false]],
            [['birth_place'], 'string', 'max' => 100],
            [['birth_date'], 'date', 'format' => 'php:Y-m-d'],
            [['gender'], 'in', 'range' => [self::GENDER_MALE, self::GENDER_FEMALE]],
            [['blood_type'], 'in', 'range' => [self::BLOOD_TYPE_A, self::BLOOD_TYPE_B, self::BLOOD_TYPE_AB, self::BLOOD_TYPE_O, '']],
            [['rh_factor'], 'in', 'range' => [self::RH_POSITIVE, self::RH_NEGATIVE, '']],
            [['address'], 'string'],
            [['rt', 'rw'], 'string', 'max' => 5],
            [['kelurahan', 'kecamatan', 'kota', 'provinsi'], 'string', 'max' => 100],
            [['postal_code'], 'string', 'max' => 10],
            [['phone'], 'string', 'max' => 20],
            [['phone'], 'unique', 'filter' => ['is_deleted' => false]],
            [['emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation'], 'string', 'max' => 100],
            [['photo'], 'string', 'max' => 255],
        ]);
    }
    
    public function attributeLabels(): array
    {
        return [
            'user_id' => 'User',
            'full_name' => 'Nama Lengkap',
            'nik' => 'NIK',
            'birth_place' => 'Tempat Lahir',
            'birth_date' => 'Tanggal Lahir',
            'gender' => 'Jenis Kelamin',
            'blood_type' => 'Golongan Darah',
            'rh_factor' => 'Rhesus',
            'address' => 'Alamat',
            'rt' => 'RT',
            'rw' => 'RW',
            'kelurahan' => 'Kelurahan',
            'kecamatan' => 'Kecamatan',
            'kota' => 'Kota',
            'provinsi' => 'Provinsi',
            'postal_code' => 'Kode Pos',
            'phone' => 'Telepon',
            'emergency_contact_name' => 'Nama Kontak Darurat',
            'emergency_contact_phone' => 'Telepon Kontak Darurat',
            'emergency_contact_relation' => 'Hubungan',
            'photo' => 'Foto',
        ];
    }
    
    public function getUser(): ActiveQuery
    {
        return $this->hasOne(User::class, ['id' => 'user_id']);
    }
    
    public function getGenderLabel(): string
    {
        return $this->gender === self::GENDER_MALE ? 'Laki-laki' : 'Perempuan';
    }
    
    public function getBloodTypeLabel(): string
    {
        if (!$this->blood_type) return '-';
        return $this->blood_type . ($this->rh_factor ?? '');
    }
    
    public function getAge(): ?int
    {
        if (!$this->birth_date) return null;
        return simrs_calculate_age($this->birth_date);
    }
    
    public function getFullAddress(): string
    {
        $parts = array_filter([
            $this->address,
            $this->rt ? "RT {$this->rt}" : null,
            $this->rw ? "RW {$this->rw}" : null,
            $this->kelurahan,
            $this->kecamatan,
            $this->kota,
            $this->provinsi,
            $this->postal_code,
        ]);
        return implode(', ', $parts);
    }
}
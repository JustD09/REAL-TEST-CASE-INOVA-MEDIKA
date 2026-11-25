<?php

namespace common\models;

use Yii;
use yii\db\ActiveQuery;

class Dokter extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%dokter}}';
    }
    
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            [['user_id', 'nip', 'full_name', 'specialist_id'], 'required'],
            [['nip'], 'string', 'max' => 30],
            [['nip'], 'unique', 'filter' => ['is_deleted' => false]],
            [['user_id'], 'string', 'max' => 36],
            [['user_id'], 'unique', 'filter' => ['is_deleted' => false]],
            [['full_name'], 'string', 'max' => 150],
            [['specialist_id'], 'string', 'max' => 36],
            [['str_number'], 'string', 'max' => 50],
            [['str_valid_until'], 'date', 'format' => 'php:Y-m-d'],
            [['sip_number'], 'string', 'max' => 50],
            [['sip_valid_until'], 'date', 'format' => 'php:Y-m-d'],
            [['phone'], 'string', 'max' => 20],
            [['email'], 'email', 'max' => 100],
            [['address'], 'string'],
            [['photo'], 'string', 'max' => 255],
            [['education'], 'string'],
            [['experience_years'], 'integer', 'min' => 0],
            [['consultation_fee'], 'number', 'min' => 0],
            [['is_active'], 'boolean'],
            [['notes'], 'string'],
        ]);
    }
    
    public function attributeLabels(): array
    {
        return [
            'id' => 'ID',
            'nip' => 'NIP',
            'user_id' => 'User',
            'full_name' => 'Nama Lengkap',
            'specialist_id' => 'Spesialis',
            'str_number' => 'No. STR',
            'str_valid_until' => 'STR Berlaku Sampai',
            'sip_number' => 'No. SIP',
            'sip_valid_until' => 'SIP Berlaku Sampai',
            'phone' => 'Telepon',
            'email' => 'Email',
            'address' => 'Alamat',
            'photo' => 'Foto',
            'education' => 'Pendidikan',
            'experience_years' => 'Tahun Pengalaman',
            'consultation_fee' => 'Biaya Konsultasi',
            'is_active' => 'Aktif',
            'notes' => 'Catatan',
        ];
    }
    
    public function getUser(): ActiveQuery
    {
        return $this->hasOne(User::class, ['id' => 'user_id']);
    }
    
    public function getSpecialist(): ActiveQuery
    {
        return $this->hasOne(Specialist::class, ['id' => 'specialist_id']);
    }
    
    public function getJadwal(): ActiveQuery
    {
        return $this->hasMany(JadwalPraktik::class, ['dokter_id' => 'id']);
    }
    
    public function getKunjungan(): ActiveQuery
    {
        return $this->hasMany(Kunjungan::class, ['dokter_id' => 'id']);
    }
    
    public function getPemeriksaan(): ActiveQuery
    {
        return $this->hasMany(Pemeriksaan::class, ['dokter_id' => 'id']);
    }
    
    public function getActiveJadwal(): ActiveQuery
    {
        return $this->hasMany(JadwalPraktik::class, ['dokter_id' => 'id'])
            ->where(['is_active' => true])
            ->andWhere(['>=', 'effective_until', date('Y-m-d')])
            ->orderBy(['day_of_week' => SORT_ASC, 'start_time' => SORT_ASC]);
    }
    
    public function getAvailableSlots(string $date): array
    {
        $dayOfWeek = (int) date('w', strtotime($date)); // 0 = Minggu
        
        $schedules = $this->getActiveJadwal()
            ->andWhere(['day_of_week' => $dayOfWeek])
            ->all();
        
        $slots = [];
        foreach ($schedules as $schedule) {
            $bookedCount = Kunjungan::find()
                ->where([
                    'dokter_id' => $this->id,
                    'tanggal' => $date,
                    'poli_id' => $schedule->poli_id,
                ])
                ->andWhere(['in', 'status', [Kunjungan::STATUS_WAITING, Kunjungan::STATUS_IN_PROGRESS, Kunjungan::STATUS_DONE]])
                ->count();
            
            $available = max(0, $schedule->quota - $bookedCount);
            
            if ($available > 0) {
                $slots[] = [
                    'jadwal_id' => $schedule->id,
                    'poli_id' => $schedule->poli_id,
                    'poli_nama' => $schedule->poli->nama ?? '',
                    'start_time' => $schedule->start_time,
                    'end_time' => $schedule->end_time,
                    'quota' => $schedule->quota,
                    'booked' => $bookedCount,
                    'available' => $available,
                ];
            }
        }
        
        return $slots;
    }
}
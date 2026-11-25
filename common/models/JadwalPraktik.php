<?php

namespace common\models;

use Yii;
use yii\db\ActiveQuery;

class JadwalPraktik extends ActiveRecord
{
    public const DAY_MONDAY = 1;
    public const DAY_TUESDAY = 2;
    public const DAY_WEDNESDAY = 3;
    public const DAY_THURSDAY = 4;
    public const DAY_FRIDAY = 5;
    public const DAY_SATURDAY = 6;
    public const DAY_SUNDAY = 0;
    
    public static function tableName(): string
    {
        return '{{%jadwal_praktik}}';
    }
    
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            [['dokter_id', 'poli_id', 'day_of_week', 'start_time', 'end_time'], 'required'],
            [['dokter_id', 'poli_id'], 'string', 'max' => 36],
            [['day_of_week'], 'integer', 'min' => 0, 'max' => 6],
            [['start_time', 'end_time'], 'date', 'format' => 'php:H:i'],
            [['quota'], 'integer', 'min' => 1, 'max' => 100, 'default' => 20],
            [['effective_from'], 'date', 'format' => 'php:Y-m-d'],
            [['effective_until'], 'date', 'format' => 'php:Y-m-d'],
            [['is_active'], 'boolean'],
            [['notes'], 'string'],
            [['dokter_id', 'poli_id', 'day_of_week', 'effective_from'], 'unique', 'targetAttribute' => ['dokter_id', 'poli_id', 'day_of_week', 'effective_from'], 'filter' => ['is_deleted' => false]],
        ]);
    }
    
    public function attributeLabels(): array
    {
        return [
            'id' => 'ID',
            'dokter_id' => 'Dokter',
            'poli_id' => 'Poli',
            'day_of_week' => 'Hari',
            'start_time' => 'Jam Mulai',
            'end_time' => 'Jam Selesai',
            'quota' => 'Kuota',
            'effective_from' => 'Berlaku Dari',
            'effective_until' => 'Berlaku Sampai',
            'is_active' => 'Aktif',
            'notes' => 'Catatan',
        ];
    }
    
    public function getDokter(): ActiveQuery
    {
        return $this->hasOne(Dokter::class, ['id' => 'dokter_id']);
    }
    
    public function getPoli(): ActiveQuery
    {
        return $this->hasOne(Poli::class, ['id' => 'poli_id']);
    }
    
    public function getDayLabel(): string
    {
        $days = [
            self::DAY_SUNDAY => 'Minggu',
            self::DAY_MONDAY => 'Senin',
            self::DAY_TUESDAY => 'Selasa',
            self::DAY_WEDNESDAY => 'Rabu',
            self::DAY_THURSDAY => 'Kamis',
            self::DAY_FRIDAY => 'Jumat',
            self::DAY_SATURDAY => 'Sabtu',
        ];
        return $days[$this->day_of_week] ?? '-';
    }
    
    public function getTimeRange(): string
    {
        return date('H:i', strtotime($this->start_time)) . ' - ' . date('H:i', strtotime($this->end_time));
    }
    
    public function isEffectiveOn(string $date): bool
    {
        $checkDate = date('Y-m-d', strtotime($date));
        if ($this->effective_from && $checkDate < $this->effective_from) return false;
        if ($this->effective_until && $checkDate > $this->effective_until) return false;
        return true;
    }
    
    public function getBookedCount(string $date): int
    {
        return Kunjungan::find()
            ->where([
                'dokter_id' => $this->dokter_id,
                'poli_id' => $this->poli_id,
                'tanggal' => $date,
            ])
            ->andWhere(['in', 'status', [Kunjungan::STATUS_WAITING, Kunjungan::STATUS_IN_PROGRESS, Kunjungan::STATUS_DONE]])
            ->count();
    }
    
    public function getAvailableQuota(string $date): int
    {
        return max(0, $this->quota - $this->getBookedCount($date));
    }
}
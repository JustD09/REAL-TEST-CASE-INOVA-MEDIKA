<?php

namespace common\models;

use Yii;
use yii\db\ActiveQuery;
use Ramsey\Uuid\Uuid;

class Antrean extends ActiveRecord
{
    public const STATUS_WAITING = 'waiting';
    public const STATUS_CALLED = 'called';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_DONE = 'done';
    public const STATUS_SKIPPED = 'skipped';
    public const STATUS_CANCELLED = 'cancelled';
    
    public static function tableName(): string
    {
        return '{{%antrean}}';
    }
    
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            [['kunjungan_id', 'poli_id', 'tanggal', 'no_antrean'], 'required'],
            [['kunjungan_id', 'poli_id'], 'string', 'max' => 36],
            [['tanggal'], 'date', 'format' => 'php:Y-m-d'],
            [['no_antrean'], 'integer', 'min' => 1],
            [['status'], 'in', 'range' => [
                self::STATUS_WAITING, self::STATUS_CALLED, self::STATUS_IN_PROGRESS,
                self::STATUS_DONE, self::STATUS_SKIPPED, self::STATUS_CANCELLED,
            ]],
            [['priority'], 'integer', 'min' => 0, 'max' => 10, 'default' => 0],
            [['called_at', 'started_at', 'completed_at'], 'safe'],
            [['notes'], 'string'],
        ]);
    }
    
    public function attributeLabels(): array
    {
        return [
            'id' => 'ID',
            'kunjungan_id' => 'Kunjungan',
            'poli_id' => 'Poli',
            'tanggal' => 'Tanggal',
            'no_antrean' => 'No. Antrean',
            'status' => 'Status',
            'priority' => 'Prioritas',
            'called_at' => 'Dipanggil',
            'started_at' => 'Mulai',
            'completed_at' => 'Selesai',
            'notes' => 'Catatan',
        ];
    }
    
    public function getKunjungan(): ActiveQuery
    {
        return $this->hasOne(Kunjungan::class, ['id' => 'kunjungan_id']);
    }
    
    public function getPoli(): ActiveQuery
    {
        return $this->hasOne(Poli::class, ['id' => 'poli_id']);
    }
    
    public function getStatusLabel(): string
    {
        $labels = [
            self::STATUS_WAITING => 'Menunggu',
            self::STATUS_CALLED => 'Dipanggil',
            self::STATUS_IN_PROGRESS => 'Sedang Diperiksa',
            self::STATUS_DONE => 'Selesai',
            self::STATUS_SKIPPED => 'Dilewati',
            self::STATUS_CANCELLED => 'Dibatalkan',
        ];
        return $labels[$this->status] ?? $this->status;
    }
    
    public function call(): bool
    {
        if ($this->status !== self::STATUS_WAITING) return false;
        $this->status = self::STATUS_CALLED;
        $this->called_at = date('Y-m-d H:i:s');
        return $this->save(false, ['status', 'called_at']);
    }
    
    public function start(): bool
    {
        if (!in_array($this->status, [self::STATUS_WAITING, self::STATUS_CALLED])) return false;
        $this->status = self::STATUS_IN_PROGRESS;
        $this->started_at = date('Y-m-d H:i:s');
        return $this->save(false, ['status', 'started_at']);
    }
    
    public function complete(): bool
    {
        if ($this->status !== self::STATUS_IN_PROGRESS) return false;
        $this->status = self::STATUS_DONE;
        $this->completed_at = date('Y-m-d H:i:s');
        return $this->save(false, ['status', 'completed_at']);
    }
    
    public function skip(): bool
    {
        if (!in_array($this->status, [self::STATUS_WAITING, self::STATUS_CALLED])) return false;
        $this->status = self::STATUS_SKIPPED;
        return $this->save(false, ['status']);
    }
    
    public static function getCurrentQueue(string $poliId, string $date): ?self
    {
        return static::findActive()
            ->where(['poli_id' => $poliId, 'tanggal' => $date])
            ->andWhere(['in', 'status', [self::STATUS_WAITING, self::STATUS_CALLED, self::STATUS_IN_PROGRESS]])
            ->orderBy(['no_antrean' => SORT_ASC])
            ->one();
    }
    
    public static function getWaitingCount(string $poliId, string $date): int
    {
        return static::findActive()
            ->where(['poli_id' => $poliId, 'tanggal' => $date])
            ->andWhere(['in', 'status', [self::STATUS_WAITING, self::STATUS_CALLED]])
            ->count();
    }
    
    public static function getNextNumber(string $poliId, string $date): int
    {
        $last = static::find()
            ->select('MAX(no_antrean) as max_num')
            ->where(['poli_id' => $poliId, 'tanggal' => $date])
            ->scalar();
        return ($last ?? 0) + 1;
    }
}
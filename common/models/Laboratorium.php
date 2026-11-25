<?php

namespace common\models;

use Yii;
use yii\db\ActiveQuery;
use Ramsey\Uuid\Uuid;

class Laboratorium extends ActiveRecord
{
    public const STATUS_ORDERED = 'ordered';
    public const STATUS_SAMPLE_COLLECTED = 'sample_collected';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_VERIFIED = 'verified';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_REJECTED = 'rejected';
    
    public const SAMPLE_BLOOD = 'blood';
    public const SAMPLE_URINE = 'urine';
    public const SAMPLE_STOOL = 'stool';
    public const SAMPLE_SPUTUM = 'sputum';
    public const SAMPLE_SWAB = 'swab';
    public const SAMPLE_TISSUE = 'tissue';
    public const SAMPLE_OTHER = 'other';
    
    public static function tableName(): string
    {
        return '{{%laboratorium}}';
    }
    
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            [['kunjungan_id', 'pemeriksaan_id', 'jenis_pemeriksaan_id'], 'required'],
            [['kunjungan_id', 'pemeriksaan_id', 'jenis_pemeriksaan_id', 'dokter_id', 'petugas_id', 'verifikator_id'], 'string', 'max' => 36],
            [['no_order'], 'string', 'max' => 30],
            [['no_order'], 'unique', 'filter' => ['is_deleted' => false]],
            [['sample_type'], 'in', 'range' => [
                self::SAMPLE_BLOOD, self::SAMPLE_URINE, self::SAMPLE_STOOL,
                self::SAMPLE_SPUTUM, self::SAMPLE_SWAB, self::SAMPLE_TISSUE, self::SAMPLE_OTHER,
            ]],
            [['status'], 'in', 'range' => [
                self::STATUS_ORDERED, self::STATUS_SAMPLE_COLLECTED, self::STATUS_IN_PROGRESS,
                self::STATUS_COMPLETED, self::STATUS_VERIFIED, self::STATUS_CANCELLED, self::STATUS_REJECTED,
            ]],
            [['clinical_info'], 'string'],
            [['result'], 'string'],
            [['interpretation'], 'string'],
            [['tarif'], 'number', 'min' => 0],
            [['ordered_at', 'collected_at', 'started_at', 'completed_at', 'verified_at'], 'safe'],
        ]);
    }
    
    public function attributeLabels(): array
    {
        return [
            'id' => 'ID',
            'kunjungan_id' => 'Kunjungan',
            'pemeriksaan_id' => 'Pemeriksaan',
            'jenis_pemeriksaan_id' => 'Jenis Pemeriksaan',
            'dokter_id' => 'Dokter',
            'petugas_id' => 'Petugas Lab',
            'verifikator_id' => 'Verifikator',
            'no_order' => 'No. Order',
            'sample_type' => 'Jenis Specimen',
            'status' => 'Status',
            'clinical_info' => 'Info Klinis',
            'result' => 'Hasil',
            'interpretation' => 'Interpretasi',
            'tarif' => 'Tarif',
            'ordered_at' => 'Dipesan',
            'collected_at' => 'Specimen Diambil',
            'started_at' => 'Dikerjakan',
            'completed_at' => 'Selesai',
            'verified_at' => 'Diverifikasi',
        ];
    }
    
    public function getKunjungan(): ActiveQuery
    {
        return $this->hasOne(Kunjungan::class, ['id' => 'kunjungan_id']);
    }
    
    public function getPemeriksaan(): ActiveQuery
    {
        return $this->hasOne(Pemeriksaan::class, ['id' => 'pemeriksaan_id']);
    }
    
    public function getJenisPemeriksaan(): ActiveQuery
    {
        return $this->hasOne(JenisPemeriksaanLab::class, ['id' => 'jenis_pemeriksaan_id']);
    }
    
    public function getDokter(): ActiveQuery
    {
        return $this->hasOne(Dokter::class, ['id' => 'dokter_id']);
    }
    
    public function getPetugas(): ActiveQuery
    {
        return $this->hasOne(User::class, ['id' => 'petugas_id']);
    }
    
    public function getVerifikator(): ActiveQuery
    {
        return $this->hasOne(User::class, ['id' => 'verifikator_id']);
    }
    
    public function getStatusLabel(): string
    {
        $labels = [
            self::STATUS_ORDERED => 'Dipesan',
            self::STATUS_SAMPLE_COLLECTED => 'Specimen Diambil',
            self::STATUS_IN_PROGRESS => 'Dikerjakan',
            self::STATUS_COMPLETED => 'Selesai',
            self::STATUS_VERIFIED => 'Diverifikasi',
            self::STATUS_CANCELLED => 'Dibatalkan',
            self::STATUS_REJECTED => 'Ditolak',
        ];
        return $labels[$this->status] ?? $this->status;
    }
    
    public function getSampleTypeLabel(): string
    {
        $labels = [
            self::SAMPLE_BLOOD => 'Darah',
            self::SAMPLE_URINE => 'Urin',
            self::SAMPLE_STOOL => 'Tinja',
            self::SAMPLE_SPUTUM => 'Dahak',
            self::SAMPLE_SWAB => 'Swab',
            self::SAMPLE_TISSUE => 'Jaringan',
            self::SAMPLE_OTHER => 'Lainnya',
        ];
        return $labels[$this->sample_type] ?? $this->sample_type;
    }
    
    public function generateNoOrder(): string
    {
        $date = date('Ymd');
        $last = static::find()
            ->select('no_order')
            ->where(['like', 'no_order', "LAB{$date}%"])
            ->orderBy(['no_order' => SORT_DESC])
            ->limit(1)
            ->scalar();
        
        if ($last && str_starts_with($last, "LAB{$date}")) {
            $num = (int) substr($last, 7) + 1;
        } else {
            $num = 1;
        }
        
        return "LAB{$date}" . str_pad($num, 4, '0', STR_PAD_LEFT);
    }
    
    public function beforeValidate(): bool
    {
        if (parent::beforeValidate()) {
            if ($this->isNewRecord) {
                if (empty($this->no_order)) {
                    $this->no_order = $this->generateNoOrder();
                }
                if (empty($this->status)) {
                    $this->status = self::STATUS_ORDERED;
                }
                if (empty($this->ordered_at)) {
                    $this->ordered_at = date('Y-m-d H:i:s');
                }
            }
            return true;
        }
        return false;
    }
    
    public function collectSample(string $petugasId): bool
    {
        if ($this->status !== self::STATUS_ORDERED) return false;
        $this->status = self::STATUS_SAMPLE_COLLECTED;
        $this->petugas_id = $petugasId;
        $this->collected_at = date('Y-m-d H:i:s');
        return $this->save(false, ['status', 'petugas_id', 'collected_at']);
    }
    
    public function startProcess(string $petugasId): bool
    {
        if ($this->status !== self::STATUS_SAMPLE_COLLECTED) return false;
        $this->status = self::STATUS_IN_PROGRESS;
        $this->petugas_id = $petugasId;
        $this->started_at = date('Y-m-d H:i:s');
        return $this->save(false, ['status', 'petugas_id', 'started_at']);
    }
    
    public function complete(string $petugasId, string $result, ?string $interpretation = null): bool
    {
        if ($this->status !== self::STATUS_IN_PROGRESS) return false;
        $this->status = self::STATUS_COMPLETED;
        $this->petugas_id = $petugasId;
        $this->result = $result;
        $this->interpretation = $interpretation;
        $this->completed_at = date('Y-m-d H:i:s');
        return $this->save(false, ['status', 'petugas_id', 'result', 'interpretation', 'completed_at']);
    }
    
    public function verify(string $verifikatorId): bool
    {
        if ($this->status !== self::STATUS_COMPLETED) return false;
        $this->status = self::STATUS_VERIFIED;
        $this->verifikator_id = $verifikatorId;
        $this->verified_at = date('Y-m-d H:i:s');
        return $this->save(false, ['status', 'verifikator_id', 'verified_at']);
    }
    
    public function reject(string $reason): bool
    {
        if (!in_array($this->status, [self::STATUS_ORDERED, self::STATUS_SAMPLE_COLLECTED, self::STATUS_IN_PROGRESS])) return false;
        $this->status = self::STATUS_REJECTED;
        $this->result = "DITOLAK: {$reason}";
        return $this->save(false, ['status', 'result']);
    }
    
    public function cancel(): bool
    {
        if (!in_array($this->status, [self::STATUS_ORDERED, self::STATUS_SAMPLE_COLLECTED])) return false;
        $this->status = self::STATUS_CANCELLED;
        return $this->save(false, ['status']);
    }
}
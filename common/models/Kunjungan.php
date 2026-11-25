<?php

namespace common\models;

use Yii;
use yii\db\ActiveQuery;
use yii\db\Expression;
use Ramsey\Uuid\Uuid;

class Kunjungan extends ActiveRecord
{
    public const STATUS_REGISTERED = 'registered';
    public const STATUS_WAITING = 'waiting';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_DONE = 'done';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_NO_SHOW = 'no_show';
    public const STATUS_REFERRED = 'referred';
    
    public const TYPE_BARU = 'baru';
    public const TYPE_LAMA = 'lama';
    public const TYPE_KONTROL = 'kontrol';
    public const TYPE_UGD = 'ugd';
    
    public static function tableName(): string
    {
        return '{{%kunjungan}}';
    }
    
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            [['pasien_id', 'poli_id', 'tanggal', 'no_antrean'], 'required'],
            [['pasien_id', 'poli_id', 'dokter_id', 'jadwal_id'], 'string', 'max' => 36],
            [['tanggal'], 'date', 'format' => 'php:Y-m-d'],
            [['no_antrean'], 'integer', 'min' => 1],
            [['type'], 'in', 'range' => [self::TYPE_BARU, self::TYPE_LAMA, self::TYPE_KONTROL, self::TYPE_UGD]],
            [['status'], 'in', 'range' => [
                self::STATUS_REGISTERED, self::STATUS_WAITING, self::STATUS_IN_PROGRESS,
                self::STATUS_DONE, self::STATUS_CANCELLED, self::STATUS_NO_SHOW, self::STATUS_REFERRED,
            ]],
            [['keluhan'], 'string'],
            [['registration_fee'], 'number', 'min' => 0, 'default' => 0],
            [['is_bpjs'], 'boolean'],
            [['bpjs_referral_number'], 'string', 'max' => 50],
            [['notes'], 'string'],
            [['called_at', 'started_at', 'completed_at'], 'safe'],
            [['no_antrean', 'poli_id', 'tanggal'], 'unique', 'filter' => ['is_deleted' => false], 'message' => 'Nomor antrean sudah terpakai untuk poli dan tanggal ini'],
            [['pasien_id', 'poli_id', 'tanggal'], 'unique', 'filter' => ['is_deleted' => false, 'status' => [self::STATUS_REGISTERED, self::STATUS_WAITING, self::STATUS_IN_PROGRESS]], 'message' => 'Pasien sudah terdaftar di poli ini pada tanggal yang sama'],
        ]);
    }
    
    public function attributeLabels(): array
    {
        return [
            'id' => 'ID',
            'pasien_id' => 'Pasien',
            'poli_id' => 'Poli',
            'dokter_id' => 'Dokter',
            'jadwal_id' => 'Jadwal',
            'tanggal' => 'Tanggal',
            'no_antrean' => 'No. Antrean',
            'type' => 'Tipe Kunjungan',
            'status' => 'Status',
            'keluhan' => 'Keluhan',
            'registration_fee' => 'Biaya Daftar',
            'is_bpjs' => 'BPJS',
            'bpjs_referral_number' => 'No. Rujukan BPJS',
            'notes' => 'Catatan',
            'called_at' => 'Dipanggil',
            'started_at' => 'Mulai Pemeriksaan',
            'completed_at' => 'Selesai',
        ];
    }
    
    public function getPasien(): ActiveQuery
    {
        return $this->hasOne(Pasien::class, ['id' => 'pasien_id']);
    }
    
    public function getPoli(): ActiveQuery
    {
        return $this->hasOne(Poli::class, ['id' => 'poli_id']);
    }
    
    public function getDokter(): ActiveQuery
    {
        return $this->hasOne(Dokter::class, ['id' => 'dokter_id']);
    }
    
    public function getJadwal(): ActiveQuery
    {
        return $this->hasOne(JadwalPraktik::class, ['id' => 'jadwal_id']);
    }
    
    public function getPemeriksaan(): ActiveQuery
    {
        return $this->hasOne(Pemeriksaan::class, ['kunjungan_id' => 'id']);
    }
    
    public function getRekamMedis(): ActiveQuery
    {
        return $this->hasOne(RekamMedis::class, ['kunjungan_id' => 'id']);
    }
    
    public function getTindakanMedis(): ActiveQuery
    {
        return $this->hasMany(TindakanMedis::class, ['kunjungan_id' => 'id']);
    }
    
    public function getResep(): ActiveQuery
    {
        return $this->hasMany(Resep::class, ['kunjungan_id' => 'id']);
    }
    
    public function getLaboratorium(): ActiveQuery
    {
        return $this->hasMany(Laboratorium::class, ['kunjungan_id' => 'id']);
    }
    
    public function getBilling(): ActiveQuery
    {
        return $this->hasOne(Billing::class, ['kunjungan_id' => 'id']);
    }
    
    public function getAntrean(): ActiveQuery
    {
        return $this->hasOne(Antrean::class, ['kunjungan_id' => 'id']);
    }
    
    public function getStatusLabel(): string
    {
        $labels = [
            self::STATUS_REGISTERED => 'Terdaftar',
            self::STATUS_WAITING => 'Menunggu',
            self::STATUS_IN_PROGRESS => 'Sedang Diperiksa',
            self::STATUS_DONE => 'Selesai',
            self::STATUS_CANCELLED => 'Dibatalkan',
            self::STATUS_NO_SHOW => 'Tidak Hadir',
            self::STATUS_REFERRED => 'Dirujuk',
        ];
        return $labels[$this->status] ?? $this->status;
    }
    
    public function getTypeLabel(): string
    {
        $labels = [
            self::TYPE_BARU => 'Baru',
            self::TYPE_LAMA => 'Lama',
            self::TYPE_KONTROL => 'Kontrol',
            self::TYPE_UGD => 'UGD',
        ];
        return $labels[$this->type] ?? $this->type;
    }
    
    public function canBeCancelled(): bool
    {
        return in_array($this->status, [self::STATUS_REGISTERED, self::STATUS_WAITING]);
    }
    
    public function callPatient(): bool
    {
        if ($this->status !== self::STATUS_WAITING) return false;
        $this->status = self::STATUS_IN_PROGRESS;
        $this->started_at = date('Y-m-d H:i:s');
        return $this->save(false, ['status', 'started_at']);
    }
    
    public function complete(): bool
    {
        if (!in_array($this->status, [self::STATUS_IN_PROGRESS, self::STATUS_WAITING])) return false;
        $this->status = self::STATUS_DONE;
        $this->completed_at = date('Y-m-d H:i:s');
        return $this->save(false, ['status', 'completed_at']);
    }
    
    public function cancel(string $reason = ''): bool
    {
        if (!$this->canBeCancelled()) return false;
        $this->status = self::STATUS_CANCELLED;
        $this->notes = ($this->notes ? $this->notes . "\n" : '') . "Dibatalkan: $reason";
        return $this->save(false, ['status', 'notes']);
    }
    
    public static function generateQueueNumber(string $poliId, string $date): int
    {
        $last = static::find()
            ->select('MAX(no_antrean) as max_queue')
            ->where(['poli_id' => $poliId, 'tanggal' => $date])
            ->andWhere(['!=', 'status', self::STATUS_CANCELLED])
            ->scalar();
        
        return ($last ?? 0) + 1;
    }
    
    public static function createRegistration(
        string $pasienId,
        string $poliId,
        string $date,
        ?string $dokterId = null,
        ?string $jadwalId = null,
        string $type = self::TYPE_BARU,
        string $keluhan = '',
        bool $isBpjs = false,
        ?string $bpjsReferral = null
    ): ?self {
        $transaction = Yii::$app->db->beginTransaction();
        try {
            // Kunci baris poli untuk mencegah race condition
            $poli = Poli::findOneForUpdate(['id' => $poliId]);
            if (!$poli || !$poli->is_active) {
                throw new \Exception('Poli tidak aktif');
            }
            
            // Periksa duplikasi pendaftaran pada hari yang sama
            $existing = static::find()
                ->where([
                    'pasien_id' => $pasienId,
                    'poli_id' => $poliId,
                    'tanggal' => $date,
                ])
                ->andWhere(['in', 'status', [self::STATUS_REGISTERED, self::STATUS_WAITING, self::STATUS_IN_PROGRESS]])
                ->one();
            
            if ($existing) {
                throw new \Exception('Pasien sudah terdaftar di poli ini hari ini');
            }
            
            // Periksa kuota jika dokter ditentukan
            if ($dokterId && $jadwalId) {
                $jadwal = JadwalPraktik::findOneForUpdate(['id' => $jadwalId]);
                if (!$jadwal || !$jadwal->is_active || !$jadwal->isEffectiveOn($date)) {
                    throw new \Exception('Jadwal tidak valid');
                }
                $available = $jadwal->getAvailableQuota($date);
                if ($available <= 0) {
                    throw new \Exception('Kuota jadwal sudah penuh');
                }
            }
            
            $noAntrean = static::generateQueueNumber($poliId, $date);
            
            $kunjungan = new static();
            $kunjungan->id = Uuid::uuid4()->toString();
            $kunjungan->pasien_id = $pasienId;
            $kunjungan->poli_id = $poliId;
            $kunjungan->dokter_id = $dokterId;
            $kunjungan->jadwal_id = $jadwalId;
            $kunjungan->tanggal = $date;
            $kunjungan->no_antrean = $noAntrean;
            $kunjungan->type = $type;
            $kunjungan->status = self::STATUS_WAITING;
            $kunjungan->keluhan = $keluhan;
            $kunjungan->registration_fee = $poli->registration_fee;
            $kunjungan->is_bpjs = $isBpjs;
            $kunjungan->bpjs_referral_number = $bpjsReferral;
            $kunjungan->save(false);
            
            // Buat rekam antrean
            $antrean = new Antrean();
            $antrean->id = Uuid::uuid4()->toString();
            $antrean->kunjungan_id = $kunjungan->id;
            $antrean->poli_id = $poliId;
            $antrean->tanggal = $date;
            $antrean->no_antrean = $noAntrean;
            $antrean->status = Antrean::STATUS_WAITING;
            $antrean->save(false);
            
            $transaction->commit();
            return $kunjungan;
        } catch (\Throwable $e) {
            $transaction->rollBack();
            throw $e;
        }
    }
}
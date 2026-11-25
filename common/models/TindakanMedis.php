<?php

namespace common\models;

use Yii;
use yii\db\ActiveQuery;
use Ramsey\Uuid\Uuid;

class TindakanMedis extends ActiveRecord
{
    public const STATUS_ORDERED = 'ordered';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';
    
    public static function tableName(): string
    {
        return '{{%tindakan_medis}}';
    }
    
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            [['kunjungan_id', 'tindakan_id', 'dokter_id', 'kelas', 'tarif'], 'required'],
            [['kunjungan_id', 'tindakan_id', 'dokter_id', 'petugas_id'], 'string', 'max' => 36],
            [['quantity'], 'integer', 'min' => 1, 'default' => 1],
            [['kelas'], 'string', 'max' => 10],
            [['kelas'], 'in', 'range' => [TindakanTarif::KELAS_VIP, TindakanTarif::KELAS_1, TindakanTarif::KELAS_2, TindakanTarif::KELAS_3, TindakanTarif::KELAS_UMUM]],
            [['pembayaran_type'], 'string', 'max' => 20],
            [['pembayaran_type'], 'in', 'range' => [TindakanTarif::TYPE_UMUM, TindakanTarif::TYPE_BPJS, TindakanTarif::TYPE_KONTRAKTOR, TindakanTarif::TYPE_ASURANSI]],
            [['tarif', 'tarif_dokter', 'tarif_petugas', 'tarif_alat', 'tarif_bhp', 'tarif_lain'], 'number', 'min' => 0],
            [['total_tarif'], 'number', 'min' => 0],
            [['status'], 'in', 'range' => [self::STATUS_ORDERED, self::STATUS_IN_PROGRESS, self::STATUS_COMPLETED, self::STATUS_CANCELLED]],
            [['notes'], 'string'],
            [['performed_at'], 'safe'],
        ]);
    }
    
    public function attributeLabels(): array
    {
        return [
            'id' => 'ID',
            'kunjungan_id' => 'Kunjungan',
            'tindakan_id' => 'Tindakan',
            'dokter_id' => 'Dokter',
            'petugas_id' => 'Petugas',
            'quantity' => 'Jumlah',
            'kelas' => 'Kelas',
            'pembayaran_type' => 'Tipe Pembayaran',
            'tarif' => 'Tarif Dasar',
            'tarif_dokter' => 'Tarif Dokter',
            'tarif_petugas' => 'Tarif Petugas',
            'tarif_alat' => 'Tarif Alat',
            'tarif_bhp' => 'Tarif BHP',
            'tarif_lain' => 'Tarif Lain',
            'total_tarif' => 'Total Tarif',
            'status' => 'Status',
            'notes' => 'Catatan',
            'performed_at' => 'Dilaksanakan',
        ];
    }
    
    public function getKunjungan(): ActiveQuery
    {
        return $this->hasOne(Kunjungan::class, ['id' => 'kunjungan_id']);
    }
    
    public function getTindakan(): ActiveQuery
    {
        return $this->hasOne(Tindakan::class, ['id' => 'tindakan_id']);
    }
    
    public function getDokter(): ActiveQuery
    {
        return $this->hasOne(Dokter::class, ['id' => 'dokter_id']);
    }
    
    public function getPetugas(): ActiveQuery
    {
        return $this->hasOne(User::class, ['id' => 'petugas_id']);
    }
    
    public function getStatusLabel(): string
    {
        $labels = [
            self::STATUS_ORDERED => 'Dipesan',
            self::STATUS_IN_PROGRESS => 'Sedang Dilaksanakan',
            self::STATUS_COMPLETED => 'Selesai',
            self::STATUS_CANCELLED => 'Dibatalkan',
        ];
        return $labels[$this->status] ?? $this->status;
    }
    
    public function beforeSave($insert): bool
    {
        if (parent::beforeSave($insert)) {
            $this->total_tarif = ($this->tarif + $this->tarif_dokter + $this->tarif_petugas + 
                                $this->tarif_alat + $this->tarif_bhp + $this->tarif_lain) * $this->quantity;
            return true;
        }
        return false;
    }
    
    public function start(): bool
    {
        if ($this->status !== self::STATUS_ORDERED) return false;
        $this->status = self::STATUS_IN_PROGRESS;
        return $this->save(false, ['status']);
    }
    
    public function complete(string $petugasId = null): bool
    {
        if ($this->status !== self::STATUS_IN_PROGRESS) return false;
        $this->status = self::STATUS_COMPLETED;
        $this->performed_at = date('Y-m-d H:i:s');
        if ($petugasId) $this->petugas_id = $petugasId;
        return $this->save(false, ['status', 'performed_at', 'petugas_id']);
    }
    
    public function cancel(): bool
    {
        if (!in_array($this->status, [self::STATUS_ORDERED, self::STATUS_IN_PROGRESS])) return false;
        $this->status = self::STATUS_CANCELLED;
        return $this->save(false, ['status']);
    }
    
    public static function createFromMaster(
        string $kunjunganId,
        string $tindakanId,
        string $dokterId,
        string $kelas,
        string $pembayaranType = TindakanTarif::TYPE_UMUM,
        int $quantity = 1,
        ?string $petugasId = null
    ): ?self {
        $masterTarif = TindakanTarif::find()
            ->where([
                'tindakan_id' => $tindakanId,
                'kelas' => $kelas,
                'pembayaran_type' => $pembayaranType,
                'is_active' => true,
            ])
            ->andWhere(['<=', 'effective_from', date('Y-m-d')])
            ->andWhere(['or', ['effective_until' => null], ['>=', 'effective_until', date('Y-m-d')]])
            ->one();
        
        if (!$masterTarif) return null;
        
        $tindakanMedis = new self();
        $tindakanMedis->id = Uuid::uuid4()->toString();
        $tindakanMedis->kunjungan_id = $kunjunganId;
        $tindakanMedis->tindakan_id = $tindakanId;
        $tindakanMedis->dokter_id = $dokterId;
        $tindakanMedis->petugas_id = $petugasId;
        $tindakanMedis->quantity = $quantity;
        $tindakanMedis->kelas = $kelas;
        $tindakanMedis->pembayaran_type = $pembayaranType;
        $tindakanMedis->tarif = $masterTarif->tarif;
        $tindakanMedis->tarif_dokter = $masterTarif->tarif_dokter;
        $tindakanMedis->tarif_petugas = $masterTarif->tarif_petugas;
        $tindakanMedis->tarif_alat = $masterTarif->tarif_alat;
        $tindakanMedis->tarif_bhp = $masterTarif->tarif_bhp;
        $tindakanMedis->tarif_lain = $masterTarif->tarif_lain;
        $tindakanMedis->status = self::STATUS_ORDERED;
        $tindakanMedis->save(false);
        
        return $tindakanMedis;
    }
}
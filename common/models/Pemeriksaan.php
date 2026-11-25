<?php

namespace common\models;

use Yii;
use yii\db\ActiveQuery;
use Ramsey\Uuid\Uuid;

class Pemeriksaan extends ActiveRecord
{
    private function addKesalahan(string $attribute, string $message): void
    {
        $this->addError($attribute, $message);
    }

    public static function tableName(): string
    {
        return '{{%pemeriksaan}}';
    }
    
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            [['kunjungan_id', 'rekam_medis_id', 'dokter_id'], 'required'],
            [['kunjungan_id', 'rekam_medis_id', 'dokter_id'], 'string', 'max' => 36],
            [['kunjungan_id'], 'unique', 'filter' => ['is_deleted' => false], 'message' => 'Kunjungan sudah memiliki pemeriksaan'],
            [['rekam_medis_id'], 'unique', 'filter' => ['is_deleted' => false], 'message' => 'Rekam medis sudah memiliki pemeriksaan'],
            [['anamnesis', 'keluhan_utama', 'pemeriksaan_fisik', 'catatan'], 'string'],
            [['tinggi_badan', 'berat_badan', 'tekanan_darah_sistol', 'tekanan_darah_diastol',
              'nadi', 'suhu', 'respirasi', 'saturasi_o2', 'bmi'], 'number'],
            [['diagnosa_utama_id', 'diagnosa_sekunder_ids'], 'string', 'max' => 500],
            [['tindakan_ids'], 'string', 'max' => 1000],
            [['resep_ids'], 'string', 'max' => 1000],
            [['lab_order_ids'], 'string', 'max' => 1000],
            [['is_final'], 'boolean'],
            [['version'], 'integer', 'min' => 1],
            [['started_at', 'completed_at'], 'safe'],
        ]);
    }
    
    public function attributeLabels(): array
    {
        return [
            'id' => 'ID',
            'kunjungan_id' => 'Kunjungan',
            'rekam_medis_id' => 'Rekam Medis',
            'dokter_id' => 'Dokter',
            'anamnesis' => 'Anamnesis',
            'keluhan_utama' => 'Keluhan Utama',
            'pemeriksaan_fisik' => 'Pemeriksaan Fisik',
            'tinggi_badan' => 'Tinggi Badan (cm)',
            'berat_badan' => 'Berat Badan (kg)',
            'tekanan_darah_sistol' => 'TD Sistol',
            'tekanan_darah_diastol' => 'TD Diastol',
            'nadi' => 'Nadi (x/menit)',
            'suhu' => 'Suhu (°C)',
            'respirasi' => 'Respirasi (x/menit)',
            'saturasi_o2' => 'SpO2 (%)',
            'bmi' => 'BMI',
            'diagnosa_utama_id' => 'Diagnosa Utama (ICD-10)',
            'diagnosa_sekunder_ids' => 'Diagnosa Sekunder (ICD-10)',
            'tindakan_ids' => 'Tindakan',
            'resep_ids' => 'Resep',
            'lab_order_ids' => 'Order Lab',
            'catatan' => 'Catatan',
            'is_final' => 'Final',
            'started_at' => 'Mulai',
            'completed_at' => 'Selesai',
        ];
    }
    
    public function getKunjungan(): ActiveQuery
    {
        return $this->hasOne(Kunjungan::class, ['id' => 'kunjungan_id']);
    }
    
    public function getRekamMedis(): ActiveQuery
    {
        return $this->hasOne(RekamMedis::class, ['id' => 'rekam_medis_id']);
    }
    
    public function getDokter(): ActiveQuery
    {
        return $this->hasOne(Dokter::class, ['id' => 'dokter_id']);
    }
    
    public function getDiagnosaUtama(): ActiveQuery
    {
        return $this->hasOne(Diagnosa::class, ['kode' => 'diagnosa_utama_id']);
    }
    
    public function getTindakan(): ActiveQuery
    {
        $ids = $this->tindakan_ids ? explode(',', $this->tindakan_ids) : [];
        return TindakanMedis::find()->where(['in', 'id', $ids]);
    }
    
    public function getResep(): ActiveQuery
    {
        $ids = $this->resep_ids ? explode(',', $this->resep_ids) : [];
        return Resep::find()->where(['in', 'id', $ids]);
    }
    
    public function getLabOrders(): ActiveQuery
    {
        $ids = $this->lab_order_ids ? explode(',', $this->lab_order_ids) : [];
        return Laboratorium::find()->where(['in', 'id', $ids]);
    }
    
    public function calculateBMI(): ?float
    {
        if ($this->tinggi_badan && $this->berat_badan) {
            $heightM = $this->tinggi_badan / 100;
            return round($this->berat_badan / ($heightM * $heightM), 1);
        }
        return null;
    }
    
    public function beforeSave($insert): bool
    {
        if (parent::beforeSave($insert)) {
            $this->bmi = $this->calculateBMI();
            return true;
        }
        return false;
    }
    
    public function start(): bool
    {
        if ($this->started_at) return false;
        $this->started_at = date('Y-m-d H:i:s');
        return $this->save(false, ['started_at']);
    }
    
    public function complete(): bool
    {
        if ($this->completed_at) return false;
        $this->completed_at = date('Y-m-d H:i:s');
        return $this->save(false, ['completed_at']);
    }
    
    public function finalize(): bool
    {
        if ($this->is_final) {
            $this->addKesalahan('is_final', 'Pemeriksaan sudah difinalisasi');
            return false;
        }
        
        $transaction = Yii::$app->db->beginTransaction();
        try {
            // Kunci dan periksa versi untuk optimistic locking
            $locked = static::findOneForUpdate(['id' => $this->id]);
            
            if (!$locked) {
                $this->addKesalahan('id', 'Data pemeriksaan tidak ditemukan');
                return false;
            }
            
            if ($locked->is_final) {
                $this->addKesalahan('is_final', 'Pemeriksaan sudah difinalisasi oleh user lain');
                return false;
            }
            
            if ($locked->version !== $this->version) {
                $this->addKesalahan('version', 'Data telah diubah oleh user lain, silakan refresh dan coba lagi');
                return false;
            }
            
            $this->is_final = true;
            $this->version += 1;
            $this->completed_at = $this->completed_at ?? date('Y-m-d H:i:s');
            
            if (!$this->save(false, ['is_final', 'version', 'completed_at', 'updated_at'])) {
                throw new \Exception('Gagal menyimpan finalisasi');
            }
            
            $transaction->commit();
            return true;
        } catch (\Throwable $e) {
            $transaction->rollBack();
            $this->addKesalahan('finalize', $e->getMessage());
            return false;
        }
    }
    
    /**
     * Update examination with optimistic locking
     * @param array $attributes
     * @return bool
     */
    public function updateWithLock(array $attributes): bool
    {
        $transaction = Yii::$app->db->beginTransaction();
        try {
            $locked = static::findOneForUpdate(['id' => $this->id]);
            
            if (!$locked) {
                $this->addKesalahan('id', 'Data pemeriksaan tidak ditemukan');
                return false;
            }
            
            if ($locked->is_final) {
                $this->addKesalahan('is_final', 'Tidak bisa mengubah pemeriksaan yang sudah difinalisasi');
                return false;
            }
            
            if ($locked->version !== $this->version) {
                $this->addKesalahan('version', 'Data telah diubah oleh user lain, silakan refresh dan coba lagi');
                return false;
            }
            
            // Perbarui atribut
            foreach ($attributes as $key => $value) {
                $this->$key = $value;
            }
            $this->version += 1;
            
            if (!$this->save(false, array_merge(array_keys($attributes), ['version', 'updated_at']))) {
                throw new \Exception('Gagal memperbarui pemeriksaan');
            }
            
            $transaction->commit();
            return true;
        } catch (\Throwable $e) {
            $transaction->rollBack();
            $this->addKesalahan('update', $e->getMessage());
            return false;
        }
    }
}
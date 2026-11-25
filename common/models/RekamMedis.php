<?php

namespace common\models;

use Yii;
use yii\db\ActiveQuery;
use Ramsey\Uuid\Uuid;

class RekamMedis extends ActiveRecord
{
    public static function tableName(): string
    {
        return '{{%rekam_medis}}';
    }
    
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            [['pasien_id', 'kunjungan_id'], 'required'],
            [['pasien_id', 'kunjungan_id'], 'string', 'max' => 36],
            [['kunjungan_id'], 'unique', 'filter' => ['is_deleted' => false]],
            [['anamnesis', 'keluhan_utama', 'riwayat_penyakit_sekarang', 'riwayat_penyakit_dahulu',
              'riwayat_alergi', 'riwayat_obat', 'riwayat_pembedahan', 'riwayat_keluarga', 'riwayat_sosial'],
             'string'],
            [['tinggi_badan', 'berat_badan', 'tekanan_darah_sistol', 'tekanan_darah_diastol',
              'nadi', 'suhu', 'respirasi', 'saturasi_o2', 'bmi'], 'number'],
            [['pemeriksaan_fisik'], 'string'],
            [['diagnosa_utama_id', 'diagnosa_sekunder_ids'], 'string', 'max' => 500],
            [['catatan_dokter'], 'string'],
            [['is_final'], 'boolean'],
            [['signed_at'], 'safe'],
        ]);
    }
    
    public function attributeLabels(): array
    {
        return [
            'id' => 'ID',
            'pasien_id' => 'Pasien',
            'kunjungan_id' => 'Kunjungan',
            'anamnesis' => 'Anamnesis',
            'keluhan_utama' => 'Keluhan Utama',
            'riwayat_penyakit_sekarang' => 'Riwayat Penyakit Sekarang',
            'riwayat_penyakit_dahulu' => 'Riwayat Penyakit Dahulu',
            'riwayat_alergi' => 'Riwayat Alergi',
            'riwayat_obat' => 'Riwayat Obat',
            'riwayat_pembedahan' => 'Riwayat Pembedahan',
            'riwayat_keluarga' => 'Riwayat Keluarga',
            'riwayat_sosial' => 'Riwayat Sosial',
            'tinggi_badan' => 'Tinggi Badan (cm)',
            'berat_badan' => 'Berat Badan (kg)',
            'tekanan_darah_sistol' => 'TD Sistol',
            'tekanan_darah_diastol' => 'TD Diastol',
            'nadi' => 'Nadi (x/menit)',
            'suhu' => 'Suhu (°C)',
            'respirasi' => 'Respirasi (x/menit)',
            'saturasi_o2' => 'SpO2 (%)',
            'bmi' => 'BMI',
            'pemeriksaan_fisik' => 'Pemeriksaan Fisik',
            'diagnosa_utama_id' => 'Diagnosa Utama (ICD-10)',
            'diagnosa_sekunder_ids' => 'Diagnosa Sekunder (ICD-10)',
            'catatan_dokter' => 'Catatan Dokter',
            'is_final' => 'Final',
            'signed_at' => 'Ditandatangani',
        ];
    }
    
    public function getPasien(): ActiveQuery
    {
        return $this->hasOne(Pasien::class, ['id' => 'pasien_id']);
    }
    
    public function getKunjungan(): ActiveQuery
    {
        return $this->hasOne(Kunjungan::class, ['id' => 'kunjungan_id']);
    }
    
    public function getDiagnosaUtama(): ActiveQuery
    {
        return $this->hasOne(Diagnosa::class, ['kode' => 'diagnosa_utama_id']);
    }
    
    public function getDiagnosaSekunder(): ActiveQuery
    {
        $ids = $this->diagnosa_sekunder_ids ? explode(',', $this->diagnosa_sekunder_ids) : [];
        return Diagnosa::find()->where(['in', 'kode', $ids]);
    }
    
    public function getPemeriksaan(): ActiveQuery
    {
        return $this->hasOne(Pemeriksaan::class, ['rekam_medis_id' => 'id']);
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
    
    public function finalize(string $dokterId): bool
    {
        if ($this->is_final) return false;
        $this->is_final = true;
        $this->signed_at = date('Y-m-d H:i:s');
        // Tanda tangan digital dapat ditambahkan di sini
        return $this->save(false, ['is_final', 'signed_at']);
    }
}
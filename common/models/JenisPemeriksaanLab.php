<?php

namespace common\models;

use Yii;
use yii\db\ActiveQuery;

class JenisPemeriksaanLab extends ActiveRecord
{
    public const TYPE_HEMATOLOGI = 'hematologi';
    public const TYPE_KIMIA_DARAH = 'kimia_darah';
    public const TYPE_URINALISIS = 'urinalisis';
    public const TYPE_MIKROBIOLOGI = 'mikrobiologi';
    public const TYPE_IMUNOLOGI = 'imunologi';
    public const TYPE_PATOLOGI_ANATOMI = 'patologi_anatomis';
    public const TYPE_SITOLOGI = 'sitologi';
    public const TYPE_LAINNYA = 'lainnya';

    public const SAMPLE_BLOOD = 'blood';
    public const SAMPLE_URINE = 'urine';
    public const SAMPLE_SWAB = 'swab';
    public const SAMPLE_STOOL = 'stool';
    public const SAMPLE_SPUTUM = 'sputum';
    
    public static function tableName(): string
    {
        return '{{%jenis_pemeriksaan_lab}}';
    }
    
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            [['kode', 'nama'], 'required'],
            [['kode'], 'string', 'max' => 20],
            [['kode'], 'unique', 'filter' => ['is_deleted' => false]],
            [['nama'], 'string', 'max' => 150],
            [['type'], 'in', 'range' => [
                self::TYPE_HEMATOLOGI, self::TYPE_KIMIA_DARAH, self::TYPE_URINALISIS,
                self::TYPE_MIKROBIOLOGI, self::TYPE_IMUNOLOGI, self::TYPE_PATOLOGI_ANATOMI,
                self::TYPE_SITOLOGI, self::TYPE_LAINNYA,
            ]],
            [['category_id'], 'string', 'max' => 36],
            [['sample_type'], 'string', 'max' => 20],
            [['sample_volume'], 'string', 'max' => 50],
            [['container_type'], 'string', 'max' => 50],
            [['preparation_instructions'], 'string'],
            [['reference_range'], 'string'],
            [['unit'], 'string', 'max' => 20],
            [['tarif'], 'number', 'min' => 0],
            [['turnaround_time_hours'], 'integer', 'min' => 0],
            [['is_active'], 'boolean'],
            [['notes'], 'string'],
        ]);
    }
    
    public function attributeLabels(): array
    {
        return [
            'id' => 'ID',
            'kode' => 'Kode',
            'nama' => 'Nama Pemeriksaan',
            'type' => 'Tipe',
            'category_id' => 'Kategori',
            'sample_type' => 'Jenis Specimen',
            'sample_volume' => 'Volume Specimen',
            'container_type' => 'Wadah',
            'preparation_instructions' => 'Persiapan Pasien',
            'reference_range' => 'Nilai Rujukan',
            'unit' => 'Satuan',
            'tarif' => 'Tarif',
            'turnaround_time_hours' => 'Waktu Proses (Jam)',
            'is_active' => 'Aktif',
            'notes' => 'Catatan',
        ];
    }
    
    public function getCategory(): ActiveQuery
    {
        return $this->hasOne(JenisPemeriksaanLabCategory::class, ['id' => 'category_id']);
    }
    
    public function getTypeLabel(): string
    {
        $labels = [
            self::TYPE_HEMATOLOGI => 'Hematologi',
            self::TYPE_KIMIA_DARAH => 'Kimia Darah',
            self::TYPE_URINALISIS => 'Urinalisis',
            self::TYPE_MIKROBIOLOGI => 'Mikrobiologi',
            self::TYPE_IMUNOLOGI => 'Imunologi',
            self::TYPE_PATOLOGI_ANATOMI => 'Patologi Anatomik',
            self::TYPE_SITOLOGI => 'Sitologi',
            self::TYPE_LAINNYA => 'Lainnya',
        ];
        return $labels[$this->type] ?? $this->type;
    }
}
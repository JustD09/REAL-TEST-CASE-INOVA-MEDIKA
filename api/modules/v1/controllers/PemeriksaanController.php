<?php

namespace api\modules\v1\controllers;

use Yii;
use yii\data\ActiveDataProvider;
use yii\web\NotFoundHttpException;
use common\models\Pemeriksaan;
use common\models\RekamMedis;
use common\models\Kunjungan;
use common\models\Diagnosa;

class PemeriksaanController extends BaseController
{
    public $modelClass = Pemeriksaan::class;

    public function actions(): array
    {
        $actions = parent::actions();
        unset($actions['create'], $actions['update'], $actions['delete']);
        return $actions;
    }

    public function actionIndex(): ActiveDataProvider
    {
        $this->requirePermission('transaksi-pemeriksaan-view');

        $query = Pemeriksaan::findActive()->with(['kunjungan.pasien.user.profile', 'dokter', 'rekamMedis']);

        $params = Yii::$app->request->queryParams;

        if (!empty($params['kunjungan_id'])) {
            $query->andWhere(['kunjungan_id' => $params['kunjungan_id']]);
        }

        if (!empty($params['dokter_id'])) {
            $query->andWhere(['dokter_id' => $params['dokter_id']]);
        }

        if (!empty($params['tanggal_from']) && !empty($params['tanggal_to'])) {
            $query->andWhere(['between', 'created_at', $params['tanggal_from'], $params['tanggal_to']]);
        }

        return new ActiveDataProvider([
            'query' => $query,
            'pagination' => [
                'pageSize' => Yii::$app->params['pagination.pageSize'],
            ],
            'sort' => [
                'defaultOrder' => ['created_at' => SORT_DESC],
            ],
        ]);
    }

    public function actionView(string $id): Pemeriksaan
    {
        $this->requirePermission('transaksi-pemeriksaan-view');

        $model = Pemeriksaan::findActive()
            ->with([
                'kunjungan.pasien.user.profile',
                'kunjungan.poli',
                'kunjungan.dokter.user.profile',
                'dokter.user.profile',
                'rekamMedis.diagnosaUtama',
                'rekamMedis.diagnosaSekunder',
                'tindakanMedis.tindakan',
                'resep.resepDetail.obat',
                'laboratorium.jenisPemeriksaan',
            ])
            ->where(['id' => $id])
            ->one();

        if (!$model) {
            throw new NotFoundHttpException('Pemeriksaan tidak ditemukan');
        }
        return $model;
    }

    public function actionCreate(): Pemeriksaan
    {
        $this->requirePermission('transaksi-pemeriksaan-create');

        $data = Yii::$app->request->getBodyParams();

        $required = ['kunjungan_id', 'dokter_id'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new \yii\web\BadRequestHttpException("Kolom '$field' wajib diisi");
            }
        }

        $kunjungan = Kunjungan::findActive()->where(['id' => $data['kunjungan_id']])->one();
        if (!$kunjungan) {
            throw new NotFoundHttpException('Kunjungan tidak ditemukan');
        }

        if ($kunjungan->status !== Kunjungan::STATUS_IN_PROGRESS && $kunjungan->status !== Kunjungan::STATUS_WAITING) {
            throw new \yii\web\BadRequestHttpException('Kunjungan tidak berstatus valid untuk pemeriksaan');
        }

        $dokter = \common\models\Dokter::findActive()->where(['id' => $data['dokter_id']])->one();
        if (!$dokter) {
            throw new NotFoundHttpException('Dokter tidak ditemukan');
        }

        $model = new Pemeriksaan();
        $model->id = \Ramsey\Uuid\Uuid::uuid4()->toString();
        $model->kunjungan_id = $data['kunjungan_id'];
        $model->dokter_id = $data['dokter_id'];
        $model->anamnesis = $data['anamnesis'] ?? '';
        $model->keluhan_utama = $data['keluhan_utama'] ?? $kunjungan->keluhan;
        $model->riwayat_penyakit = $data['riwayat_penyakit'] ?? '';
        $model->riwayat_obat = $data['riwayat_obat'] ?? '';
        $model->riwayat_alergi = $data['riwayat_alergi'] ?? '';
        $model->tekanan_darah = $data['tekanan_darah'] ?? null;
        $model->nadi = $data['nadi'] ?? null;
        $model->suhu = $data['suhu'] ?? null;
        $model->respirasi = $data['respirasi'] ?? null;
        $model->saturasi = $data['saturasi'] ?? null;
        $model->berat_badan = $data['berat_badan'] ?? null;
        $model->tinggi_badan = $data['tinggi_badan'] ?? null;
        $model->bmi = $data['bmi'] ?? null;
        $model->pemeriksaan_fisik = $data['pemeriksaan_fisik'] ?? '';
        $model->catatan = $data['catatan'] ?? '';
        $model->status = Pemeriksaan::STATUS_IN_PROGRESS;
        $model->save(false);

        if ($kunjungan->status === Kunjungan::STATUS_WAITING) {
            $kunjungan->status = Kunjungan::STATUS_IN_PROGRESS;
            $kunjungan->save(false, ['status']);
        }

        Yii::$app->auditLogger->logCreate('Pemeriksaan', $model->id, $model->toArray());

        return $model;
    }

    public function actionUpdate(string $id): Pemeriksaan
    {
        $this->requirePermission('transaksi-pemeriksaan-update');

        $model = Pemeriksaan::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Pemeriksaan tidak ditemukan');
        }

        $oldData = $model->toArray();
        $data = Yii::$app->request->getBodyParams();

        $model->anamnesis = $data['anamnesis'] ?? $model->anamnesis;
        $model->keluhan_utama = $data['keluhan_utama'] ?? $model->keluhan_utama;
        $model->riwayat_penyakit = $data['riwayat_penyakit'] ?? $model->riwayat_penyakit;
        $model->riwayat_obat = $data['riwayat_obat'] ?? $model->riwayat_obat;
        $model->riwayat_alergi = $data['riwayat_alergi'] ?? $model->riwayat_alergi;
        $model->tekanan_darah = $data['tekanan_darah'] ?? $model->tekanan_darah;
        $model->nadi = $data['nadi'] ?? $model->nadi;
        $model->suhu = $data['suhu'] ?? $model->suhu;
        $model->respirasi = $data['respirasi'] ?? $model->respirasi;
        $model->saturasi = $data['saturasi'] ?? $model->saturasi;
        $model->berat_badan = $data['berat_badan'] ?? $model->berat_badan;
        $model->tinggi_badan = $data['tinggi_badan'] ?? $model->tinggi_badan;
        $model->bmi = $data['bmi'] ?? $model->bmi;
        $model->pemeriksaan_fisik = $data['pemeriksaan_fisik'] ?? $model->pemeriksaan_fisik;
        $model->catatan = $data['catatan'] ?? $model->catatan;

        if ($model->save()) {
            Yii::$app->auditLogger->logUpdate('Pemeriksaan', $model->id, $oldData, $model->toArray());
            return $model;
        }

        throw new \yii\web\UnprocessableEntityHttpException(json_encode($model->errors));
    }

    public function actionComplete(string $id): array
    {
        $this->requirePermission('transaksi-pemeriksaan-complete');

        $model = Pemeriksaan::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Pemeriksaan tidak ditemukan');
        }

        if ($model->status === Pemeriksaan::STATUS_COMPLETED) {
            throw new \yii\web\BadRequestHttpException('Pemeriksaan sudah selesai dan tidak dapat diubah');
        }

        $data = Yii::$app->request->getBodyParams();

        $model->status = Pemeriksaan::STATUS_COMPLETED;
        $model->completed_at = date('Y-m-d H:i:s');

        if (!empty($data['diagnosa_utama_id'])) {
            $diagnosa = Diagnosa::find()->where(['id' => $data['diagnosa_utama_id']])->one();
            if ($diagnosa) {
                $model->diagnosa_utama_id = $diagnosa->id;
            }
        }

        if (!empty($data['diagnosa_sekunder_ids']) && is_array($data['diagnosa_sekunder_ids'])) {
            $model->diagnosa_sekunder_ids = json_encode($data['diagnosa_sekunder_ids']);
        }

        $model->save(false);

        $rekamMedis = new RekamMedis();
        $rekamMedis->id = \Ramsey\Uuid\Uuid::uuid4()->toString();
        $rekamMedis->kunjungan_id = $model->kunjungan_id;
        $rekamMedis->pemeriksaan_id = $model->id;
        $rekamMedis->dokter_id = $model->dokter_id;
        $rekamMedis->diagnosa_utama_id = $model->diagnosa_utama_id;
        $rekamMedis->diagnosa_sekunder_ids = $model->diagnosa_sekunder_ids;
        $rekamMedis->anamnesis = $model->anamnesis;
        $rekamMedis->pemeriksaan_fisik = $model->pemeriksaan_fisik;
        $rekamMedis->catatan = $model->catatan;
        $rekamMedis->save(false);

        if ($model->kunjungan) {
            $model->kunjungan->status = Kunjungan::STATUS_DONE;
            $model->kunjungan->save(false, ['status']);
        }

        Yii::$app->auditLogger->logUpdate('Pemeriksaan', $model->id, $oldData, $model->toArray());

        return [
            'success' => true,
            'message' => 'Pemeriksaan completed',
            'data' => [
                'pemeriksaan' => $model,
                'rekam_medis' => $rekamMedis,
            ],
        ];
    }

    public function actionVitalSigns(string $id): array
    {
        $this->requirePermission('transaksi-pemeriksaan-view');

        $model = Pemeriksaan::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Pemeriksaan tidak ditemukan');
        }

        return [
            'success' => true,
            'data' => [
                'tekanan_darah' => $model->tekanan_darah,
                'nadi' => $model->nadi,
                'suhu' => $model->suhu,
                'respirasi' => $model->respirasi,
                'saturasi' => $model->saturasi,
                'berat_badan' => $model->berat_badan,
                'tinggi_badan' => $model->tinggi_badan,
                'bmi' => $model->bmi,
            ],
        ];
    }

    public function actionSaveVitalSigns(string $id): array
    {
        $this->requirePermission('transaksi-pemeriksaan-update');

        $model = Pemeriksaan::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Pemeriksaan tidak ditemukan');
        }

        $data = Yii::$app->request->getBodyParams();

        $model->tekanan_darah = $data['tekanan_darah'] ?? $model->tekanan_darah;
        $model->nadi = $data['nadi'] ?? $model->nadi;
        $model->suhu = $data['suhu'] ?? $model->suhu;
        $model->respirasi = $data['respirasi'] ?? $model->respirasi;
        $model->saturasi = $data['saturasi'] ?? $model->saturasi;
        $model->berat_badan = $data['berat_badan'] ?? $model->berat_badan;
        $model->tinggi_badan = $data['tinggi_badan'] ?? $model->tinggi_badan;

        if ($model->berat_badan && $model->tinggi_badan) {
            $tinggiM = $model->tinggi_badan / 100;
            $model->bmi = round($model->berat_badan / ($tinggiM * $tinggiM), 1);
        }

        $model->save(false);

        return ['success' => true, 'message' => 'Tanda vital berhasil disimpan', 'data' => $model];
    }
}
<?php

namespace api\modules\v1\controllers;

use Yii;
use yii\data\ActiveDataProvider;
use yii\web\NotFoundHttpException;
use common\models\Laboratorium;
use common\models\JenisPemeriksaanLab;
use common\models\Kunjungan;
use common\models\Pemeriksaan;
use common\models\Dokter;

class LaboratoriumController extends BaseController
{
    public $modelClass = Laboratorium::class;

    public function actions(): array
    {
        $actions = parent::actions();
        unset($actions['create'], $actions['update'], $actions['delete']);
        return $actions;
    }

    public function actionIndex(): ActiveDataProvider
    {
        $this->requirePermission('transaksi-lab-view');

        $query = Laboratorium::findActive()->with(['kunjungan.pasien.user.profile', 'jenisPemeriksaan', 'dokter', 'pemeriksaan', 'petugas', 'verifikator']);

        $params = Yii::$app->request->queryParams;

        if (!empty($params['kunjungan_id'])) {
            $query->andWhere(['kunjungan_id' => $params['kunjungan_id']]);
        }

        if (!empty($params['pemeriksaan_id'])) {
            $query->andWhere(['pemeriksaan_id' => $params['pemeriksaan_id']]);
        }

        if (!empty($params['jenis_pemeriksaan_id'])) {
            $query->andWhere(['jenis_pemeriksaan_id' => $params['jenis_pemeriksaan_id']]);
        }

        if (!empty($params['dokter_id'])) {
            $query->andWhere(['dokter_id' => $params['dokter_id']]);
        }

        if (!empty($params['status'])) {
            $query->andWhere(['status' => $params['status']]);
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

    public function actionView(string $id): Laboratorium
    {
        $this->requirePermission('transaksi-lab-view');

        $model = Laboratorium::findActive()
            ->with([
                'kunjungan.pasien.user.profile',
                'kunjungan.poli',
                'jenisPemeriksaan.category',
                'dokter.user.profile',
                'pemeriksaan',
                'petugas.user.profile',
                'verifikator.user.profile',
            ])
            ->where(['id' => $id])
            ->one();

        if (!$model) {
            throw new NotFoundHttpException('Laboratorium tidak ditemukan');
        }
        return $model;
    }

    public function actionCreate(): Laboratorium
    {
        $this->requirePermission('transaksi-lab-create');

        $data = Yii::$app->request->getBodyParams();

        $required = ['kunjungan_id', 'jenis_pemeriksaan_id', 'dokter_id'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new \yii\web\BadRequestHttpException("Kolom '$field' wajib diisi");
            }
        }

        $kunjungan = Kunjungan::findActive()->where(['id' => $data['kunjungan_id']])->one();
        if (!$kunjungan) {
            throw new NotFoundHttpException('Kunjungan tidak ditemukan');
        }

        $jenisLab = JenisPemeriksaanLab::findActive()->where(['id' => $data['jenis_pemeriksaan_id']])->one();
        if (!$jenisLab) {
            throw new NotFoundHttpException('Jenis pemeriksaan lab not found');
        }

        $dokter = Dokter::findActive()->where(['id' => $data['dokter_id']])->one();
        if (!$dokter) {
            throw new NotFoundHttpException('Dokter tidak ditemukan');
        }

        $pemeriksaanId = $data['pemeriksaan_id'] ?? null;
        if ($pemeriksaanId) {
            $pemeriksaan = Pemeriksaan::findActive()->where(['id' => $pemeriksaanId])->one();
            if (!$pemeriksaan || $pemeriksaan->kunjungan_id !== $kunjungan->id) {
                throw new \yii\web\BadRequestHttpException('Pemeriksaan tidak valid untuk kunjungan ini');
            }
        }

        $tarif = $data['tarif'] ?? $jenisLab->tarif;

        $model = new Laboratorium();
        $model->id = \Ramsey\Uuid\Uuid::uuid4()->toString();
        $model->kunjungan_id = $kunjungan->id;
        $model->pemeriksaan_id = $pemeriksaanId;
        $model->jenis_pemeriksaan_id = $jenisLab->id;
        $model->dokter_id = $dokter->id;
        $model->tarif = $tarif;
        $model->catatan = $data['catatan'] ?? '';
        $model->status = Laboratorium::STATUS_ORDERED;
        $model->save(false);

        Yii::$app->auditLogger->logCreate('Laboratorium', $model->id, $model->toArray());

        return $model;
    }

    public function actionUpdate(string $id): Laboratorium
    {
        $this->requirePermission('transaksi-lab-update');

        $model = Laboratorium::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Laboratorium tidak ditemukan');
        }

        if (!in_array($model->status, [Laboratorium::STATUS_ORDERED, Laboratorium::STATUS_SAMPLE_COLLECTED])) {
            throw new \yii\web\BadRequestHttpException('Laboratorium tidak dapat diperbarui pada status saat ini');
        }

        $oldData = $model->toArray();
        $data = Yii::$app->request->getBodyParams();

        $model->catatan = $data['catatan'] ?? $model->catatan;

        if ($model->save()) {
            Yii::$app->auditLogger->logUpdate('Laboratorium', $model->id, $oldData, $model->toArray());
            return $model;
        }

        throw new \yii\web\UnprocessableEntityHttpException(json_encode($model->errors));
    }

    public function actionDelete(string $id): array
    {
        $this->requirePermission('transaksi-lab-delete');

        $model = Laboratorium::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Laboratorium tidak ditemukan');
        }

        if (!in_array($model->status, [Laboratorium::STATUS_ORDERED, Laboratorium::STATUS_CANCELLED])) {
            throw new \yii\web\BadRequestHttpException('Laboratorium tidak dapat dihapus pada status saat ini');
        }

        $model->status = Laboratorium::STATUS_CANCELLED;
        $model->save(false, ['status']);

        Yii::$app->auditLogger->logUpdate('Laboratorium', $model->id, $model->toArray(), ['status' => Laboratorium::STATUS_CANCELLED]);

        return ['success' => true, 'message' => 'Permintaan laboratorium berhasil dibatalkan'];
    }

    public function actionCollectSample(string $id): array
    {
        $this->requirePermission('transaksi-lab-collect');

        $model = Laboratorium::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Laboratorium tidak ditemukan');
        }

        if ($model->status !== Laboratorium::STATUS_ORDERED) {
            throw new \yii\web\BadRequestHttpException('Laboratorium tidak berstatus dipesan');
        }

        $data = Yii::$app->request->getBodyParams();

        $model->status = Laboratorium::STATUS_SAMPLE_COLLECTED;
        $model->petugas_id = Yii::$app->user->id ?? null;
        $model->collected_at = date('Y-m-d H:i:s');
        $model->sample_condition = $data['sample_condition'] ?? '';
        $model->save(false, ['status', 'petugas_id', 'collected_at', 'sample_condition']);

        return ['success' => true, 'message' => 'Sampel berhasil diambil', 'data' => $model];
    }

    public function actionStartProcess(string $id): array
    {
        $this->requirePermission('transaksi-lab-process');

        $model = Laboratorium::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Laboratorium tidak ditemukan');
        }

        if (!in_array($model->status, [Laboratorium::STATUS_ORDERED, Laboratorium::STATUS_SAMPLE_COLLECTED])) {
            throw new \yii\web\BadRequestHttpException('Laboratorium tidak berstatus valid untuk diproses');
        }

        $model->status = Laboratorium::STATUS_IN_PROGRESS;
        $model->petugas_id = Yii::$app->user->id ?? null;
        $model->started_at = date('Y-m-d H:i:s');
        $model->save(false, ['status', 'petugas_id', 'started_at']);

        return ['success' => true, 'message' => 'Proses pemeriksaan berhasil dimulai', 'data' => $model];
    }

    public function actionComplete(string $id): array
    {
        $this->requirePermission('transaksi-lab-process');

        $model = Laboratorium::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Laboratorium tidak ditemukan');
        }

        if ($model->status !== Laboratorium::STATUS_IN_PROGRESS) {
            throw new \yii\web\BadRequestHttpException('Laboratorium tidak berstatus dalam proses');
        }

        $data = Yii::$app->request->getBodyParams();

        $model->status = Laboratorium::STATUS_COMPLETED;
        $model->result = $data['result'] ?? '';
        $model->interpretation = $data['interpretation'] ?? '';
        $model->petugas_id = Yii::$app->user->id ?? null;
        $model->completed_at = date('Y-m-d H:i:s');
        $model->save(false, ['status', 'result', 'interpretation', 'petugas_id', 'completed_at']);

        return ['success' => true, 'message' => 'Pemeriksaan laboratorium berhasil diselesaikan', 'data' => $model];
    }

    public function actionVerify(string $id): array
    {
        $this->requirePermission('transaksi-lab-verify');

        $model = Laboratorium::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Laboratorium tidak ditemukan');
        }

        if ($model->status !== Laboratorium::STATUS_COMPLETED) {
            throw new \yii\web\BadRequestHttpException('Hanya pemeriksaan laboratorium selesai yang dapat diverifikasi');
        }

        $model->status = Laboratorium::STATUS_VERIFIED;
        $model->verifikator_id = Yii::$app->user->id ?? null;
        $model->verified_at = date('Y-m-d H:i:s');
        $model->save(false, ['status', 'verifikator_id', 'verified_at']);

        return ['success' => true, 'message' => 'Hasil laboratorium berhasil diverifikasi', 'data' => $model];
    }

    public function actionReject(string $id): array
    {
        $this->requirePermission('transaksi-lab-process');

        $model = Laboratorium::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Laboratorium tidak ditemukan');
        }

        if (!in_array($model->status, [Laboratorium::STATUS_ORDERED, Laboratorium::STATUS_SAMPLE_COLLECTED, Laboratorium::STATUS_IN_PROGRESS])) {
            throw new \yii\web\BadRequestHttpException('Status tidak valid untuk penolakan');
        }

        $data = Yii::$app->request->getBodyParams();

        $model->status = Laboratorium::STATUS_REJECTED;
        $model->result = $data['reason'] ?? 'Ditolak';
        $model->save(false, ['status', 'result']);

        return ['success' => true, 'message' => 'Hasil laboratorium ditolak', 'data' => $model];
    }

    public function actionByKunjungan(string $kunjunganId): ActiveDataProvider
    {
        $this->requirePermission('transaksi-lab-view');

        $kunjungan = Kunjungan::findActive()->where(['id' => $kunjunganId])->one();
        if (!$kunjungan) {
            throw new NotFoundHttpException('Kunjungan tidak ditemukan');
        }

        $query = Laboratorium::findActive()
            ->where(['kunjungan_id' => $kunjunganId])
            ->with(['jenisPemeriksaan', 'dokter.user.profile', 'pemeriksaan', 'petugas', 'verifikator']);

        return new ActiveDataProvider([
            'query' => $query,
            'pagination' => [
                'pageSize' => Yii::$app->params['pagination.pageSize'],
            ],
        ]);
    }

    public function actionJenisPemeriksaan(): ActiveDataProvider
    {
        $this->requirePermission('transaksi-lab-view');

        $query = JenisPemeriksaanLab::findActive()->with(['category']);

        $params = Yii::$app->request->queryParams;

        if (!empty($params['category_id'])) {
            $query->andWhere(['category_id' => $params['category_id']]);
        }

        if (!empty($params['type'])) {
            $query->andWhere(['type' => $params['type']]);
        }

        if (!empty($params['search'])) {
            $query->andWhere(['or',
                ['like', 'kode', $params['search']],
                ['like', 'nama', $params['search']],
            ]);
        }

        return new ActiveDataProvider([
            'query' => $query,
            'pagination' => [
                'pageSize' => Yii::$app->params['pagination.pageSize'],
            ],
            'sort' => [
                'defaultOrder' => ['kode' => SORT_ASC],
            ],
        ]);
    }
}
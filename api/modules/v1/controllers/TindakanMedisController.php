<?php

namespace api\modules\v1\controllers;

use Yii;
use yii\data\ActiveDataProvider;
use yii\web\NotFoundHttpException;
use common\models\TindakanMedis;
use common\models\Tindakan;
use common\models\Kunjungan;
use common\models\Pemeriksaan;

class TindakanMedisController extends BaseController
{
    public $modelClass = TindakanMedis::class;

    public function actions(): array
    {
        $actions = parent::actions();
        unset($actions['create'], $actions['update'], $actions['delete']);
        return $actions;
    }

    public function actionIndex(): ActiveDataProvider
    {
        $this->requirePermission('transaksi-tindakan-view');

        $query = TindakanMedis::findActive()->with(['kunjungan.pasien.user.profile', 'tindakan', 'dokter', 'pemeriksaan']);

        $params = Yii::$app->request->queryParams;

        if (!empty($params['kunjungan_id'])) {
            $query->andWhere(['kunjungan_id' => $params['kunjungan_id']]);
        }

        if (!empty($params['pemeriksaan_id'])) {
            $query->andWhere(['pemeriksaan_id' => $params['pemeriksaan_id']]);
        }

        if (!empty($params['tindakan_id'])) {
            $query->andWhere(['tindakan_id' => $params['tindakan_id']]);
        }

        if (!empty($params['dokter_id'])) {
            $query->andWhere(['dokter_id' => $params['dokter_id']]);
        }

        if (!empty($params['status'])) {
            $query->andWhere(['status' => $params['status']]);
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

    public function actionView(string $id): TindakanMedis
    {
        $this->requirePermission('transaksi-tindakan-view');

        $model = TindakanMedis::findActive()
            ->with([
                'kunjungan.pasien.user.profile',
                'tindakan.category',
                'dokter.user.profile',
                'pemeriksaan',
                'petugas.user.profile',
            ])
            ->where(['id' => $id])
            ->one();

        if (!$model) {
            throw new NotFoundHttpException('Tindakan medis tidak ditemukan');
        }
        return $model;
    }

    public function actionCreate(): TindakanMedis
    {
        $this->requirePermission('transaksi-tindakan-create');

        $data = Yii::$app->request->getBodyParams();

        $required = ['kunjungan_id', 'tindakan_id', 'dokter_id'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new \yii\web\BadRequestHttpException("Kolom '$field' wajib diisi");
            }
        }

        $kunjungan = Kunjungan::findActive()->where(['id' => $data['kunjungan_id']])->one();
        if (!$kunjungan) {
            throw new NotFoundHttpException('Kunjungan tidak ditemukan');
        }

        $tindakan = Tindakan::findActive()->where(['id' => $data['tindakan_id']])->one();
        if (!$tindakan) {
            throw new NotFoundHttpException('Tindakan tidak ditemukan');
        }

        $dokter = \common\models\Dokter::findActive()->where(['id' => $data['dokter_id']])->one();
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

        $kelas = $data['kelas'] ?? TindakanTarif::KELAS_UMUM;
        $pembayaranType = $data['pembayaran_type'] ?? TindakanTarif::TYPE_UMUM;

        $tarif = \common\models\TindakanTarif::findActive()
            ->where([
                'tindakan_id' => $tindakan->id,
                'kelas' => $kelas,
                'pembayaran_type' => $pembayaranType,
            ])
            ->one();

        $harga = $tarif ? $tarif->tarif : 0;
        $hargaDokter = $tarif ? $tarif->tarif_dokter : 0;
        $hargaPetugas = $tarif ? $tarif->tarif_petugas : 0;
        $hargaAlat = $tarif ? $tarif->tarif_alat : 0;
        $hargaBhp = $tarif ? $tarif->tarif_bhp : 0;
        $hargaLain = $tarif ? $tarif->tarif_lain : 0;

        $model = new TindakanMedis();
        $model->id = \Ramsey\Uuid\Uuid::uuid4()->toString();
        $model->kunjungan_id = $kunjungan->id;
        $model->pemeriksaan_id = $pemeriksaanId;
        $model->tindakan_id = $tindakan->id;
        $model->dokter_id = $dokter->id;
        $model->kelas = $kelas;
        $model->pembayaran_type = $pembayaranType;
        $model->harga = $harga;
        $model->harga_dokter = $hargaDokter;
        $model->harga_petugas = $hargaPetugas;
        $model->harga_alat = $hargaAlat;
        $model->harga_bhp = $hargaBhp;
        $model->harga_lain = $hargaLain;
        $model->qty = $data['qty'] ?? 1;
        $model->total = $harga * ($data['qty'] ?? 1);
        $model->catatan = $data['catatan'] ?? '';
        $model->status = TindakanMedis::STATUS_ORDERED;
        $model->save(false);

        Yii::$app->auditLogger->logCreate('TindakanMedis', $model->id, $model->toArray());

        return $model;
    }

    public function actionUpdate(string $id): TindakanMedis
    {
        $this->requirePermission('transaksi-tindakan-update');

        $model = TindakanMedis::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Tindakan medis tidak ditemukan');
        }

        if (!in_array($model->status, [TindakanMedis::STATUS_ORDERED, TindakanMedis::STATUS_IN_PROGRESS])) {
            throw new \yii\web\BadRequestHttpException('Tindakan tidak dapat diperbarui pada status saat ini');
        }

        $oldData = $model->toArray();
        $data = Yii::$app->request->getBodyParams();

        $model->pemeriksaan_id = $data['pemeriksaan_id'] ?? $model->pemeriksaan_id;
        $model->catatan = $data['catatan'] ?? $model->catatan;

        if ($model->save()) {
            Yii::$app->auditLogger->logUpdate('TindakanMedis', $model->id, $oldData, $model->toArray());
            return $model;
        }

        throw new \yii\web\UnprocessableEntityHttpException(json_encode($model->errors));
    }

    public function actionDelete(string $id): array
    {
        $this->requirePermission('transaksi-tindakan-delete');

        $model = TindakanMedis::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Tindakan medis tidak ditemukan');
        }

        if (!in_array($model->status, [TindakanMedis::STATUS_ORDERED, TindakanMedis::STATUS_CANCELLED])) {
            throw new \yii\web\BadRequestHttpException('Tindakan tidak dapat dihapus pada status saat ini');
        }

        $model->status = TindakanMedis::STATUS_CANCELLED;
        $model->save(false, ['status']);

        Yii::$app->auditLogger->logUpdate('TindakanMedis', $model->id, $model->toArray(), ['status' => TindakanMedis::STATUS_CANCELLED]);

        return ['success' => true, 'message' => 'Tindakan berhasil dibatalkan'];
    }

    public function actionStart(string $id): array
    {
        $this->requirePermission('transaksi-tindakan-start');

        $model = TindakanMedis::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Tindakan medis tidak ditemukan');
        }

        if ($model->status !== TindakanMedis::STATUS_ORDERED) {
            throw new \yii\web\BadRequestHttpException('Tindakan tidak berstatus dipesan');
        }

        $model->status = TindakanMedis::STATUS_IN_PROGRESS;
        $model->started_at = date('Y-m-d H:i:s');
        $model->petugas_id = Yii::$app->user->id ?? null;
        $model->save(false, ['status', 'started_at', 'petugas_id']);

        return ['success' => true, 'message' => 'Tindakan berhasil dimulai', 'data' => $model];
    }

    public function actionComplete(string $id): array
    {
        $this->requirePermission('transaksi-tindakan-complete');

        $model = TindakanMedis::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Tindakan medis tidak ditemukan');
        }

        if ($model->status !== TindakanMedis::STATUS_IN_PROGRESS) {
            throw new \yii\web\BadRequestHttpException('Tindakan tidak berstatus dalam proses');
        }

        $model->status = TindakanMedis::STATUS_COMPLETED;
        $model->completed_at = date('Y-m-d H:i:s');
        $model->save(false, ['status', 'completed_at']);

        return ['success' => true, 'message' => 'Tindakan berhasil diselesaikan', 'data' => $model];
    }

    public function actionByKunjungan(string $kunjunganId): ActiveDataProvider
    {
        $this->requirePermission('transaksi-tindakan-view');

        $kunjungan = Kunjungan::findActive()->where(['id' => $kunjunganId])->one();
        if (!$kunjungan) {
            throw new NotFoundHttpException('Kunjungan tidak ditemukan');
        }

        $query = TindakanMedis::findActive()
            ->where(['kunjungan_id' => $kunjunganId])
            ->with(['tindakan', 'dokter.user.profile', 'pemeriksaan']);

        return new ActiveDataProvider([
            'query' => $query,
            'pagination' => [
                'pageSize' => Yii::$app->params['pagination.pageSize'],
            ],
            'sort' => [
                'defaultOrder' => ['created_at' => SORT_ASC],
            ],
        ]);
    }
}
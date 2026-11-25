<?php

namespace api\modules\v1\controllers;

use Yii;
use yii\data\ActiveDataProvider;
use yii\web\NotFoundHttpException;
use common\models\Antrean;
use common\models\Kunjungan;
use common\models\Poli;

class AntreanController extends BaseController
{
    public $modelClass = Antrean::class;

    public function actions(): array
    {
        $actions = parent::actions();
        unset($actions['create'], $actions['update'], $actions['delete']);
        return $actions;
    }

    public function actionIndex(): ActiveDataProvider
    {
        $this->requirePermission('transaksi-antrean-view');

        $query = Antrean::findActive()->with(['kunjungan.pasien.user.profile', 'poli']);

        $params = Yii::$app->request->queryParams;

        if (!empty($params['poli_id'])) {
            $query->andWhere(['poli_id' => $params['poli_id']]);
        }

        if (!empty($params['tanggal'])) {
            $query->andWhere(['tanggal' => $params['tanggal']]);
        } elseif (!empty($params['tanggal_from']) && !empty($params['tanggal_to'])) {
            $query->andWhere(['between', 'tanggal', $params['tanggal_from'], $params['tanggal_to']]);
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
                'defaultOrder' => ['tanggal' => SORT_DESC, 'no_antrean' => SORT_ASC],
            ],
        ]);
    }

    public function actionView(string $id): Antrean
    {
        $this->requirePermission('transaksi-antrean-view');

        $model = Antrean::findActive()
            ->with(['kunjungan.pasien.user.profile', 'kunjungan.poli', 'kunjungan.dokter', 'poli'])
            ->where(['id' => $id])
            ->one();

        if (!$model) {
            throw new NotFoundHttpException('Antrean tidak ditemukan');
        }
        return $model;
    }

    public function actionQueue(string $poliId, string $date = null): array
    {
        $this->requirePermission('transaksi-antrean-view');

        $poli = Poli::findActive()->where(['id' => $poliId])->one();
        if (!$poli) {
            throw new NotFoundHttpException('Poli tidak ditemukan');
        }

        $date = $date ?? date('Y-m-d');

        $queue = Antrean::getQueueStatus($poliId, $date);

        return [
            'success' => true,
            'data' => $queue,
        ];
    }

    public function actionCall(string $id): array
    {
        $this->requirePermission('transaksi-antrean-call');

        $model = Antrean::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Antrean tidak ditemukan');
        }

        if (!$model->call()) {
            throw new \yii\web\BadRequestHttpException('Pasien tidak dapat dipanggil pada status saat ini');
        }

        if ($model->kunjungan) {
            $model->kunjungan->callPatient();
        }

        return ['success' => true, 'message' => 'Pasien berhasil dipanggil', 'data' => $model];
    }

    public function actionRecall(string $id): array
    {
        $this->requirePermission('transaksi-antrean-call');

        $model = Antrean::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Antrean tidak ditemukan');
        }

        if (!$model->recall()) {
            throw new \yii\web\BadRequestHttpException('Pasien tidak dapat dipanggil ulang pada status saat ini');
        }

        return ['success' => true, 'message' => 'Pasien berhasil dipanggil ulang', 'data' => $model];
    }

    public function actionSkip(string $id): array
    {
        $this->requirePermission('transaksi-antrean-skip');

        $model = Antrean::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Antrean tidak ditemukan');
        }

        $reason = Yii::$app->request->post('reason', 'Dilewati oleh petugas');

        if (!$model->skip($reason)) {
            throw new \yii\web\BadRequestHttpException('Pasien tidak dapat dilewati pada status saat ini');
        }

        if ($model->kunjungan) {
            $model->kunjungan->status = Kunjungan::STATUS_SKIPPED;
            $model->kunjungan->save(false, ['status']);
        }

        return ['success' => true, 'message' => 'Pasien berhasil dilewati', 'data' => $model];
    }

    public function actionComplete(string $id): array
    {
        $this->requirePermission('transaksi-antrean-complete');

        $model = Antrean::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Antrean tidak ditemukan');
        }

        if (!$model->complete()) {
            throw new \yii\web\BadRequestHttpException('Antrean tidak dapat diselesaikan pada status saat ini');
        }

        if ($model->kunjungan) {
            $model->kunjungan->complete();
        }

        return ['success' => true, 'message' => 'Antrean berhasil diselesaikan', 'data' => $model];
    }

    public function actionCancel(string $id): array
    {
        $this->requirePermission('transaksi-antrean-cancel');

        $model = Antrean::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Antrean tidak ditemukan');
        }

        $reason = Yii::$app->request->post('reason', 'Dibatalkan');

        if (!$model->cancel($reason)) {
            throw new \yii\web\BadRequestHttpException('Antrean tidak dapat dibatalkan pada status saat ini');
        }

        if ($model->kunjungan) {
            $model->kunjungan->cancel($reason);
        }

        return ['success' => true, 'message' => 'Antrean berhasil dibatalkan', 'data' => $model];
    }

    public function actionResetQueue(string $poliId, string $date = null): array
    {
        $this->requirePermission('transaksi-antrean-reset');

        $poli = Poli::findActive()->where(['id' => $poliId])->one();
        if (!$poli) {
            throw new NotFoundHttpException('Poli tidak ditemukan');
        }

        $date = $date ?? date('Y-m-d');

        $transaction = Yii::$app->db->beginTransaction();
        try {
            $antreans = Antrean::findActive()
                ->where(['poli_id' => $poliId, 'tanggal' => $date])
                ->andWhere(['in', 'status', [Antrean::STATUS_WAITING, Antrean::STATUS_CALLED, Antrean::STATUS_IN_PROGRESS]])
                ->all();

            foreach ($antreans as $antrean) {
                $antrean->status = Antrean::STATUS_CANCELLED;
                $antrean->notes = ($antrean->notes ? $antrean->notes . "\n" : '') . "Reset antrean pada " . date('Y-m-d H:i:s');
                $antrean->save(false, ['status', 'notes']);

                if ($antrean->kunjungan) {
                    $antrean->kunjungan->status = Kunjungan::STATUS_CANCELLED;
                    $antrean->kunjungan->cancel('Antrean direset oleh petugas');
                }
            }

            $transaction->commit();

            return ['success' => true, 'message' => 'Antrean berhasil direset', 'cancelled_count' => count($antreans)];
        } catch (\Throwable $e) {
            $transaction->rollBack();
            throw new \yii\web\ServerKesalahanHttpException($e->getMessage());
        }
    }

    public function actionCurrentNumber(string $poliId, string $date = null): array
    {
        $this->requirePermission('transaksi-antrean-view');

        $poli = Poli::findActive()->where(['id' => $poliId])->one();
        if (!$poli) {
            throw new NotFoundHttpException('Poli tidak ditemukan');
        }

        $date = $date ?? date('Y-m-d');

        $current = Antrean::getCurrentQueue($poliId, $date);
        $waitingCount = Antrean::getWaitingCount($poliId, $date);
        $lastNumber = Antrean::findActive()
            ->where(['poli_id' => $poliId, 'tanggal' => $date])
            ->max('no_antrean');

        return [
            'success' => true,
            'data' => [
                'poli_id' => $poliId,
                'poli_nama' => $poli->nama,
                'tanggal' => $date,
                'current' => $current,
                'waiting_count' => $waitingCount,
                'last_number' => $lastNumber ?? 0,
            ],
        ];
    }

    public function actionDisplay(string $poliId, string $date = null): array
    {
        $this->requirePermission('transaksi-antrean-view');

        $poli = Poli::findActive()->where(['id' => $poliId])->one();
        if (!$poli) {
            throw new NotFoundHttpException('Poli tidak ditemukan');
        }

        $date = $date ?? date('Y-m-d');

        $current = Antrean::getCurrentQueue($poliId, $date);
        $nextQueue = Antrean::findActive()
            ->where(['poli_id' => $poliId, 'tanggal' => $date, 'status' => Antrean::STATUS_WAITING])
            ->orderBy(['no_antrean' => SORT_ASC])
            ->limit(5)
            ->with(['kunjungan.pasien.user.profile'])
            ->all();

        return [
            'success' => true,
            'data' => [
                'poli' => ['id' => $poli->id, 'nama' => $poli->nama, 'kode' => $poli->kode],
                'tanggal' => $date,
                'current' => $current,
                'next_queue' => $nextQueue,
                'display_time' => date('Y-m-d H:i:s'),
            ],
        ];
    }
}
<?php

namespace api\modules\v1\controllers;

use Yii;
use yii\data\ActiveDataProvider;
use yii\web\NotFoundHttpException;
use common\models\JadwalPraktik;
use common\models\Dokter;
use common\models\Poli;

class JadwalController extends BaseController
{
    public $modelClass = JadwalPraktik::class;

    public function actions(): array
    {
        $actions = parent::actions();
        unset($actions['create'], $actions['update'], $actions['delete']);
        return $actions;
    }

    public function actionIndex(): ActiveDataProvider
    {
        $this->requirePermission('master-jadwal-view');

        $query = JadwalPraktik::findActive()->with(['dokter.user.profile', 'poli']);

        $params = Yii::$app->request->queryParams;

        if (!empty($params['dokter_id'])) {
            $query->andWhere(['dokter_id' => $params['dokter_id']]);
        }

        if (!empty($params['poli_id'])) {
            $query->andWhere(['poli_id' => $params['poli_id']]);
        }

        if (!empty($params['day_of_week'])) {
            $query->andWhere(['day_of_week' => $params['day_of_week']]);
        }

        if (!empty($params['is_active'])) {
            $query->andWhere(['is_active' => $params['is_active']]);
        }

        if (!empty($params['date'])) {
            $date = $params['date'];
            $query->andWhere(['<=', 'effective_from', $date])
                ->andWhere(['or', ['effective_until' => null], ['>=', 'effective_until', $date]]);
        }

        return new ActiveDataProvider([
            'query' => $query,
            'pagination' => [
                'pageSize' => Yii::$app->params['pagination.pageSize'],
            ],
            'sort' => [
                'defaultOrder' => ['day_of_week' => SORT_ASC, 'start_time' => SORT_ASC],
            ],
        ]);
    }

    public function actionView(string $id): JadwalPraktik
    {
        $this->requirePermission('master-jadwal-view');

        $model = JadwalPraktik::findActive()
            ->with(['dokter.user.profile', 'dokter.specialist', 'poli'])
            ->where(['id' => $id])
            ->one();

        if (!$model) {
            throw new NotFoundHttpException('Jadwal tidak ditemukan');
        }
        return $model;
    }

    public function actionCreate(): JadwalPraktik
    {
        $this->requirePermission('master-jadwal-create');

        $data = Yii::$app->request->getBodyParams();

        $required = ['dokter_id', 'poli_id', 'day_of_week', 'start_time', 'end_time'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new \yii\web\BadRequestHttpException("Kolom '$field' wajib diisi");
            }
        }

        $dokter = Dokter::findActive()->where(['id' => $data['dokter_id']])->one();
        if (!$dokter) {
            throw new NotFoundHttpException('Dokter tidak ditemukan');
        }

        $poli = Poli::findActive()->where(['id' => $data['poli_id']])->one();
        if (!$poli) {
            throw new NotFoundHttpException('Poli tidak ditemukan');
        }

        $dayOfWeek = (int) $data['day_of_week'];
        if ($dayOfWeek < 0 || $dayOfWeek > 6) {
            throw new \yii\web\BadRequestHttpException('Hari dalam minggu tidak valid (0-6)');
        }

        if ($data['start_time'] >= $data['end_time']) {
            throw new \yii\web\BadRequestHttpException('Waktu mulai harus sebelum waktu selesai');
        }

        $quota = $data['quota'] ?? 20;
        if ($quota < 1 || $quota > 100) {
            throw new \yii\web\BadRequestHttpException('Kuota harus antara 1 dan 100');
        }

        $effectiveFrom = $data['effective_from'] ?? date('Y-m-d');
        $effectiveUntil = $data['effective_until'] ?? null;

        if ($effectiveUntil && $effectiveUntil < $effectiveFrom) {
            throw new \yii\web\BadRequestHttpException('Tanggal akhir berlaku harus setelah tanggal mulai berlaku');
        }

        $model = new JadwalPraktik();
        $model->id = \Ramsey\Uuid\Uuid::uuid4()->toString();
        $model->dokter_id = $data['dokter_id'];
        $model->poli_id = $data['poli_id'];
        $model->day_of_week = $dayOfWeek;
        $model->start_time = $data['start_time'];
        $model->end_time = $data['end_time'];
        $model->quota = $quota;
        $model->effective_from = $effectiveFrom;
        $model->effective_until = $effectiveUntil;
        $model->is_active = $data['is_active'] ?? true;
        $model->save(false);

        Yii::$app->auditLogger->logCreate('JadwalPraktik', $model->id, $model->toArray());

        return $model;
    }

    public function actionUpdate(string $id): JadwalPraktik
    {
        $this->requirePermission('master-jadwal-update');

        $model = JadwalPraktik::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Jadwal tidak ditemukan');
        }

        $oldData = $model->toArray();
        $data = Yii::$app->request->getBodyParams();

        if (!empty($data['dokter_id'])) {
            $dokter = Dokter::findActive()->where(['id' => $data['dokter_id']])->one();
            if (!$dokter) {
                throw new NotFoundHttpException('Dokter tidak ditemukan');
            }
            $model->dokter_id = $data['dokter_id'];
        }

        if (!empty($data['poli_id'])) {
            $poli = Poli::findActive()->where(['id' => $data['poli_id']])->one();
            if (!$poli) {
                throw new NotFoundHttpException('Poli tidak ditemukan');
            }
            $model->poli_id = $data['poli_id'];
        }

        if (isset($data['day_of_week'])) {
            $dayOfWeek = (int) $data['day_of_week'];
            if ($dayOfWeek < 0 || $dayOfWeek > 6) {
                throw new \yii\web\BadRequestHttpException('Hari dalam minggu tidak valid (0-6)');
            }
            $model->day_of_week = $dayOfWeek;
        }

        if (!empty($data['start_time'])) {
            $model->start_time = $data['start_time'];
        }

        if (!empty($data['end_time'])) {
            $model->end_time = $data['end_time'];
        }

        if ($model->start_time >= $model->end_time) {
            throw new \yii\web\BadRequestHttpException('Waktu mulai harus sebelum waktu selesai');
        }

        if (isset($data['quota'])) {
            $quota = (int) $data['quota'];
            if ($quota < 1 || $quota > 100) {
                throw new \yii\web\BadRequestHttpException('Kuota harus antara 1 dan 100');
            }
            $model->quota = $quota;
        }

        if (!empty($data['effective_from'])) {
            $model->effective_from = $data['effective_from'];
        }

        if (isset($data['effective_until'])) {
            $model->effective_until = $data['effective_until'] ?: null;
        }

        if ($model->effective_until && $model->effective_until < $model->effective_from) {
            throw new \yii\web\BadRequestHttpException('Tanggal akhir berlaku harus setelah tanggal mulai berlaku');
        }

        $model->is_active = $data['is_active'] ?? $model->is_active;

        if ($model->save()) {
            Yii::$app->auditLogger->logUpdate('JadwalPraktik', $model->id, $oldData, $model->toArray());
            return $model;
        }

        throw new \yii\web\UnprocessableEntityHttpException(json_encode($model->errors));
    }

    public function actionDelete(string $id): array
    {
        $this->requirePermission('master-jadwal-delete');

        $model = JadwalPraktik::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Jadwal tidak ditemukan');
        }

        $bookedCount = \common\models\Kunjungan::find()
            ->where([
                'dokter_id' => $model->dokter_id,
                'poli_id' => $model->poli_id,
                'jadwal_id' => $id,
            ])
            ->andWhere(['in', 'status', [\common\models\Kunjungan::STATUS_WAITING, \common\models\Kunjungan::STATUS_IN_PROGRESS]])
            ->count();

        if ($bookedCount > 0) {
            throw new \yii\web\BadRequestHttpException('Jadwal dengan pendaftaran aktif tidak dapat dihapus');
        }

        $model->is_deleted = true;
        $model->deleted_at = date('Y-m-d H:i:s');
        $model->save(false, ['is_deleted', 'deleted_at']);

        Yii::$app->auditLogger->logDelete('JadwalPraktik', $id, $model->toArray());

        return ['success' => true, 'message' => 'Jadwal berhasil dihapus'];
    }

    public function actionBulkCreate(): array
    {
        $this->requirePermission('master-jadwal-create');

        $data = Yii::$app->request->getBodyParams();

        if (!isset($data['schedules']) || !is_array($data['schedules'])) {
            throw new \yii\web\BadRequestHttpException('Array jadwal wajib diisi');
        }

        $created = [];
        $errors = [];

        $transaction = Yii::$app->db->beginTransaction();
        try {
            foreach ($data['schedules'] as $index => $scheduleData) {
                $required = ['dokter_id', 'poli_id', 'day_of_week', 'start_time', 'end_time'];
                foreach ($required as $field) {
                    if (empty($scheduleData[$field])) {
                        $errors[] = "Schedule $index: Kolom '$field' wajib diisi";
                        continue 2;
                    }
                }

                $dokter = Dokter::findActive()->where(['id' => $scheduleData['dokter_id']])->one();
                if (!$dokter) {
                    $errors[] = "Schedule $index: Dokter tidak ditemukan";
                    continue;
                }

                $poli = Poli::findActive()->where(['id' => $scheduleData['poli_id']])->one();
                if (!$poli) {
                    $errors[] = "Schedule $index: Poli tidak ditemukan";
                    continue;
                }

                $dayOfWeek = (int) $scheduleData['day_of_week'];
                if ($dayOfWeek < 0 || $dayOfWeek > 6) {
                    $errors[] = "Schedule $index: Invalid day_of_week";
                    continue;
                }

                if ($scheduleData['start_time'] >= $scheduleData['end_time']) {
                    $errors[] = "Schedule $index: Waktu mulai harus sebelum waktu selesai";
                    continue;
                }

                $model = new JadwalPraktik();
                $model->id = \Ramsey\Uuid\Uuid::uuid4()->toString();
                $model->dokter_id = $scheduleData['dokter_id'];
                $model->poli_id = $scheduleData['poli_id'];
                $model->day_of_week = $dayOfWeek;
                $model->start_time = $scheduleData['start_time'];
                $model->end_time = $scheduleData['end_time'];
                $model->quota = $scheduleData['quota'] ?? 20;
                $model->effective_from = $scheduleData['effective_from'] ?? date('Y-m-d');
                $model->effective_until = $scheduleData['effective_until'] ?? null;
                $model->is_active = $scheduleData['is_active'] ?? true;

                if (!$model->save()) {
                    $errors[] = "Schedule $index: " . json_encode($model->errors);
                    continue;
                }

                $created[] = $model;
            }

            if (!empty($errors)) {
                $transaction->rollBack();
                return ['success' => false, 'errors' => $errors];
            }

            $transaction->commit();

            foreach ($created as $model) {
                Yii::$app->auditLogger->logCreate('JadwalPraktik', $model->id, $model->toArray());
            }

            return ['success' => true, 'created' => count($created), 'data' => $created];
        } catch (\Throwable $e) {
            $transaction->rollBack();
            throw new \yii\web\ServerKesalahanHttpException($e->getMessage());
        }
    }
}
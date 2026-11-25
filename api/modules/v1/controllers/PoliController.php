<?php

namespace api\modules\v1\controllers;

use Yii;
use yii\data\ActiveDataProvider;
use yii\web\NotFoundHttpException;
use common\models\Poli;
use common\models\Dokter;
use common\models\JadwalPraktik;

class PoliController extends BaseController
{
    public $modelClass = Poli::class;

    public function actions(): array
    {
        $actions = parent::actions();
        unset($actions['create'], $actions['update'], $actions['delete']);
        return $actions;
    }

    public function actionIndex(): ActiveDataProvider
    {
        $this->requirePermission('master-poli-view');

        $query = Poli::findActive()->with(['parent', 'children', 'dokter']);

        $params = Yii::$app->request->queryParams;

        if (!empty($params['type'])) {
            $query->andWhere(['type' => $params['type']]);
        }

        if (!empty($params['parent_id'])) {
            $query->andWhere(['parent_id' => $params['parent_id']]);
        } elseif (!empty($params['root_only'])) {
            $query->andWhere(['parent_id' => null]);
        }

        if (!empty($params['is_active'])) {
            $query->andWhere(['is_active' => $params['is_active']]);
        }

        return new ActiveDataProvider([
            'query' => $query,
            'pagination' => [
                'pageSize' => Yii::$app->params['pagination.pageSize'],
            ],
            'sort' => [
                'defaultOrder' => ['sort_order' => SORT_ASC, 'nama' => SORT_ASC],
            ],
        ]);
    }

    public function actionView(string $id): Poli
    {
        $this->requirePermission('master-poli-view');

        $model = Poli::findActive()
            ->with(['parent', 'children', 'dokter', 'jadwalPraktik.dokter.user.profile'])
            ->where(['id' => $id])
            ->one();

        if (!$model) {
            throw new NotFoundHttpException('Poli tidak ditemukan');
        }
        return $model;
    }

    public function actionCreate(): Poli
    {
        $this->requirePermission('master-poli-create');

        $data = Yii::$app->request->getBodyParams();

        $required = ['kode', 'nama', 'type'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new \yii\web\BadRequestHttpException("Kolom '$field' wajib diisi");
            }
        }

        if (Poli::findActive()->where(['kode' => $data['kode']])->exists()) {
            throw new \yii\web\BadRequestHttpException('Kode poli sudah digunakan');
        }

        $model = new Poli();
        $model->id = \Ramsey\Uuid\Uuid::uuid4()->toString();
        $model->kode = $data['kode'];
        $model->nama = $data['nama'];
        $model->type = $data['type'];
        $model->parent_id = $data['parent_id'] ?? null;
        $model->description = $data['description'] ?? null;
        $model->location = $data['location'] ?? null;
        $model->registration_fee = $data['registration_fee'] ?? 0;
        $model->sort_order = $data['sort_order'] ?? 0;
        $model->is_active = $data['is_active'] ?? true;
        $model->save(false);

        Yii::$app->auditLogger->logCreate('Poli', $model->id, $model->toArray());

        return $model;
    }

    public function actionUpdate(string $id): Poli
    {
        $this->requirePermission('master-poli-update');

        $model = Poli::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Poli tidak ditemukan');
        }

        $oldData = $model->toArray();
        $data = Yii::$app->request->getBodyParams();

        if (!empty($data['kode']) && $data['kode'] !== $model->kode) {
            if (Poli::findActive()->where(['kode' => $data['kode']])->exists()) {
                throw new \yii\web\BadRequestHttpException('Kode poli sudah digunakan');
            }
            $model->kode = $data['kode'];
        }

        $model->nama = $data['nama'] ?? $model->nama;
        $model->type = $data['type'] ?? $model->type;
        $model->parent_id = $data['parent_id'] ?? $model->parent_id;
        $model->description = $data['description'] ?? $model->description;
        $model->location = $data['location'] ?? $model->location;
        $model->registration_fee = $data['registration_fee'] ?? $model->registration_fee;
        $model->sort_order = $data['sort_order'] ?? $model->sort_order;
        $model->is_active = $data['is_active'] ?? $model->is_active;

        if ($model->save()) {
            Yii::$app->auditLogger->logUpdate('Poli', $model->id, $oldData, $model->toArray());
            return $model;
        }

        throw new \yii\web\UnprocessableEntityHttpException(json_encode($model->errors));
    }

    public function actionDelete(string $id): array
    {
        $this->requirePermission('master-poli-delete');

        $model = Poli::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Poli tidak ditemukan');
        }

        if ($model->children->count() > 0) {
            throw new \yii\web\BadRequestHttpException('Poli dengan subpoli tidak dapat dihapus');
        }

        $model->is_deleted = true;
        $model->deleted_at = date('Y-m-d H:i:s');
        $model->save(false, ['is_deleted', 'deleted_at']);

        Yii::$app->auditLogger->logDelete('Poli', $id, $model->toArray());

        return ['success' => true, 'message' => 'Poli berhasil dihapus'];
    }

    public function actionDoctors(string $id): ActiveDataProvider
    {
        $this->requirePermission('master-poli-view');

        $poli = Poli::findActive()->where(['id' => $id])->one();
        if (!$poli) {
            throw new NotFoundHttpException('Poli tidak ditemukan');
        }

        $query = Dokter::findActive()
            ->innerJoinWith('polis')
            ->where(['poli_id' => $id])
            ->with(['user.profile', 'specialist']);

        return new ActiveDataProvider([
            'query' => $query,
            'pagination' => [
                'pageSize' => Yii::$app->params['pagination.pageSize'],
            ],
        ]);
    }

    public function actionSchedules(string $id, string $date = null): array
    {
        $this->requirePermission('master-poli-view');

        $poli = Poli::findActive()->where(['id' => $id])->one();
        if (!$poli) {
            throw new NotFoundHttpException('Poli tidak ditemukan');
        }

        $date = $date ?? date('Y-m-d');
        $dayOfWeek = (int) date('w', strtotime($date));

        $schedules = JadwalPraktik::findActive()
            ->where(['poli_id' => $id, 'day_of_week' => $dayOfWeek])
            ->andWhere(['<=', 'effective_from', $date])
            ->andWhere(['or', ['effective_until' => null], ['>=', 'effective_until', $date]])
            ->with(['dokter.user.profile', 'dokter.specialist'])
            ->orderBy(['start_time' => SORT_ASC])
            ->all();

        $result = [];
        foreach ($schedules as $schedule) {
            $bookedCount = \common\models\Kunjungan::find()
                ->where([
                    'dokter_id' => $schedule->dokter_id,
                    'poli_id' => $id,
                    'tanggal' => $date,
                ])
                ->andWhere(['in', 'status', [\common\models\Kunjungan::STATUS_WAITING, \common\models\Kunjungan::STATUS_IN_PROGRESS, \common\models\Kunjungan::STATUS_DONE]])
                ->count();

            $result[] = [
                'schedule' => $schedule,
                'quota' => $schedule->quota,
                'booked' => $bookedCount,
                'available' => max(0, $schedule->quota - $bookedCount),
            ];
        }

        return [
            'success' => true,
            'data' => [
                'poli' => $poli,
                'date' => $date,
                'schedules' => $result,
            ],
        ];
    }

    public function actionQueue(string $id, string $date = null): array
    {
        $this->requirePermission('transaksi-antrean-view');

        $poli = Poli::findActive()->where(['id' => $id])->one();
        if (!$poli) {
            throw new NotFoundHttpException('Poli tidak ditemukan');
        }

        $date = $date ?? date('Y-m-d');

        $queue = \common\models\Antrean::getQueueStatus($id, $date);

        return [
            'success' => true,
            'data' => $queue,
        ];
    }
}
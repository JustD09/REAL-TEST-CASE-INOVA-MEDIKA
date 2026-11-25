<?php

namespace api\modules\v1\controllers;

use Yii;
use yii\data\ActiveDataProvider;
use yii\web\NotFoundHttpException;
use common\models\JenisPemeriksaanLab;
use common\models\JenisPemeriksaanLabCategory;

class JenisPemeriksaanLabController extends BaseController
{
    public $modelClass = JenisPemeriksaanLab::class;

    public function actions(): array
    {
        $actions = parent::actions();
        unset($actions['create'], $actions['update'], $actions['delete']);
        return $actions;
    }

    public function actionIndex(): ActiveDataProvider
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

        if (!empty($params['sample_type'])) {
            $query->andWhere(['sample_type' => $params['sample_type']]);
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

    public function actionView(string $id): JenisPemeriksaanLab
    {
        $this->requirePermission('transaksi-lab-view');

        $model = JenisPemeriksaanLab::findActive()
            ->with(['category'])
            ->where(['id' => $id])
            ->one();

        if (!$model) {
            throw new NotFoundHttpException('Jenis pemeriksaan tidak ditemukan');
        }
        return $model;
    }

    public function actionCreate(): JenisPemeriksaanLab
    {
        $this->requirePermission('transaksi-lab-create');

        $data = Yii::$app->request->getBodyParams();

        $required = ['kode', 'nama', 'type', 'category_id', 'sample_type'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new \yii\web\BadRequestHttpException("Kolom '$field' wajib diisi");
            }
        }

        if (JenisPemeriksaanLab::findActive()->where(['kode' => $data['kode']])->exists()) {
            throw new \yii\web\BadRequestHttpException('Kode jenis pemeriksaan sudah digunakan');
        }

        $category = JenisPemeriksaanLabCategory::findActive()->where(['id' => $data['category_id']])->one();
        if (!$category) {
            throw new NotFoundHttpException('Kategori tidak ditemukan');
        }

        $model = new JenisPemeriksaanLab();
        $model->id = \Ramsey\Uuid\Uuid::uuid4()->toString();
        $model->kode = $data['kode'];
        $model->nama = $data['nama'];
        $model->type = $data['type'];
        $model->category_id = $data['category_id'];
        $model->sample_type = $data['sample_type'];
        $model->sample_volume = $data['sample_volume'] ?? null;
        $model->container_type = $data['container_type'] ?? null;
        $model->preparation_instructions = $data['preparation_instructions'] ?? null;
        $model->reference_range = $data['reference_range'] ?? null;
        $model->unit = $data['unit'] ?? null;
        $model->tarif = $data['tarif'] ?? 0;
        $model->turnaround_time_hours = $data['turnaround_time_hours'] ?? 0;
        $model->is_active = $data['is_active'] ?? true;
        $model->save(false);

        Yii::$app->auditLogger->logCreate('JenisPemeriksaanLab', $model->id, $model->toArray());

        return $model;
    }

    public function actionUpdate(string $id): JenisPemeriksaanLab
    {
        $this->requirePermission('transaksi-lab-update');

        $model = JenisPemeriksaanLab::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Jenis pemeriksaan tidak ditemukan');
        }

        $oldData = $model->toArray();
        $data = Yii::$app->request->getBodyParams();

        if (!empty($data['kode']) && $data['kode'] !== $model->kode) {
            if (JenisPemeriksaanLab::findActive()->where(['kode' => $data['kode']])->exists()) {
                throw new \yii\web\BadRequestHttpException('Kode jenis pemeriksaan sudah digunakan');
            }
            $model->kode = $data['kode'];
        }

        if (!empty($data['category_id'])) {
            $category = JenisPemeriksaanLabCategory::findActive()->where(['id' => $data['category_id']])->one();
            if (!$category) {
                throw new NotFoundHttpException('Kategori tidak ditemukan');
            }
            $model->category_id = $data['category_id'];
        }

        $model->nama = $data['nama'] ?? $model->nama;
        $model->type = $data['type'] ?? $model->type;
        $model->sample_type = $data['sample_type'] ?? $model->sample_type;
        $model->sample_volume = $data['sample_volume'] ?? $model->sample_volume;
        $model->container_type = $data['container_type'] ?? $model->container_type;
        $model->preparation_instructions = $data['preparation_instructions'] ?? $model->preparation_instructions;
        $model->reference_range = $data['reference_range'] ?? $model->reference_range;
        $model->unit = $data['unit'] ?? $model->unit;
        $model->tarif = $data['tarif'] ?? $model->tarif;
        $model->turnaround_time_hours = $data['turnaround_time_hours'] ?? $model->turnaround_time_hours;
        $model->is_active = $data['is_active'] ?? $model->is_active;

        if ($model->save()) {
            Yii::$app->auditLogger->logUpdate('JenisPemeriksaanLab', $model->id, $oldData, $model->toArray());
            return $model;
        }

        throw new \yii\web\UnprocessableEntityHttpException(json_encode($model->errors));
    }

    public function actionDelete(string $id): array
    {
        $this->requirePermission('transaksi-lab-delete');

        $model = JenisPemeriksaanLab::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Jenis pemeriksaan tidak ditemukan');
        }

        $model->is_deleted = true;
        $model->deleted_at = date('Y-m-d H:i:s');
        $model->save(false, ['is_deleted', 'deleted_at']);

        Yii::$app->auditLogger->logDelete('JenisPemeriksaanLab', $id, $model->toArray());

        return ['success' => true, 'message' => 'Jenis pemeriksaan berhasil dihapus'];
    }
}
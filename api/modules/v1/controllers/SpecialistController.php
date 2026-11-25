<?php

namespace api\modules\v1\controllers;

use Yii;
use yii\data\ActiveDataProvider;
use yii\web\NotFoundHttpException;
use common\models\Specialist;

class SpecialistController extends BaseController
{
    public $modelClass = Specialist::class;

    public function actions(): array
    {
        $actions = parent::actions();
        unset($actions['create'], $actions['update'], $actions['delete']);
        return $actions;
    }

    public function actionIndex(): ActiveDataProvider
    {
        $this->requirePermission('master-dokter-view');

        $query = Specialist::findActive();

        $params = Yii::$app->request->queryParams;

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
                'defaultOrder' => ['sort_order' => SORT_ASC, 'nama' => SORT_ASC],
            ],
        ]);
    }

    public function actionView(string $id): Specialist
    {
        $this->requirePermission('master-dokter-view');

        $model = Specialist::findActive()->where(['id' => $id])->one();

        if (!$model) {
            throw new NotFoundHttpException('Spesialis tidak ditemukan');
        }
        return $model;
    }

    public function actionCreate(): Specialist
    {
        $this->requirePermission('master-dokter-create');

        $data = Yii::$app->request->getBodyParams();

        $required = ['kode', 'nama'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new \yii\web\BadRequestHttpException("Kolom '$field' wajib diisi");
            }
        }

        if (Specialist::findActive()->where(['kode' => $data['kode']])->exists()) {
            throw new \yii\web\BadRequestHttpException('Kode spesialis sudah digunakan');
        }

        $model = new Specialist();
        $model->id = \Ramsey\Uuid\Uuid::uuid4()->toString();
        $model->kode = $data['kode'];
        $model->nama = $data['nama'];
        $model->description = $data['description'] ?? null;
        $model->sort_order = $data['sort_order'] ?? 0;
        $model->save(false);

        Yii::$app->auditLogger->logCreate('Specialist', $model->id, $model->toArray());

        return $model;
    }

    public function actionUpdate(string $id): Specialist
    {
        $this->requirePermission('master-dokter-update');

        $model = Specialist::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Spesialis tidak ditemukan');
        }

        $oldData = $model->toArray();
        $data = Yii::$app->request->getBodyParams();

        if (!empty($data['kode']) && $data['kode'] !== $model->kode) {
            if (Specialist::findActive()->where(['kode' => $data['kode']])->exists()) {
                throw new \yii\web\BadRequestHttpException('Kode spesialis sudah digunakan');
            }
            $model->kode = $data['kode'];
        }

        $model->nama = $data['nama'] ?? $model->nama;
        $model->description = $data['description'] ?? $model->description;
        $model->sort_order = $data['sort_order'] ?? $model->sort_order;

        if ($model->save()) {
            Yii::$app->auditLogger->logUpdate('Specialist', $model->id, $oldData, $model->toArray());
            return $model;
        }

        throw new \yii\web\UnprocessableEntityHttpException(json_encode($model->errors));
    }

    public function actionDelete(string $id): array
    {
        $this->requirePermission('master-dokter-delete');

        $model = Specialist::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Spesialis tidak ditemukan');
        }

        $dokterCount = \common\models\Dokter::findActive()->where(['specialist_id' => $id])->count();
        if ($dokterCount > 0) {
            throw new \yii\web\BadRequestHttpException('Spesialis dengan dokter terkait tidak dapat dihapus');
        }

        $model->is_deleted = true;
        $model->deleted_at = date('Y-m-d H:i:s');
        $model->save(false, ['is_deleted', 'deleted_at']);

        Yii::$app->auditLogger->logDelete('Specialist', $id, $model->toArray());

        return ['success' => true, 'message' => 'Spesialis berhasil dihapus'];
    }
}
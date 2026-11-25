<?php

namespace api\modules\v1\controllers;

use Yii;
use yii\data\ActiveDataProvider;
use yii\web\NotFoundHttpException;
use common\models\TindakanCategory;

class TindakanCategoryController extends BaseController
{
    public $modelClass = TindakanCategory::class;

    public function actions(): array
    {
        $actions = parent::actions();
        unset($actions['create'], $actions['update'], $actions['delete']);
        return $actions;
    }

    public function actionIndex(): ActiveDataProvider
    {
        $this->requirePermission('master-tindakan-view');

        $query = TindakanCategory::findActive()->with(['children']);

        $params = Yii::$app->request->queryParams;

        if (!empty($params['parent_id'])) {
            $query->andWhere(['parent_id' => $params['parent_id']]);
        } elseif (!empty($params['root_only'])) {
            $query->andWhere(['parent_id' => null]);
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

    public function actionView(string $id): TindakanCategory
    {
        $this->requirePermission('master-tindakan-view');

        $model = TindakanCategory::findActive()
            ->with(['parent', 'children', 'tindakan'])
            ->where(['id' => $id])
            ->one();

        if (!$model) {
            throw new NotFoundHttpException('Kategori tidak ditemukan');
        }
        return $model;
    }

    public function actionCreate(): TindakanCategory
    {
        $this->requirePermission('master-tindakan-create');

        $data = Yii::$app->request->getBodyParams();

        $required = ['kode', 'nama'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new \yii\web\BadRequestHttpException("Kolom '$field' wajib diisi");
            }
        }

        if (TindakanCategory::findActive()->where(['kode' => $data['kode']])->exists()) {
            throw new \yii\web\BadRequestHttpException('Kode kategori sudah digunakan');
        }

        $model = new TindakanCategory();
        $model->id = \Ramsey\Uuid\Uuid::uuid4()->toString();
        $model->kode = $data['kode'];
        $model->nama = $data['nama'];
        $model->parent_id = $data['parent_id'] ?? null;
        $model->description = $data['description'] ?? null;
        $model->sort_order = $data['sort_order'] ?? 0;
        $model->save(false);

        Yii::$app->auditLogger->logCreate('TindakanCategory', $model->id, $model->toArray());

        return $model;
    }

    public function actionUpdate(string $id): TindakanCategory
    {
        $this->requirePermission('master-tindakan-update');

        $model = TindakanCategory::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Kategori tidak ditemukan');
        }

        $oldData = $model->toArray();
        $data = Yii::$app->request->getBodyParams();

        if (!empty($data['kode']) && $data['kode'] !== $model->kode) {
            if (TindakanCategory::findActive()->where(['kode' => $data['kode']])->exists()) {
                throw new \yii\web\BadRequestHttpException('Kode kategori sudah digunakan');
            }
            $model->kode = $data['kode'];
        }

        $model->nama = $data['nama'] ?? $model->nama;
        $model->parent_id = $data['parent_id'] ?? $model->parent_id;
        $model->description = $data['description'] ?? $model->description;
        $model->sort_order = $data['sort_order'] ?? $model->sort_order;

        if ($model->save()) {
            Yii::$app->auditLogger->logUpdate('TindakanCategory', $model->id, $oldData, $model->toArray());
            return $model;
        }

        throw new \yii\web\UnprocessableEntityHttpException(json_encode($model->errors));
    }

    public function actionDelete(string $id): array
    {
        $this->requirePermission('master-tindakan-delete');

        $model = TindakanCategory::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Kategori tidak ditemukan');
        }

        if ($model->children->count() > 0) {
            throw new \yii\web\BadRequestHttpException('Kategori dengan subkategori tidak dapat dihapus');
        }

        $tindakanCount = \common\models\Tindakan::findActive()->where(['category_id' => $id])->count();
        if ($tindakanCount > 0) {
            throw new \yii\web\BadRequestHttpException('Kategori dengan tindakan terkait tidak dapat dihapus');
        }

        $model->is_deleted = true;
        $model->deleted_at = date('Y-m-d H:i:s');
        $model->save(false, ['is_deleted', 'deleted_at']);

        Yii::$app->auditLogger->logDelete('TindakanCategory', $id, $model->toArray());

        return ['success' => true, 'message' => 'Kategori berhasil dihapus'];
    }
}
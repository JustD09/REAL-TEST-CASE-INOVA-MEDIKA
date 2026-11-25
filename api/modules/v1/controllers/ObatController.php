<?php

namespace api\modules\v1\controllers;

use Yii;
use yii\data\ActiveDataProvider;
use yii\web\NotFoundHttpException;
use common\models\Obat;
use common\models\ObatCategory;
use common\models\ObatStockLog;

class ObatController extends BaseController
{
    public $modelClass = Obat::class;

    public function actions(): array
    {
        $actions = parent::actions();
        unset($actions['create'], $actions['update'], $actions['delete']);
        return $actions;
    }

    public function actionIndex(): ActiveDataProvider
    {
        $this->requirePermission('master-obat-view');

        $query = Obat::findActive()->with(['category']);

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
                ['like', 'generic_name', $params['search']],
            ]);
        }

        if (!empty($params['low_stock'])) {
            $query->andWhere(['<=', 'current_stock', new \yii\db\Expression('min_stock')]);
        }

        if (!empty($params['is_controlled'])) {
            $query->andWhere(['is_controlled' => $params['is_controlled']]);
        }

        if (!empty($params['expired_soon'])) {
            $days = (int) $params['expired_soon'];
            $query->andWhere(['<=', 'expired_date', date('Y-m-d', strtotime("+$days days"))]);
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

    public function actionView(string $id): Obat
    {
        $this->requirePermission('master-obat-view');

        $model = Obat::findActive()
            ->with(['category', 'stockLogs'])
            ->where(['id' => $id])
            ->one();

        if (!$model) {
            throw new NotFoundHttpException('Obat tidak ditemukan');
        }
        return $model;
    }

    public function actionCreate(): Obat
    {
        $this->requirePermission('master-obat-create');

        $data = Yii::$app->request->getBodyParams();

        $required = ['kode', 'nama', 'type', 'category_id', 'unit', 'strength'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new \yii\web\BadRequestHttpException("Kolom '$field' wajib diisi");
            }
        }

        if (Obat::findActive()->where(['kode' => $data['kode']])->exists()) {
            throw new \yii\web\BadRequestHttpException('Kode obat sudah digunakan');
        }

        $category = ObatCategory::findActive()->where(['id' => $data['category_id']])->one();
        if (!$category) {
            throw new NotFoundHttpException('Kategori tidak ditemukan');
        }

        $model = new Obat();
        $model->id = \Ramsey\Uuid\Uuid::uuid4()->toString();
        $model->kode = $data['kode'];
        $model->nama = $data['nama'];
        $model->generic_name = $data['generic_name'] ?? null;
        $model->type = $data['type'];
        $model->category_id = $data['category_id'];
        $model->unit = $data['unit'];
        $model->strength = $data['strength'];
        $model->manufacturer = $data['manufacturer'] ?? null;
        $model->purchase_price = $data['purchase_price'] ?? 0;
        $model->selling_price = $data['selling_price'] ?? 0;
        $model->bpjs_price = $data['bpjs_price'] ?? 0;
        $model->min_stock = $data['min_stock'] ?? 0;
        $model->max_stock = $data['max_stock'] ?? 0;
        $model->current_stock = $data['current_stock'] ?? 0;
        $model->expired_date = $data['expired_date'] ?? null;
        $model->batch_number = $data['batch_number'] ?? null;
        $model->location = $data['location'] ?? null;
        $model->is_controlled = $data['is_controlled'] ?? false;
        $model->is_active = $data['is_active'] ?? true;
        $model->save(false);

        if ($model->current_stock > 0) {
            $log = new ObatStockLog();
            $log->id = \Ramsey\Uuid\Uuid::uuid4()->toString();
            $log->obat_id = $model->id;
            $log->type = ObatStockLog::TYPE_IN;
            $log->quantity = $model->current_stock;
            $log->stock_before = 0;
            $log->stock_after = $model->current_stock;
            $log->reference_type = 'initial';
            $log->notes = 'Stok awal';
            $log->created_by = Yii::$app->user->id ?? 'system';
            $log->save(false);
        }

        Yii::$app->auditLogger->logCreate('Obat', $model->id, $model->toArray());

        return $model;
    }

    public function actionUpdate(string $id): Obat
    {
        $this->requirePermission('master-obat-update');

        $model = Obat::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Obat tidak ditemukan');
        }

        $oldData = $model->toArray();
        $data = Yii::$app->request->getBodyParams();

        if (!empty($data['kode']) && $data['kode'] !== $model->kode) {
            if (Obat::findActive()->where(['kode' => $data['kode']])->exists()) {
                throw new \yii\web\BadRequestHttpException('Kode obat sudah digunakan');
            }
            $model->kode = $data['kode'];
        }

        if (!empty($data['category_id'])) {
            $category = ObatCategory::findActive()->where(['id' => $data['category_id']])->one();
            if (!$category) {
                throw new NotFoundHttpException('Kategori tidak ditemukan');
            }
            $model->category_id = $data['category_id'];
        }

        $model->nama = $data['nama'] ?? $model->nama;
        $model->generic_name = $data['generic_name'] ?? $model->generic_name;
        $model->type = $data['type'] ?? $model->type;
        $model->unit = $data['unit'] ?? $model->unit;
        $model->strength = $data['strength'] ?? $model->strength;
        $model->manufacturer = $data['manufacturer'] ?? $model->manufacturer;
        $model->purchase_price = $data['purchase_price'] ?? $model->purchase_price;
        $model->selling_price = $data['selling_price'] ?? $model->selling_price;
        $model->bpjs_price = $data['bpjs_price'] ?? $model->bpjs_price;
        $model->min_stock = $data['min_stock'] ?? $model->min_stock;
        $model->max_stock = $data['max_stock'] ?? $model->max_stock;
        $model->expired_date = $data['expired_date'] ?? $model->expired_date;
        $model->batch_number = $data['batch_number'] ?? $model->batch_number;
        $model->location = $data['location'] ?? $model->location;
        $model->is_controlled = $data['is_controlled'] ?? $model->is_controlled;
        $model->is_active = $data['is_active'] ?? $model->is_active;

        if ($model->save()) {
            Yii::$app->auditLogger->logUpdate('Obat', $model->id, $oldData, $model->toArray());
            return $model;
        }

        throw new \yii\web\UnprocessableEntityHttpException(json_encode($model->errors));
    }

    public function actionDelete(string $id): array
    {
        $this->requirePermission('master-obat-delete');

        $model = Obat::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Obat tidak ditemukan');
        }

        $model->is_deleted = true;
        $model->deleted_at = date('Y-m-d H:i:s');
        $model->save(false, ['is_deleted', 'deleted_at']);

        Yii::$app->auditLogger->logDelete('Obat', $id, $model->toArray());

        return ['success' => true, 'message' => 'Obat deleted'];
    }

    public function actionStock(string $id): array
    {
        $this->requirePermission('master-obat-view');

        $model = Obat::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Obat tidak ditemukan');
        }

        $logs = ObatStockLog::find()
            ->where(['obat_id' => $id])
            ->orderBy(['created_at' => SORT_DESC])
            ->limit(50)
            ->all();

        return [
            'success' => true,
            'data' => [
                'obat' => $model,
                'current_stock' => $model->current_stock,
                'min_stock' => $model->min_stock,
                'max_stock' => $model->max_stock,
                'is_low_stock' => $model->current_stock <= $model->min_stock,
                'stock_logs' => $logs,
            ],
        ];
    }

    public function actionAdjustStock(string $id): array
    {
        $this->requirePermission('master-obat-stock-adjust');

        $model = Obat::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Obat tidak ditemukan');
        }

        $data = Yii::$app->request->getBodyParams();

        $required = ['type', 'quantity'];
        foreach ($required as $field) {
            if (!isset($data[$field])) {
                throw new \yii\web\BadRequestHttpException("Kolom '$field' wajib diisi");
            }
        }

        $type = $data['type'];
        $quantity = (int) $data['quantity'];

        if ($quantity <= 0) {
            throw new \yii\web\BadRequestHttpException('Jumlah harus lebih besar dari nol');
        }

        if (!in_array($type, [ObatStockLog::TYPE_IN, ObatStockLog::TYPE_OUT, ObatStockLog::TYPE_ADJUSTMENT])) {
            throw new \yii\web\BadRequestHttpException('Jenis stok tidak valid');
        }

        $oldStock = $model->current_stock;
        $newStock = $oldStock;

        if ($type === ObatStockLog::TYPE_IN) {
            $newStock = $oldStock + $quantity;
        } elseif ($type === ObatStockLog::TYPE_OUT) {
            if ($oldStock < $quantity) {
                throw new \yii\web\BadRequestHttpException('Stok tidak mencukupi');
            }
            $newStock = $oldStock - $quantity;
        } elseif ($type === ObatStockLog::TYPE_ADJUSTMENT) {
            $newStock = $quantity;
            $quantity = $newStock - $oldStock;
        }

        if ($newStock > $model->max_stock && $model->max_stock > 0) {
            throw new \yii\web\BadRequestHttpException('Stok melebihi batas maksimum');
        }

        $model->current_stock = $newStock;
        $model->save(false, ['current_stock']);

        $log = new ObatStockLog();
        $log->id = \Ramsey\Uuid\Uuid::uuid4()->toString();
        $log->obat_id = $model->id;
        $log->type = $type;
        $log->quantity = abs($quantity);
        $log->stock_before = $oldStock;
        $log->stock_after = $newStock;
        $log->reference_type = $data['reference_type'] ?? 'manual';
        $log->reference_id = $data['reference_id'] ?? null;
        $log->notes = $data['notes'] ?? 'Penyesuaian stok manual';
        $log->created_by = Yii::$app->user->id ?? 'system';
        $log->save(false);

        Yii::$app->auditLogger->logUpdate('Obat', $model->id, ['current_stock' => $oldStock], ['current_stock' => $newStock]);

        return [
            'success' => true,
            'message' => 'Stock adjusted',
            'data' => [
                'obat_id' => $model->id,
                'old_stock' => $oldStock,
                'new_stock' => $newStock,
                'adjustment' => $quantity,
            ],
        ];
    }

    public function actionCategories(): ActiveDataProvider
    {
        $this->requirePermission('master-obat-view');

        $query = ObatCategory::findActive()->with(['children']);

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

    public function actionLowStock(): ActiveDataProvider
    {
        $this->requirePermission('master-obat-view');

        $query = Obat::findActive()
            ->where(['<=', 'current_stock', new \yii\db\Expression('min_stock')])
            ->andWhere(['>', 'min_stock', 0]);

        return new ActiveDataProvider([
            'query' => $query,
            'pagination' => [
                'pageSize' => Yii::$app->params['pagination.pageSize'],
            ],
        ]);
    }

    public function actionExpiringSoon(): ActiveDataProvider
    {
        $this->requirePermission('master-obat-view');

        $days = (int) (Yii::$app->request->get('days', 90));
        $date = date('Y-m-d', strtotime("+$days days"));

        $query = Obat::findActive()
            ->where(['<=', 'expired_date', $date])
            ->andWhere(['is not', 'expired_date', new \yii\db\Expression('NULL')]);

        return new ActiveDataProvider([
            'query' => $query,
            'pagination' => [
                'pageSize' => Yii::$app->params['pagination.pageSize'],
            ],
            'sort' => [
                'defaultOrder' => ['expired_date' => SORT_ASC],
            ],
        ]);
    }
}
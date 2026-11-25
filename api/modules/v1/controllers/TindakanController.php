<?php

namespace api\modules\v1\controllers;

use Yii;
use yii\data\ActiveDataProvider;
use yii\web\NotFoundHttpException;
use common\models\Tindakan;
use common\models\TindakanCategory;
use common\models\TindakanTarif;

class TindakanController extends BaseController
{
    public $modelClass = Tindakan::class;

    public function actions(): array
    {
        $actions = parent::actions();
        unset($actions['create'], $actions['update'], $actions['delete']);
        return $actions;
    }

    public function actionIndex(): ActiveDataProvider
    {
        $this->requirePermission('master-tindakan-view');

        $query = Tindakan::findActive()->with(['category', 'tarif']);

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

        if (!empty($params['is_active'])) {
            $query->andWhere(['is_active' => $params['is_active']]);
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

    public function actionView(string $id): Tindakan
    {
        $this->requirePermission('master-tindakan-view');

        $model = Tindakan::findActive()
            ->with(['category', 'tarif'])
            ->where(['id' => $id])
            ->one();

        if (!$model) {
            throw new NotFoundHttpException('Tindakan tidak ditemukan');
        }
        return $model;
    }

    public function actionCreate(): Tindakan
    {
        $this->requirePermission('master-tindakan-create');

        $data = Yii::$app->request->getBodyParams();

        $required = ['kode', 'nama', 'type', 'category_id'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new \yii\web\BadRequestHttpException("Kolom '$field' wajib diisi");
            }
        }

        if (Tindakan::findActive()->where(['kode' => $data['kode']])->exists()) {
            throw new \yii\web\BadRequestHttpException('Kode tindakan sudah digunakan');
        }

        $category = TindakanCategory::findActive()->where(['id' => $data['category_id']])->one();
        if (!$category) {
            throw new NotFoundHttpException('Kategori tidak ditemukan');
        }

        $model = new Tindakan();
        $model->id = \Ramsey\Uuid\Uuid::uuid4()->toString();
        $model->kode = $data['kode'];
        $model->nama = $data['nama'];
        $model->type = $data['type'];
        $model->category_id = $data['category_id'];
        $model->description = $data['description'] ?? null;
        $model->requires_anesthesia = $data['requires_anesthesia'] ?? false;
        $model->duration_minutes = $data['duration_minutes'] ?? 0;
        $model->is_active = $data['is_active'] ?? true;
        $model->save(false);

        if (!empty($data['tarif']) && is_array($data['tarif'])) {
            foreach ($data['tarif'] as $tarifData) {
                $tarif = new TindakanTarif();
                $tarif->id = \Ramsey\Uuid\Uuid::uuid4()->toString();
                $tarif->tindakan_id = $model->id;
                $tarif->kelas = $tarifData['kelas'];
                $tarif->pembayaran_type = $tarifData['pembayaran_type'];
                $tarif->tarif = $tarifData['tarif'];
                $tarif->tarif_dokter = $tarifData['tarif_dokter'] ?? 0;
                $tarif->tarif_petugas = $tarifData['tarif_petugas'] ?? 0;
                $tarif->tarif_alat = $tarifData['tarif_alat'] ?? 0;
                $tarif->tarif_bhp = $tarifData['tarif_bhp'] ?? 0;
                $tarif->tarif_lain = $tarifData['tarif_lain'] ?? 0;
                $tarif->is_active = $tarifData['is_active'] ?? true;
                $tarif->save(false);
            }
        }

        Yii::$app->auditLogger->logCreate('Tindakan', $model->id, $model->toArray());

        return $model;
    }

    public function actionUpdate(string $id): Tindakan
    {
        $this->requirePermission('master-tindakan-update');

        $model = Tindakan::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Tindakan tidak ditemukan');
        }

        $oldData = $model->toArray();
        $data = Yii::$app->request->getBodyParams();

        if (!empty($data['kode']) && $data['kode'] !== $model->kode) {
            if (Tindakan::findActive()->where(['kode' => $data['kode']])->exists()) {
                throw new \yii\web\BadRequestHttpException('Kode tindakan sudah digunakan');
            }
            $model->kode = $data['kode'];
        }

        if (!empty($data['category_id'])) {
            $category = TindakanCategory::findActive()->where(['id' => $data['category_id']])->one();
            if (!$category) {
                throw new NotFoundHttpException('Kategori tidak ditemukan');
            }
            $model->category_id = $data['category_id'];
        }

        $model->nama = $data['nama'] ?? $model->nama;
        $model->type = $data['type'] ?? $model->type;
        $model->description = $data['description'] ?? $model->description;
        $model->requires_anesthesia = $data['requires_anesthesia'] ?? $model->requires_anesthesia;
        $model->duration_minutes = $data['duration_minutes'] ?? $model->duration_minutes;
        $model->is_active = $data['is_active'] ?? $model->is_active;

        if ($model->save()) {
            if (isset($data['tarif']) && is_array($data['tarif'])) {
                foreach ($model->tarif as $tarif) {
                    $tarif->is_deleted = true;
                    $tarif->deleted_at = date('Y-m-d H:i:s');
                    $tarif->save(false, ['is_deleted', 'deleted_at']);
                }

                foreach ($data['tarif'] as $tarifData) {
                    $tarif = new TindakanTarif();
                    $tarif->id = \Ramsey\Uuid\Uuid::uuid4()->toString();
                    $tarif->tindakan_id = $model->id;
                    $tarif->kelas = $tarifData['kelas'];
                    $tarif->pembayaran_type = $tarifData['pembayaran_type'];
                    $tarif->tarif = $tarifData['tarif'];
                    $tarif->tarif_dokter = $tarifData['tarif_dokter'] ?? 0;
                    $tarif->tarif_petugas = $tarifData['tarif_petugas'] ?? 0;
                    $tarif->tarif_alat = $tarifData['tarif_alat'] ?? 0;
                    $tarif->tarif_bhp = $tarifData['tarif_bhp'] ?? 0;
                    $tarif->tarif_lain = $tarifData['tarif_lain'] ?? 0;
                    $tarif->is_active = $tarifData['is_active'] ?? true;
                    $tarif->save(false);
                }
            }

            Yii::$app->auditLogger->logUpdate('Tindakan', $model->id, $oldData, $model->toArray());
            return $model;
        }

        throw new \yii\web\UnprocessableEntityHttpException(json_encode($model->errors));
    }

    public function actionDelete(string $id): array
    {
        $this->requirePermission('master-tindakan-delete');

        $model = Tindakan::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Tindakan tidak ditemukan');
        }

        $model->is_deleted = true;
        $model->deleted_at = date('Y-m-d H:i:s');
        $model->save(false, ['is_deleted', 'deleted_at']);

        foreach ($model->tarif as $tarif) {
            $tarif->is_deleted = true;
            $tarif->deleted_at = date('Y-m-d H:i:s');
            $tarif->save(false, ['is_deleted', 'deleted_at']);
        }

        Yii::$app->auditLogger->logDelete('Tindakan', $id, $model->toArray());

        return ['success' => true, 'message' => 'Tindakan deleted'];
    }

    public function actionCategories(): ActiveDataProvider
    {
        $this->requirePermission('master-tindakan-view');

        $query = TindakanCategory::findActive()->with(['children']);

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

    public function actionTarif(string $id): ActiveDataProvider
    {
        $this->requirePermission('master-tindakan-view');

        $tindakan = Tindakan::findActive()->where(['id' => $id])->one();
        if (!$tindakan) {
            throw new NotFoundHttpException('Tindakan tidak ditemukan');
        }

        $query = TindakanTarif::findActive()->where(['tindakan_id' => $id]);

        return new ActiveDataProvider([
            'query' => $query,
            'pagination' => [
                'pageSize' => Yii::$app->params['pagination.pageSize'],
            ],
            'sort' => [
                'defaultOrder' => ['kelas' => SORT_ASC, 'pembayaran_type' => SORT_ASC],
            ],
        ]);
    }

    public function actionGetTarif(string $id, string $kelas, string $pembayaranType = 'umum'): array
    {
        $this->requirePermission('master-tindakan-view');

        $tarif = TindakanTarif::findActive()
            ->where([
                'tindakan_id' => $id,
                'kelas' => $kelas,
                'pembayaran_type' => $pembayaranType,
            ])
            ->one();

        if (!$tarif) {
            throw new NotFoundHttpException('Tarif not found for given parameters');
        }

        return [
            'success' => true,
            'data' => $tarif,
        ];
    }
}
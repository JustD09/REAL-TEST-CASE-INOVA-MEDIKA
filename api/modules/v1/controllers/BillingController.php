<?php

namespace api\modules\v1\controllers;

use Yii;
use yii\data\ActiveDataProvider;
use yii\web\NotFoundHttpException;
use common\models\Billing;
use common\models\BillingDetail;
use common\models\Kunjungan;
use common\models\Pemeriksaan;
use common\models\TindakanMedis;
use common\models\Resep;
use common\models\Laboratorium;
use common\models\TindakanTarif;
use common\models\Obat;

class BillingController extends BaseController
{
    public $modelClass = Billing::class;

    public function actions(): array
    {
        $actions = parent::actions();
        unset($actions['create'], $actions['update'], $actions['delete']);
        return $actions;
    }

    public function actionIndex(): ActiveDataProvider
    {
        $this->requirePermission('transaksi-billing-view');

        $query = Billing::findActive()->with(['kunjungan.pasien.user.profile', 'kunjungan.poli', 'kunjungan.dokter']);

        $params = Yii::$app->request->queryParams;

        if (!empty($params['kunjungan_id'])) {
            $query->andWhere(['kunjungan_id' => $params['kunjungan_id']]);
        }

        if (!empty($params['pasien_id'])) {
            $query->andWhere(['pasien_id' => $params['pasien_id']]);
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

    public function actionView(string $id): Billing
    {
        $this->requirePermission('transaksi-billing-view');

        $model = Billing::findActive()
            ->with([
                'kunjungan.pasien.user.profile',
                'kunjungan.poli',
                'kunjungan.dokter.user.profile',
                'billingDetail',
                'pembayaran',
            ])
            ->where(['id' => $id])
            ->one();

        if (!$model) {
            throw new NotFoundHttpException('Billing tidak ditemukan');
        }
        return $model;
    }

    public function actionCreate(): Billing
    {
        $this->requirePermission('transaksi-billing-create');

        $data = Yii::$app->request->getBodyParams();

        $required = ['kunjungan_id'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new \yii\web\BadRequestHttpException("Kolom '$field' wajib diisi");
            }
        }

        $kunjungan = Kunjungan::findActive()->where(['id' => $data['kunjungan_id']])->one();
        if (!$kunjungan) {
            throw new NotFoundHttpException('Kunjungan tidak ditemukan');
        }

        $existingBilling = Billing::findActive()->where(['kunjungan_id' => $kunjungan->id])->one();
        if ($existingBilling) {
            throw new \yii\web\BadRequestHttpException('Billing untuk kunjungan ini sudah ada');
        }

        $model = Billing::generateFromKunjungan($kunjungan->id);

        Yii::$app->auditLogger->logCreate('Billing', $model->id, $model->toArray());

        return $model;
    }

    public function actionRegenerate(string $id): Billing
    {
        $this->requirePermission('transaksi-billing-create');

        $model = Billing::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Billing tidak ditemukan');
        }

        $oldData = $model->toArray();

        $kunjungan = $model->kunjungan;
        $model->is_deleted = true;
        $model->deleted_at = date('Y-m-d H:i:s');
        $model->save(false, ['is_deleted', 'deleted_at']);

        foreach ($model->billingDetail as $detail) {
            $detail->is_deleted = true;
            $detail->deleted_at = date('Y-m-d H:i:s');
            $detail->save(false, ['is_deleted', 'deleted_at']);
        }

        $newBilling = Billing::generateFromKunjungan($kunjungan->id);

        Yii::$app->auditLogger->logUpdate('Billing', $model->id, $oldData, ['regenerated_to' => $newBilling->id]);

        return $newBilling;
    }

    public function actionUpdate(string $id): Billing
    {
        $this->requirePermission('transaksi-billing-update');

        $model = Billing::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Billing tidak ditemukan');
        }

        if ($model->status === Billing::STATUS_PAID) {
            throw new \yii\web\BadRequestHttpException('Billing lunas tidak dapat diperbarui');
        }

        $oldData = $model->toArray();
        $data = Yii::$app->request->getBodyParams();

        $model->catatan = $data['catatan'] ?? $model->catatan;
        $model->discount = $data['discount'] ?? $model->discount;
        $model->discount_reason = $data['discount_reason'] ?? $model->discount_reason;

        if ($model->save()) {
            $model->recalculateTotal();
            Yii::$app->auditLogger->logUpdate('Billing', $model->id, $oldData, $model->toArray());
            return $model;
        }

        throw new \yii\web\UnprocessableEntityHttpException(json_encode($model->errors));
    }

    public function actionDelete(string $id): array
    {
        $this->requirePermission('transaksi-billing-delete');

        $model = Billing::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Billing tidak ditemukan');
        }

        if ($model->status === Billing::STATUS_PAID) {
            throw new \yii\web\BadRequestHttpException('Billing lunas tidak dapat dihapus');
        }

        if ($model->paid_amount > 0) {
            throw new \yii\web\BadRequestHttpException('Billing dengan pembayaran tidak dapat dihapus');
        }

        $model->is_deleted = true;
        $model->deleted_at = date('Y-m-d H:i:s');
        $model->save(false, ['is_deleted', 'deleted_at']);

        foreach ($model->billingDetail as $detail) {
            $detail->is_deleted = true;
            $detail->deleted_at = date('Y-m-d H:i:s');
            $detail->save(false, ['is_deleted', 'deleted_at']);
        }

        Yii::$app->auditLogger->logDelete('Billing', $id, $model->toArray());

        return ['success' => true, 'message' => 'Billing berhasil dihapus'];
    }

    public function actionDetail(string $id): ActiveDataProvider
    {
        $this->requirePermission('transaksi-billing-view');

        $model = Billing::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Billing tidak ditemukan');
        }

        $query = BillingDetail::findActive()->where(['billing_id' => $id]);

        return new ActiveDataProvider([
            'query' => $query,
            'pagination' => [
                'pageSize' => Yii::$app->params['pagination.pageSize'],
            ],
        ]);
    }

    public function actionAddDetail(string $id): BillingDetail
    {
        $this->requirePermission('transaksi-billing-update');

        $model = Billing::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Billing tidak ditemukan');
        }

        if ($model->status === Billing::STATUS_PAID) {
            throw new \yii\web\BadRequestHttpException('Detail tidak dapat ditambahkan ke billing lunas');
        }

        $data = Yii::$app->request->getBodyParams();

        $required = ['item_type', 'item_id', 'nama_item', 'harga_satuan', 'qty'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new \yii\web\BadRequestHttpException("Kolom '$field' wajib diisi");
            }
        }

        $detail = new BillingDetail();
        $detail->id = \Ramsey\Uuid\Uuid::uuid4()->toString();
        $detail->billing_id = $model->id;
        $detail->item_type = $data['item_type'];
        $detail->item_id = $data['item_id'];
        $detail->nama_item = $data['nama_item'];
        $detail->harga_satuan = $data['harga_satuan'];
        $detail->qty = $data['qty'];
        $detail->subtotal = $data['harga_satuan'] * $data['qty'];
        $detail->catatan = $data['catatan'] ?? '';
        $detail->save(false);

        $model->recalculateTotal();

        return $detail;
    }

    public function actionRemoveDetail(string $id, string $detailId): array
    {
        $this->requirePermission('transaksi-billing-update');

        $model = Billing::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Billing tidak ditemukan');
        }

        if ($model->status === Billing::STATUS_PAID) {
            throw new \yii\web\BadRequestHttpException('Detail tidak dapat dihapus dari billing lunas');
        }

        $detail = BillingDetail::findActive()->where(['id' => $detailId, 'billing_id' => $id])->one();
        if (!$detail) {
            throw new NotFoundHttpException('Detail billing tidak ditemukan');
        }

        $detail->is_deleted = true;
        $detail->deleted_at = date('Y-m-d H:i:s');
        $detail->save(false, ['is_deleted', 'deleted_at']);

        $model->recalculateTotal();

        return ['success' => true, 'message' => 'Detail berhasil dihapus'];
    }

    public function actionOutstanding(): ActiveDataProvider
    {
        $this->requirePermission('laporan-piutang-view');

        $query = Billing::findActive()
            ->where(['in', 'status', [Billing::STATUS_UNPAID, Billing::STATUS_PARTIAL]])
            ->with(['kunjungan.pasien.user.profile', 'kunjungan.poli']);

        return new ActiveDataProvider([
            'query' => $query,
            'pagination' => [
                'pageSize' => Yii::$app->params['pagination.pageSize'],
            ],
            'sort' => [
                'defaultOrder' => ['due_date' => SORT_ASC, 'created_at' => SORT_ASC],
            ],
        ]);
    }

    public function actionByKunjungan(string $kunjunganId): array
    {
        $this->requirePermission('transaksi-billing-view');

        $kunjungan = Kunjungan::findActive()->where(['id' => $kunjunganId])->one();
        if (!$kunjungan) {
            throw new NotFoundHttpException('Kunjungan tidak ditemukan');
        }

        $billing = Billing::findActive()
            ->where(['kunjungan_id' => $kunjunganId])
            ->with(['billingDetail', 'pembayaran'])
            ->one();

        if (!$billing) {
            return ['success' => true, 'data' => null, 'message' => 'Billing belum dibuat'];
        }

        return ['success' => true, 'data' => $billing];
    }
}
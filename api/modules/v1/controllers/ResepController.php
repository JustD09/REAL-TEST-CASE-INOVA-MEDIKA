<?php

namespace api\modules\v1\controllers;

use Yii;
use yii\data\ActiveDataProvider;
use yii\web\NotFoundHttpException;
use common\models\Resep;
use common\models\ResepDetail;
use common\models\Obat;
use common\models\Kunjungan;
use common\models\Pemeriksaan;

class ResepController extends BaseController
{
    public $modelClass = Resep::class;

    public function actions(): array
    {
        $actions = parent::actions();
        unset($actions['create'], $actions['update'], $actions['delete']);
        return $actions;
    }

    public function actionIndex(): ActiveDataProvider
    {
        $this->requirePermission('transaksi-resep-view');

        $query = Resep::findActive()->with(['kunjungan.pasien.user.profile', 'dokter', 'pemeriksaan', 'resepDetail.obat']);

        $params = Yii::$app->request->queryParams;

        if (!empty($params['kunjungan_id'])) {
            $query->andWhere(['kunjungan_id' => $params['kunjungan_id']]);
        }

        if (!empty($params['dokter_id'])) {
            $query->andWhere(['dokter_id' => $params['dokter_id']]);
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

    public function actionView(string $id): Resep
    {
        $this->requirePermission('transaksi-resep-view');

        $model = Resep::findActive()
            ->with([
                'kunjungan.pasien.user.profile',
                'kunjungan.poli',
                'dokter.user.profile',
                'pemeriksaan',
                'resepDetail.obat.category',
            ])
            ->where(['id' => $id])
            ->one();

        if (!$model) {
            throw new NotFoundHttpException('Resep tidak ditemukan');
        }
        return $model;
    }

    public function actionCreate(): Resep
    {
        $this->requirePermission('transaksi-resep-create');

        $data = Yii::$app->request->getBodyParams();

        $required = ['kunjungan_id', 'dokter_id'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new \yii\web\BadRequestHttpException("Kolom '$field' wajib diisi");
            }
        }

        $kunjungan = Kunjungan::findActive()->where(['id' => $data['kunjungan_id']])->one();
        if (!$kunjungan) {
            throw new NotFoundHttpException('Kunjungan tidak ditemukan');
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

        $model = new Resep();
        $model->id = \Ramsey\Uuid\Uuid::uuid4()->toString();
        $model->kunjungan_id = $kunjungan->id;
        $model->pemeriksaan_id = $pemeriksaanId;
        $model->dokter_id = $dokter->id;
        $model->catatan = $data['catatan'] ?? '';
        $model->status = Resep::STATUS_DRAFT;
        $model->save(false);

        if (!empty($data['details']) && is_array($data['details'])) {
            $total = 0;
            foreach ($data['details'] as $detailData) {
                $obat = Obat::findActive()->where(['id' => $detailData['obat_id']])->one();
                if (!$obat) {
                    continue;
                }

                $qty = (int) ($detailData['qty'] ?? 1);
                $harga = $detailData['harga'] ?? $obat->selling_price;

                $detail = new ResepDetail();
                $detail->id = \Ramsey\Uuid\Uuid::uuid4()->toString();
                $detail->resep_id = $model->id;
                $detail->obat_id = $obat->id;
                $detail->qty = $qty;
                $detail->harga_satuan = $harga;
                $detail->subtotal = $harga * $qty;
                $detail->aturan_pakai = $detailData['aturan_pakai'] ?? '';
                $detail->jumlah_hari = $detailData['jumlah_hari'] ?? 0;
                $detail->catatan = $detailData['catatan'] ?? '';
                $detail->dispensed_quantity = 0;
                $detail->save(false);

                $total += $detail->subtotal;
            }
            $model->total = $total;
            $model->save(false, ['total']);
        }

        Yii::$app->auditLogger->logCreate('Resep', $model->id, $model->toArray());

        return $model;
    }

    public function actionUpdate(string $id): Resep
    {
        $this->requirePermission('transaksi-resep-update');

        $model = Resep::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Resep tidak ditemukan');
        }

        if ($model->status !== Resep::STATUS_DRAFT) {
            throw new \yii\web\BadRequestHttpException('Resep tidak dapat diperbarui pada status saat ini');
        }

        $oldData = $model->toArray();
        $data = Yii::$app->request->getBodyParams();

        $model->catatan = $data['catatan'] ?? $model->catatan;

        if (!empty($data['details']) && is_array($data['details'])) {
            foreach ($model->resepDetail as $detail) {
                $detail->is_deleted = true;
                $detail->deleted_at = date('Y-m-d H:i:s');
                $detail->save(false, ['is_deleted', 'deleted_at']);
            }

            $total = 0;
            foreach ($data['details'] as $detailData) {
                $obat = Obat::findActive()->where(['id' => $detailData['obat_id']])->one();
                if (!$obat) {
                    continue;
                }

                $qty = (int) ($detailData['qty'] ?? 1);
                $harga = $detailData['harga'] ?? $obat->selling_price;

                $detail = new ResepDetail();
                $detail->id = \Ramsey\Uuid\Uuid::uuid4()->toString();
                $detail->resep_id = $model->id;
                $detail->obat_id = $obat->id;
                $detail->qty = $qty;
                $detail->harga_satuan = $harga;
                $detail->subtotal = $harga * $qty;
                $detail->aturan_pakai = $detailData['aturan_pakai'] ?? '';
                $detail->jumlah_hari = $detailData['jumlah_hari'] ?? 0;
                $detail->catatan = $detailData['catatan'] ?? '';
                $detail->dispensed_quantity = 0;
                $detail->save(false);

                $total += $detail->subtotal;
            }
            $model->total = $total;
            $model->save(false, ['total']);
        }

        if ($model->save()) {
            Yii::$app->auditLogger->logUpdate('Resep', $model->id, $oldData, $model->toArray());
            return $model;
        }

        throw new \yii\web\UnprocessableEntityHttpException(json_encode($model->errors));
    }

    public function actionDelete(string $id): array
    {
        $this->requirePermission('transaksi-resep-delete');

        $model = Resep::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Resep tidak ditemukan');
        }

        if ($model->status !== Resep::STATUS_DRAFT && $model->status !== Resep::STATUS_CANCELLED) {
            throw new \yii\web\BadRequestHttpException('Resep tidak dapat dihapus pada status saat ini');
        }

        $model->status = Resep::STATUS_CANCELLED;
        $model->save(false, ['status']);

        Yii::$app->auditLogger->logUpdate('Resep', $model->id, $model->toArray(), ['status' => Resep::STATUS_CANCELLED]);

        return ['success' => true, 'message' => 'Resep berhasil dibatalkan'];
    }

    public function actionSubmit(string $id): array
    {
        $this->requirePermission('transaksi-resep-submit');

        $model = Resep::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Resep tidak ditemukan');
        }

        if ($model->status !== Resep::STATUS_DRAFT) {
            throw new \yii\web\BadRequestHttpException('Resep tidak berstatus draf');
        }

        if ($model->resepDetail->count() === 0) {
            throw new \yii\web\BadRequestHttpException('Resep tidak memiliki detail');
        }

        $model->status = Resep::STATUS_SUBMITTED;
        $model->submitted_at = date('Y-m-d H:i:s');
        $model->save(false, ['status', 'submitted_at']);

        return ['success' => true, 'message' => 'Resep berhasil dikirim', 'data' => $model];
    }

    public function actionDispense(string $id): array
    {
        $this->requirePermission('transaksi-resep-dispense');

        $model = Resep::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Resep tidak ditemukan');
        }

        if (!in_array($model->status, [Resep::STATUS_SUBMITTED, Resep::STATUS_PARTIAL])) {
            throw new \yii\web\BadRequestHttpException('Resep tidak berstatus valid untuk diserahkan');
        }

        $data = Yii::$app->request->getBodyParams();

        if (!isset($data['details']) || !is_array($data['details'])) {
            throw new \yii\web\BadRequestHttpException('Array detail wajib diisi');
        }

        $transaction = Yii::$app->db->beginTransaction();
        try {
            $allDispensed = true;
            $anyDispensed = false;

            foreach ($data['details'] as $detailData) {
                $detail = ResepDetail::findActive()
                    ->where(['id' => $detailData['detail_id'], 'resep_id' => $id])
                    ->one();

                if (!$detail) {
                    continue;
                }

                $dispensedQty = (int) ($detailData['dispensed_qty'] ?? 0);
                if ($dispensedQty <= 0) {
                    continue;
                }

                $remainingQty = $detail->qty - $detail->dispensed_quantity;
                if ($dispensedQty > $remainingQty) {
                    throw new \yii\web\BadRequestHttpException("Jumlah penyerahan melebihi sisa untuk {$detail->obat->nama}");
                }

                $obat = Obat::findOneForUpdate(['id' => $detail->obat_id]);
                if (!$obat) {
                    throw new \yii\web\BadRequestHttpException("Obat tidak ditemukan");
                }

                if ($obat->current_stock < $dispensedQty) {
                    throw new \yii\web\BadRequestHttpException("Stok tidak mencukupi untuk {$obat->nama} (tersedia: {$obat->current_stock})");
                }

                $obat->current_stock -= $dispensedQty;
                $obat->save(false, ['current_stock']);

                \common\models\ObatStockLog::createLog(
                    $obat->id,
                    $obat->current_stock + $dispensedQty,
                    $obat->current_stock,
                    -$dispensedQty,
                    \common\models\ObatStockLog::TYPE_OUT,
                    'resep',
                    $model->id,
                    "Dispense resep {$model->no_resep}",
                    Yii::$app->user->id ?? 'system'
                );

                $detail->dispensed_quantity += $dispensedQty;
                $detail->save(false, ['dispensed_quantity']);

                $anyDispensed = true;

                if ($detail->dispensed_quantity < $detail->qty) {
                    $allDispensed = false;
                }
            }

            if (!$anyDispensed) {
                throw new \yii\web\BadRequestHttpException('Tidak ada item yang diserahkan');
            }

            if ($allDispensed) {
                $model->status = Resep::STATUS_DISPENSED;
                $model->dispensed_at = date('Y-m-d H:i:s');
            } else {
                $model->status = Resep::STATUS_PARTIAL;
            }
            $model->dispensed_by = Yii::$app->user->id ?? null;
            $model->save(false, ['status', 'dispensed_at', 'dispensed_by']);

            $transaction->commit();

            return ['success' => true, 'message' => 'Resep berhasil diserahkan', 'data' => $model];
        } catch (\Throwable $e) {
            $transaction->rollBack();
            throw new \yii\web\ServerKesalahanHttpException($e->getMessage());
        }
    }

    public function actionByKunjungan(string $kunjunganId): ActiveDataProvider
    {
        $this->requirePermission('transaksi-resep-view');

        $kunjungan = Kunjungan::findActive()->where(['id' => $kunjunganId])->one();
        if (!$kunjungan) {
            throw new NotFoundHttpException('Kunjungan tidak ditemukan');
        }

        $query = Resep::findActive()
            ->where(['kunjungan_id' => $kunjunganId])
            ->with(['dokter.user.profile', 'pemeriksaan', 'resepDetail.obat']);

        return new ActiveDataProvider([
            'query' => $query,
            'pagination' => [
                'pageSize' => Yii::$app->params['pagination.pageSize'],
            ],
        ]);
    }
}
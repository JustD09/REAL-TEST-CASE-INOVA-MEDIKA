<?php

namespace api\modules\v1\controllers;

use Yii;
use yii\data\ActiveDataProvider;
use yii\web\NotFoundHttpException;
use common\models\Pembayaran;
use common\models\Billing;
use common\models\IdempotencyKey;

class PembayaranController extends BaseController
{
    public $modelClass = Pembayaran::class;

    public function actions(): array
    {
        $actions = parent::actions();
        unset($actions['create'], $actions['update'], $actions['delete']);
        return $actions;
    }

    public function actionIndex(): ActiveDataProvider
    {
        $this->requirePermission('transaksi-pembayaran-view');

        $query = Pembayaran::findActive()->with(['billing.kunjungan.pasien.user.profile']);

        $params = Yii::$app->request->queryParams;

        if (!empty($params['billing_id'])) {
            $query->andWhere(['billing_id' => $params['billing_id']]);
        }

        if (!empty($params['status'])) {
            $query->andWhere(['status' => $params['status']]);
        }

        if (!empty($params['method'])) {
            $query->andWhere(['method' => $params['method']]);
        }

        if (!empty($params['tanggal_from']) && !empty($params['tanggal_to'])) {
            $query->andWhere(['between', 'paid_at', $params['tanggal_from'], $params['tanggal_to']]);
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

    public function actionView(string $id): Pembayaran
    {
        $this->requirePermission('transaksi-pembayaran-view');

        $model = Pembayaran::findActive()
            ->with(['billing.kunjungan.pasien.user.profile', 'billing.kunjungan.poli'])
            ->where(['id' => $id])
            ->one();

        if (!$model) {
            throw new NotFoundHttpException('Pembayaran tidak ditemukan');
        }
        return $model;
    }

    public function actionCreate(): Pembayaran
    {
        $this->requirePermission('transaksi-pembayaran-create');

        $data = Yii::$app->request->getBodyParams();

        $required = ['billing_id', 'amount', 'method', 'reference'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new \yii\web\BadRequestHttpException("Kolom '$field' wajib diisi");
            }
        }

        $idempotencyKey = Yii::$app->request->headers->get('Idempotency-Key');
        if ($idempotencyKey) {
            $handler = new \common\components\IdempotencyHandler();
            $result = $handler->process($idempotencyKey, function () use ($data) {
                return $this->processPayment($data);
            });

            if ($result['duplicate'] ?? false) {
                return ['success' => true, 'message' => 'Pembayaran sudah diproses sebelumnya (duplikat)', 'data' => $result['payment'], 'duplicate' => true];
            }

            return ['success' => true, 'message' => 'Pembayaran berhasil diproses', 'data' => $result['payment']];
        }

        $payment = $this->processPayment($data);

        return ['success' => true, 'message' => 'Pembayaran berhasil diproses', 'data' => $payment];
    }

    private function processPayment(array $data): Pembayaran
    {
        $billing = Billing::findActive()->where(['id' => $data['billing_id']])->one();
        if (!$billing) {
            throw new NotFoundHttpException('Billing tidak ditemukan');
        }

        $amount = (float) $data['amount'];
        $method = $data['method'];
        $reference = $data['reference'];
        $notes = $data['notes'] ?? null;

        if ($amount <= 0) {
            throw new \yii\web\BadRequestHttpException('Nominal harus lebih besar dari nol');
        }

        $outstanding = $billing->total - $billing->paid_amount;
        if ($amount > $outstanding + 0.01) {
            throw new \yii\web\BadRequestHttpException("Nominal pembayaran melebihi sisa tagihan ($outstanding)");
        }

        $existingPayment = Pembayaran::findActive()->where(['reference' => $reference])->one();
        if ($existingPayment) {
            throw new \yii\web\ConflictHttpException('Referensi pembayaran sudah digunakan');
        }

        $payment = new Pembayaran();
        $payment->id = \Ramsey\Uuid\Uuid::uuid4()->toString();
        $payment->billing_id = $billing->id;
        $payment->no_bukti = $payment->generateNoBukti();
        $payment->amount = $amount;
        $payment->method = $method;
        $payment->reference = $reference;
        $payment->notes = $notes;
        $payment->status = Pembayaran::STATUS_SUCCESS;
        $payment->paid_at = date('Y-m-d H:i:s');
        $payment->save(false);

        $billing->applyPayment($amount);

        Yii::$app->auditLogger->logPayment($billing->id, $amount, $method, 'success', $reference);

        return $payment;
    }

    public function actionRefund(string $id): array
    {
        $this->requirePermission('transaksi-pembayaran-refund');

        $payment = Pembayaran::findActive()->where(['id' => $id])->one();
        if (!$payment) {
            throw new NotFoundHttpException('Pembayaran tidak ditemukan');
        }

        if ($payment->status !== Pembayaran::STATUS_SUCCESS) {
            throw new \yii\web\BadRequestHttpException('Hanya pembayaran berhasil yang dapat dibatalkan');
        }

        $data = Yii::$app->request->getBodyParams();
        $reason = $data['reason'] ?? 'Refund';

        $transaction = Yii::$app->db->beginTransaction();
        try {
            $payment->status = Pembayaran::STATUS_REFUNDED;
            $payment->notes = ($payment->notes ? $payment->notes . "\n" : '') . "Refund: $reason";
            $payment->refunded_at = date('Y-m-d H:i:s');
            $payment->refunded_by = Yii::$app->user->id ?? null;
            $payment->save(false, ['status', 'notes', 'refunded_at', 'refunded_by']);

            $billing = $payment->billing;
            $billing->paid_amount -= $payment->amount;
            if ($billing->paid_amount <= 0.01) {
                $billing->status = Billing::STATUS_UNPAID;
                $billing->paid_at = null;
            } elseif ($billing->paid_amount < $billing->total - 0.01) {
                $billing->status = Billing::STATUS_PARTIAL;
            }
            $billing->save(false, ['paid_amount', 'status', 'paid_at']);

            $transaction->commit();

            Yii::$app->auditLogger->logPayment($billing->id, -$payment->amount, $payment->method, 'refund', $payment->reference);

            return ['success' => true, 'message' => 'Pembayaran berhasil dibatalkan', 'data' => $payment];
        } catch (\Throwable $e) {
            $transaction->rollBack();
            throw new \yii\web\ServerKesalahanHttpException($e->getMessage());
        }
    }

    public function actionVoid(string $id): array
    {
        $this->requirePermission('transaksi-pembayaran-void');

        $payment = Pembayaran::findActive()->where(['id' => $id])->one();
        if (!$payment) {
            throw new NotFoundHttpException('Pembayaran tidak ditemukan');
        }

        if ($payment->status !== Pembayaran::STATUS_SUCCESS) {
            throw new \yii\web\BadRequestHttpException('Hanya pembayaran berhasil yang dapat dibatalkan');
        }

        $data = Yii::$app->request->getBodyParams();
        $reason = $data['reason'] ?? 'Void';

        $transaction = Yii::$app->db->beginTransaction();
        try {
            $payment->status = Pembayaran::STATUS_VOIDED;
            $payment->notes = ($payment->notes ? $payment->notes . "\n" : '') . "Void: $reason";
            $payment->voided_at = date('Y-m-d H:i:s');
            $payment->voided_by = Yii::$app->user->id ?? null;
            $payment->save(false, ['status', 'notes', 'voided_at', 'voided_by']);

            $billing = $payment->billing;
            $billing->paid_amount -= $payment->amount;
            if ($billing->paid_amount <= 0.01) {
                $billing->status = Billing::STATUS_UNPAID;
                $billing->paid_at = null;
            } elseif ($billing->paid_amount < $billing->total - 0.01) {
                $billing->status = Billing::STATUS_PARTIAL;
            }
            $billing->save(false, ['paid_amount', 'status', 'paid_at']);

            $transaction->commit();

            Yii::$app->auditLogger->logPayment($billing->id, -$payment->amount, $payment->method, 'void', $payment->reference);

            return ['success' => true, 'message' => 'Pembayaran berhasil dibatalkan', 'data' => $payment];
        } catch (\Throwable $e) {
            $transaction->rollBack();
            throw new \yii\web\ServerKesalahanHttpException($e->getMessage());
        }
    }

    public function actionByBilling(string $billingId): ActiveDataProvider
    {
        $this->requirePermission('transaksi-pembayaran-view');

        $billing = Billing::findActive()->where(['id' => $billingId])->one();
        if (!$billing) {
            throw new NotFoundHttpException('Billing tidak ditemukan');
        }

        $query = Pembayaran::findActive()->where(['billing_id' => $billingId]);

        return new ActiveDataProvider([
            'query' => $query,
            'pagination' => [
                'pageSize' => Yii::$app->params['pagination.pageSize'],
            ],
        ]);
    }

    public function actionMethods(): array
    {
        $this->requirePermission('transaksi-pembayaran-view');

        return [
            'success' => true,
            'data' => [
                Pembayaran::METHOD_CASH => 'Tunai',
                Pembayaran::METHOD_CARD => 'Kartu Debit/Kredit',
                Pembayaran::METHOD_TRANSFER => 'Transfer Bank',
                Pembayaran::METHOD_EWALLET => 'E-Wallet',
                Pembayaran::METHOD_BPJS => 'BPJS',
                Pembayaran::METHOD_INSURANCE => 'Asuransi',
                Pembayaran::METHOD_OTHER => 'Lainnya',
            ],
        ];
    }
}
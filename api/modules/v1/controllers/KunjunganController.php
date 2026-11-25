<?php

namespace api\modules\v1\controllers;

use Yii;
use yii\data\ActiveDataProvider;
use yii\web\NotFoundHttpException;
use common\models\Kunjungan;
use common\models\Pasien;
use common\models\Poli;
use common\models\Dokter;
use common\models\JadwalPraktik;
use common\models\Antrean;

class KunjunganController extends BaseController
{
    public $modelClass = Kunjungan::class;
    
    public function actions(): array
    {
        $actions = parent::actions();
        unset($actions['create'], $actions['update'], $actions['delete']);
        return $actions;
    }
    
    public function actionIndex(): ActiveDataProvider
    {
        $this->requirePermission('transaksi-pendaftaran-view');
        
        $query = Kunjungan::findActive()->with(['pasien.user.profile', 'poli', 'dokter', 'antrean']);
        
        $params = Yii::$app->request->queryParams;
        
        if (!empty($params['pasien_id'])) {
            $query->andWhere(['pasien_id' => $params['pasien_id']]);
        }
        
        if (!empty($params['poli_id'])) {
            $query->andWhere(['poli_id' => $params['poli_id']]);
        }
        
        if (!empty($params['dokter_id'])) {
            $query->andWhere(['dokter_id' => $params['dokter_id']]);
        }
        
        if (!empty($params['tanggal'])) {
            $query->andWhere(['tanggal' => $params['tanggal']]);
        } elseif (!empty($params['tanggal_from']) && !empty($params['tanggal_to'])) {
            $query->andWhere(['between', 'tanggal', $params['tanggal_from'], $params['tanggal_to']]);
        }
        
        if (!empty($params['status'])) {
            $query->andWhere(['status' => $params['status']]);
        }
        
        if (!empty($params['type'])) {
            $query->andWhere(['type' => $params['type']]);
        }
        
        return new ActiveDataProvider([
            'query' => $query,
            'pagination' => [
                'pageSize' => Yii::$app->params['pagination.pageSize'],
            ],
            'sort' => [
                'defaultOrder' => ['tanggal' => SORT_DESC, 'no_antrean' => SORT_ASC],
            ],
        ]);
    }
    
    public function actionView(string $id): Kunjungan
    {
        $this->requirePermission('transaksi-pendaftaran-view');
        
        $model = Kunjungan::findActive()
            ->with(['pasien.user.profile', 'poli', 'dokter', 'jadwal', 'antrean', 'pemeriksaan', 'rekamMedis', 'tindakanMedis', 'resep', 'laboratorium', 'billing'])
            ->where(['id' => $id])
            ->one();
        
        if (!$model) {
            throw new NotFoundHttpException('Kunjungan tidak ditemukan');
        }
        return $model;
    }
    
    public function actionCreate(): Kunjungan
    {
        $this->requirePermission('transaksi-pendaftaran-create');
        
        $data = Yii::$app->request->getBodyParams();
        
        // Validasi kolom wajib
        $required = ['pasien_id', 'poli_id', 'tanggal'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new \yii\web\BadRequestHttpException("Kolom '$field' wajib diisi");
            }
        }
        
        // Periksa keberadaan pasien
        $pasien = Pasien::findActive()->where(['id' => $data['pasien_id']])->one();
        if (!$pasien) {
            throw new NotFoundHttpException('Pasien tidak ditemukan');
        }
        
        // Periksa keberadaan poli
        $poli = Poli::findActive()->where(['id' => $data['poli_id']])->one();
        if (!$poli) {
            throw new NotFoundHttpException('Poli tidak ditemukan');
        }
        
        // Validasi dokter dan jadwal jika diisi
        $dokterId = $data['dokter_id'] ?? null;
        $jadwalId = $data['jadwal_id'] ?? null;
        
        if ($dokterId) {
            $dokter = Dokter::findActive()->where(['id' => $dokterId])->one();
            if (!$dokter) {
                throw new NotFoundHttpException('Dokter tidak ditemukan');
            }
        }
        
        if ($jadwalId) {
            $jadwal = JadwalPraktik::findActive()->where(['id' => $jadwalId])->one();
            if (!$jadwal || !$jadwal->isEffectiveOn($data['tanggal'])) {
                throw new \yii\web\BadRequestHttpException('Jadwal tidak valid untuk tanggal tersebut');
            }
        }
        
        try {
            $kunjungan = Kunjungan::createRegistration(
                $data['pasien_id'],
                $data['poli_id'],
                $data['tanggal'],
                $dokterId,
                $jadwalId,
                $data['type'] ?? Kunjungan::TYPE_BARU,
                $data['keluhan'] ?? '',
                $data['is_bpjs'] ?? false,
                $data['bpjs_referral_number'] ?? null
            );
            
            Yii::$app->auditLogger->logCreate('Kunjungan', $kunjungan->id, $kunjungan->toArray());
            
            return $kunjungan;
        } catch (\Throwable $e) {
            throw new \yii\web\BadRequestHttpException($e->getMessage());
        }
    }
    
    public function actionUpdate(string $id): Kunjungan
    {
        $this->requirePermission('transaksi-pendaftaran-update');
        
        $model = Kunjungan::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Kunjungan tidak ditemukan');
        }
        
        if (!$model->canBeCancelled() && $model->status !== Kunjungan::STATUS_WAITING) {
            throw new \yii\web\BadRequestHttpException('Kunjungan tidak dapat diperbarui pada status saat ini');
        }
        
        $oldData = $model->toArray();
        $data = Yii::$app->request->getBodyParams();
        
        $model->dokter_id = $data['dokter_id'] ?? $model->dokter_id;
        $model->jadwal_id = $data['jadwal_id'] ?? $model->jadwal_id;
        $model->keluhan = $data['keluhan'] ?? $model->keluhan;
        $model->type = $data['type'] ?? $model->type;
        $model->is_bpjs = $data['is_bpjs'] ?? $model->is_bpjs;
        $model->bpjs_referral_number = $data['bpjs_referral_number'] ?? $model->bpjs_referral_number;
        $model->notes = $data['notes'] ?? $model->notes;
        
        if ($model->save()) {
            Yii::$app->auditLogger->logUpdate('Kunjungan', $model->id, $oldData, $model->toArray());
            return $model;
        }
        
        throw new \yii\web\UnprocessableEntityHttpException(json_encode($model->errors));
    }
    
    public function actionDelete(string $id): array
    {
        $this->requirePermission('transaksi-pendaftaran-cancel');
        
        $model = Kunjungan::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Kunjungan tidak ditemukan');
        }
        
        $reason = Yii::$app->request->post('reason', 'Dibatalkan via API');
        
        if (!$model->cancel($reason)) {
            throw new \yii\web\BadRequestHttpException('Kunjungan tidak dapat dibatalkan pada status saat ini');
        }
        
        // Batalkan antrean terkait
        if ($model->antrean) {
            $model->antrean->status = Antrean::STATUS_CANCELLED;
            $model->antrean->save(false, ['status']);
        }
        
        Yii::$app->auditLogger->logUpdate('Kunjungan', $model->id, $model->toArray(), ['status' => Kunjungan::STATUS_CANCELLED]);
        
        return ['success' => true, 'message' => 'Kunjungan berhasil dibatalkan'];
    }
    
    // Manajemen antrean
    public function actionCall(string $id): array
    {
        $this->requirePermission('transaksi-antrean-call');
        
        $model = Kunjungan::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Kunjungan tidak ditemukan');
        }
        
        if (!$model->callPatient()) {
            throw new \yii\web\BadRequestHttpException('Pasien tidak dapat dipanggil pada status saat ini');
        }
        
        if ($model->antrean) {
            $model->antrean->call();
        }
        
        return ['success' => true, 'message' => 'Pasien berhasil dipanggil', 'data' => $model];
    }
    
    public function actionComplete(string $id): array
    {
        $this->requirePermission('transaksi-pendaftaran-update');
        
        $model = Kunjungan::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Kunjungan tidak ditemukan');
        }
        
        if (!$model->complete()) {
            throw new \yii\web\BadRequestHttpException('Kunjungan tidak dapat diselesaikan pada status saat ini');
        }
        
        if ($model->antrean) {
            $model->antrean->complete();
        }
        
        return ['success' => true, 'message' => 'Kunjungan berhasil diselesaikan', 'data' => $model];
    }
    
    // Status antrean
    public function actionQueue(string $poliId, string $date = null): array
    {
        $this->requirePermission('transaksi-antrean-view');
        
        $date = $date ?? date('Y-m-d');
        
        $queue = Antrean::findActive()
            ->where(['poli_id' => $poliId, 'tanggal' => $date])
            ->andWhere(['in', 'status', [Antrean::STATUS_WAITING, Antrean::STATUS_CALLED, Antrean::STATUS_IN_PROGRESS]])
            ->orderBy(['no_antrean' => SORT_ASC])
            ->with(['kunjungan.pasien.user.profile'])
            ->all();
        
        $current = Antrean::getCurrentQueue($poliId, $date);
        $waitingCount = Antrean::getWaitingCount($poliId, $date);
        
        return [
            'success' => true,
            'data' => [
                'poli_id' => $poliId,
                'tanggal' => $date,
                'current' => $current,
                'waiting_count' => $waitingCount,
                'queue' => $queue,
            ],
        ];
    }
    
    // Slot pendaftaran yang tersedia
    public function actionAvailableSlots(string $poliId, string $date): array
    {
        $this->requirePermission('transaksi-pendaftaran-create');
        
        $poli = Poli::findActive()->where(['id' => $poliId])->one();
        if (!$poli) {
            throw new NotFoundHttpException('Poli tidak ditemukan');
        }
        
        $dayOfWeek = (int) date('w', strtotime($date));
        
        $schedules = JadwalPraktik::findActive()
            ->where(['poli_id' => $poliId, 'day_of_week' => $dayOfWeek])
            ->andWhere(['<=', 'effective_from', $date])
            ->andWhere(['or', ['effective_until' => null], ['>=', 'effective_until', $date]])
            ->with(['dokter.user.profile'])
            ->all();
        
        $slots = [];
        foreach ($schedules as $schedule) {
            $bookedCount = Kunjungan::find()
                ->where([
                    'dokter_id' => $schedule->dokter_id,
                    'poli_id' => $poliId,
                    'tanggal' => $date,
                ])
                ->andWhere(['in', 'status', [Kunjungan::STATUS_WAITING, Kunjungan::STATUS_IN_PROGRESS, Kunjungan::STATUS_DONE]])
                ->count();
            
            $available = max(0, $schedule->quota - $bookedCount);
            
            if ($available > 0) {
                $slots[] = [
                    'jadwal_id' => $schedule->id,
                    'dokter' => $schedule->dokter,
                    'start_time' => $schedule->start_time,
                    'end_time' => $schedule->end_time,
                    'quota' => $schedule->quota,
                    'booked' => $bookedCount,
                    'available' => $available,
                ];
            }
        }
        
        return [
            'success' => true,
            'data' => [
                'poli' => $poli,
                'tanggal' => $date,
                'slots' => $slots,
            ],
        ];
    }
}
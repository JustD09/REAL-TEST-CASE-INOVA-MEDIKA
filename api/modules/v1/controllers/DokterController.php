<?php

namespace api\modules\v1\controllers;

use Yii;
use yii\data\ActiveDataProvider;
use yii\web\NotFoundHttpException;
use common\models\Dokter;
use common\models\Specialist;
use common\models\Poli;
use common\models\JadwalPraktik;

class DokterController extends BaseController
{
    public $modelClass = Dokter::class;

    public function actions(): array
    {
        $actions = parent::actions();
        unset($actions['create'], $actions['update'], $actions['delete']);
        return $actions;
    }

    public function actionIndex(): ActiveDataProvider
    {
        $this->requirePermission('master-dokter-view');

        $query = Dokter::findActive()->with(['user.profile', 'specialist', 'polis']);

        $params = Yii::$app->request->queryParams;

        if (!empty($params['specialist_id'])) {
            $query->andWhere(['specialist_id' => $params['specialist_id']]);
        }

        if (!empty($params['poli_id'])) {
            $query->innerJoinWith('polis')->andWhere(['poli_id' => $params['poli_id']]);
        }

        if (!empty($params['search'])) {
            $query->innerJoinWith('user.profile')
                ->andWhere(['like', 'profile.full_name', $params['search']]);
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
                'defaultOrder' => ['created_at' => SORT_DESC],
            ],
        ]);
    }

    public function actionView(string $id): Dokter
    {
        $this->requirePermission('master-dokter-view');

        $model = Dokter::findActive()
            ->with(['user.profile', 'specialist', 'polis', 'jadwalPraktik'])
            ->where(['id' => $id])
            ->one();

        if (!$model) {
            throw new NotFoundHttpException('Dokter tidak ditemukan');
        }
        return $model;
    }

    public function actionCreate(): Dokter
    {
        $this->requirePermission('master-dokter-create');

        $data = Yii::$app->request->getBodyParams();

        $required = ['user_id', 'specialist_id', 'nip', 'full_name'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new \yii\web\BadRequestHttpException("Kolom '$field' wajib diisi");
            }
        }

        $user = \common\models\User::find()->where(['id' => $data['user_id']])->one();
        if (!$user) {
            throw new NotFoundHttpException('Pengguna tidak ditemukan');
        }

        $specialist = Specialist::findActive()->where(['id' => $data['specialist_id']])->one();
        if (!$specialist) {
            throw new NotFoundHttpException('Spesialis tidak ditemukan');
        }

        $model = new Dokter();
        $model->id = \Ramsey\Uuid\Uuid::uuid4()->toString();
        $model->user_id = $data['user_id'];
        $model->specialist_id = $data['specialist_id'];
        $model->nip = $data['nip'];
        $model->full_name = $data['full_name'];
        $model->gender = $data['gender'] ?? 'L';
        $model->birth_date = $data['birth_date'] ?? null;
        $model->phone = $data['phone'] ?? null;
        $model->address = $data['address'] ?? null;
        $model->str_number = $data['str_number'] ?? null;
        $model->str_expiry = $data['str_expiry'] ?? null;
        $model->sip_number = $data['sip_number'] ?? null;
        $model->sip_expiry = $data['sip_expiry'] ?? null;
        $model->education = $data['education'] ?? null;
        $model->experience_years = $data['experience_years'] ?? 0;
        $model->consultation_fee = $data['consultation_fee'] ?? 0;
        $model->is_active = $data['is_active'] ?? true;
        $model->save(false);

        if (!empty($data['poli_ids']) && is_array($data['poli_ids'])) {
            foreach ($data['poli_ids'] as $poliId) {
                $poli = Poli::findActive()->where(['id' => $poliId])->one();
                if ($poli) {
                    $model->link('polis', $poli);
                }
            }
        }

        Yii::$app->auditLogger->logCreate('Dokter', $model->id, $model->toArray());

        return $model;
    }

    public function actionUpdate(string $id): Dokter
    {
        $this->requirePermission('master-dokter-update');

        $model = Dokter::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Dokter tidak ditemukan');
        }

        $oldData = $model->toArray();
        $data = Yii::$app->request->getBodyParams();

        $model->specialist_id = $data['specialist_id'] ?? $model->specialist_id;
        $model->nip = $data['nip'] ?? $model->nip;
        $model->full_name = $data['full_name'] ?? $model->full_name;
        $model->gender = $data['gender'] ?? $model->gender;
        $model->birth_date = $data['birth_date'] ?? $model->birth_date;
        $model->phone = $data['phone'] ?? $model->phone;
        $model->address = $data['address'] ?? $model->address;
        $model->str_number = $data['str_number'] ?? $model->str_number;
        $model->str_expiry = $data['str_expiry'] ?? $model->str_expiry;
        $model->sip_number = $data['sip_number'] ?? $model->sip_number;
        $model->sip_expiry = $data['sip_expiry'] ?? $model->sip_expiry;
        $model->education = $data['education'] ?? $model->education;
        $model->experience_years = $data['experience_years'] ?? $model->experience_years;
        $model->consultation_fee = $data['consultation_fee'] ?? $model->consultation_fee;
        $model->is_active = $data['is_active'] ?? $model->is_active;

        if ($model->save()) {
            if (isset($data['poli_ids']) && is_array($data['poli_ids'])) {
                $model->unlinkAll('polis', true);
                foreach ($data['poli_ids'] as $poliId) {
                    $poli = Poli::findActive()->where(['id' => $poliId])->one();
                    if ($poli) {
                        $model->link('polis', $poli);
                    }
                }
            }
            Yii::$app->auditLogger->logUpdate('Dokter', $model->id, $oldData, $model->toArray());
            return $model;
        }

        throw new \yii\web\UnprocessableEntityHttpException(json_encode($model->errors));
    }

    public function actionDelete(string $id): array
    {
        $this->requirePermission('master-dokter-delete');

        $model = Dokter::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Dokter tidak ditemukan');
        }

        $model->is_deleted = true;
        $model->deleted_at = date('Y-m-d H:i:s');
        $model->save(false, ['is_deleted', 'deleted_at']);

        Yii::$app->auditLogger->logDelete('Dokter', $id, $model->toArray());

        return ['success' => true, 'message' => 'Dokter deleted'];
    }

    public function actionSchedules(string $id): ActiveDataProvider
    {
        $this->requirePermission('master-dokter-view');

        $dokter = Dokter::findActive()->where(['id' => $id])->one();
        if (!$dokter) {
            throw new NotFoundHttpException('Dokter tidak ditemukan');
        }

        $query = JadwalPraktik::findActive()
            ->where(['dokter_id' => $id])
            ->with(['poli'])
            ->orderBy(['day_of_week' => SORT_ASC, 'start_time' => SORT_ASC]);

        return new ActiveDataProvider([
            'query' => $query,
            'pagination' => [
                'pageSize' => Yii::$app->params['pagination.pageSize'],
            ],
        ]);
    }

    public function actionAvailableDates(string $id): array
    {
        $this->requirePermission('master-dokter-view');

        $dokter = Dokter::findActive()->where(['id' => $id])->one();
        if (!$dokter) {
            throw new NotFoundHttpException('Dokter tidak ditemukan');
        }

        $days = (int) (Yii::$app->request->get('days', 30));
        $startDate = date('Y-m-d');
        $endDate = date('Y-m-d', strtotime("+$days days"));

        $schedules = JadwalPraktik::findActive()
            ->where(['dokter_id' => $id])
            ->andWhere(['<=', 'effective_from', $endDate])
            ->andWhere(['or', ['effective_until' => null], ['>=', 'effective_until', $startDate]])
            ->all();

        $availableDates = [];
        $currentDate = strtotime($startDate);
        $endTimestamp = strtotime($endDate);

        while ($currentDate <= $endTimestamp) {
            $dateStr = date('Y-m-d', $currentDate);
            $dayOfWeek = (int) date('w', $currentDate);

            foreach ($schedules as $schedule) {
                if ($schedule->day_of_week === $dayOfWeek &&
                    $schedule->effective_from <= $dateStr &&
                    ($schedule->effective_until === null || $schedule->effective_until >= $dateStr)) {
                    
                    $bookedCount = \common\models\Kunjungan::find()
                        ->where([
                            'dokter_id' => $id,
                            'poli_id' => $schedule->poli_id,
                            'tanggal' => $dateStr,
                        ])
                        ->andWhere(['in', 'status', [\common\models\Kunjungan::STATUS_WAITING, \common\models\Kunjungan::STATUS_IN_PROGRESS, \common\models\Kunjungan::STATUS_DONE]])
                        ->count();

                    $available = max(0, $schedule->quota - $bookedCount);

                    if ($available > 0) {
                        $availableDates[] = [
                            'date' => $dateStr,
                            'day' => date('l', $currentDate),
                            'poli' => $schedule->poli,
                            'schedule' => [
                                'id' => $schedule->id,
                                'start_time' => $schedule->start_time,
                                'end_time' => $schedule->end_time,
                                'quota' => $schedule->quota,
                                'booked' => $bookedCount,
                                'available' => $available,
                            ],
                        ];
                    }
                }
            }

            $currentDate = strtotime('+1 day', $currentDate);
        }

        return [
            'success' => true,
            'data' => [
                'dokter' => $dokter,
                'available_dates' => $availableDates,
            ],
        ];
    }
}
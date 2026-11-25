<?php

namespace api\modules\v1\controllers;

use Yii;
use yii\data\ActiveDataProvider;
use yii\web\NotFoundHttpException;
use common\models\Pasien;
use common\models\User;
use common\models\Profile;

class PasienController extends BaseController
{
    public $modelClass = Pasien::class;

    public function actions(): array
    {
        $actions = parent::actions();
        unset($actions['create'], $actions['update'], $actions['delete']);
        return $actions;
    }

    public function actionIndex(): ActiveDataProvider
    {
        $this->requirePermission('master-pasien-view');

        $query = Pasien::findActive()->with(['user.profile']);

        $params = Yii::$app->request->queryParams;

        if (!empty($params['no_rm'])) {
            $query->andWhere(['like', 'no_rm', $params['no_rm']]);
        }

        if (!empty($params['registration_type'])) {
            $query->andWhere(['registration_type' => $params['registration_type']]);
        }

        if (!empty($params['search'])) {
            $query->innerJoinWith('user.profile')
                ->andWhere(['or',
                    ['like', 'profile.full_name', $params['search']],
                    ['like', 'profile.nik', $params['search']],
                    ['like', 'user.email', $params['search']],
                    ['like', 'user.phone', $params['search']],
                ]);
        }

        if (!empty($params['bpjs_number'])) {
            $query->andWhere(['bpjs_number' => $params['bpjs_number']]);
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

    public function actionView(string $id): Pasien
    {
        $this->requirePermission('master-pasien-view');

        $model = Pasien::findActive()
            ->with(['user.profile'])
            ->where(['id' => $id])
            ->one();

        if (!$model) {
            throw new NotFoundHttpException('Pasien tidak ditemukan');
        }
        return $model;
    }

    public function actionCreate(): Pasien
    {
        $this->requirePermission('master-pasien-create');

        $data = Yii::$app->request->getBodyParams();

        $required = ['nik', 'full_name', 'gender', 'birth_date'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new \yii\web\BadRequestHttpException("Kolom '$field' wajib diisi");
            }
        }

        if (Profile::find()->where(['nik' => $data['nik']])->exists()) {
            throw new \yii\web\BadRequestHttpException('NIK sudah terdaftar');
        }

        $email = $data['email'] ?? null;
        $phone = $data['phone'] ?? null;

        if ($email && User::find()->where(['email' => $email])->exists()) {
            throw new \yii\web\BadRequestHttpException('Email sudah terdaftar');
        }

        if ($phone && User::find()->where(['phone' => $phone])->exists()) {
            throw new \yii\web\BadRequestHttpException('Nomor telepon sudah terdaftar');
        }

        $transaction = Yii::$app->db->beginTransaction();
        try {
            $user = new User();
            $user->id = \Ramsey\Uuid\Uuid::uuid4()->toString();
            $user->username = 'pasien_' . substr($data['nik'], -6) . '_' . time();
            $user->email = $email;
            $user->phone = $phone;
            $user->password = $data['password'] ?? 'pasien123';
            $user->status = User::STATUS_ACTIVE;
            $user->save(false);

            $profile = new Profile();
            $profile->id = \Ramsey\Uuid\Uuid::uuid4()->toString();
            $profile->user_id = $user->id;
            $profile->full_name = $data['full_name'];
            $profile->nik = $data['nik'];
            $profile->gender = $data['gender'];
            $profile->birth_date = $data['birth_date'];
            $profile->birth_place = $data['birth_place'] ?? '';
            $profile->phone = $phone;
            $profile->address = $data['address'] ?? '';
            $profile->rt = $data['rt'] ?? '';
            $profile->rw = $data['rw'] ?? '';
            $profile->kelurahan = $data['kelurahan'] ?? '';
            $profile->kecamatan = $data['kecamatan'] ?? '';
            $profile->kota = $data['kota'] ?? '';
            $profile->provinsi = $data['provinsi'] ?? '';
            $profile->kode_pos = $data['kode_pos'] ?? '';
            $profile->blood_type = $data['blood_type'] ?? '';
            $profile->religion = $data['religion'] ?? '';
            $profile->marital_status = $data['marital_status'] ?? '';
            $profile->occupation = $data['occupation'] ?? '';
            $profile->emergency_contact_name = $data['emergency_contact_name'] ?? '';
            $profile->emergency_contact_phone = $data['emergency_contact_phone'] ?? '';
            $profile->emergency_contact_relation = $data['emergency_contact_relation'] ?? '';
            $profile->save(false);

            $pasien = new Pasien();
            $pasien->user_id = $user->id;
            $pasien->registration_type = $data['registration_type'] ?? Pasien::REGISTRATION_UMUM;
            $pasien->bpjs_number = $data['bpjs_number'] ?? null;
            $pasien->bpjs_class = $data['bpjs_class'] ?? null;
            $pasien->bpjs_faskes_level = $data['bpjs_faskes_level'] ?? null;
            $pasien->bpjs_cob = $data['bpjs_cob'] ?? null;
            $pasien->save(false);

            $transaction->commit();

            Yii::$app->auditLogger->logCreate('Pasien', $pasien->id, $pasien->toArray());

            return $pasien;
        } catch (\Throwable $e) {
            $transaction->rollBack();
            throw new \yii\web\ServerKesalahanHttpException($e->getMessage());
        }
    }

    public function actionUpdate(string $id): Pasien
    {
        $this->requirePermission('master-pasien-update');

        $model = Pasien::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Pasien tidak ditemukan');
        }

        $oldData = $model->toArray();
        $data = Yii::$app->request->getBodyParams();

        $profile = $model->user->profile;
        if ($profile) {
            $profile->full_name = $data['full_name'] ?? $profile->full_name;
            $profile->gender = $data['gender'] ?? $profile->gender;
            $profile->birth_date = $data['birth_date'] ?? $profile->birth_date;
            $profile->birth_place = $data['birth_place'] ?? $profile->birth_place;
            $profile->phone = $data['phone'] ?? $profile->phone;
            $profile->address = $data['address'] ?? $profile->address;
            $profile->rt = $data['rt'] ?? $profile->rt;
            $profile->rw = $data['rw'] ?? $profile->rw;
            $profile->kelurahan = $data['kelurahan'] ?? $profile->kelurahan;
            $profile->kecamatan = $data['kecamatan'] ?? $profile->kecamatan;
            $profile->kota = $data['kota'] ?? $profile->kota;
            $profile->provinsi = $data['provinsi'] ?? $profile->provinsi;
            $profile->kode_pos = $data['kode_pos'] ?? $profile->kode_pos;
            $profile->blood_type = $data['blood_type'] ?? $profile->blood_type;
            $profile->religion = $data['religion'] ?? $profile->religion;
            $profile->marital_status = $data['marital_status'] ?? $profile->marital_status;
            $profile->occupation = $data['occupation'] ?? $profile->occupation;
            $profile->emergency_contact_name = $data['emergency_contact_name'] ?? $profile->emergency_contact_name;
            $profile->emergency_contact_phone = $data['emergency_contact_phone'] ?? $profile->emergency_contact_phone;
            $profile->emergency_contact_relation = $data['emergency_contact_relation'] ?? $profile->emergency_contact_relation;
            $profile->save(false);
        }

        $model->registration_type = $data['registration_type'] ?? $model->registration_type;
        $model->bpjs_number = $data['bpjs_number'] ?? $model->bpjs_number;
        $model->bpjs_class = $data['bpjs_class'] ?? $model->bpjs_class;
        $model->bpjs_faskes_level = $data['bpjs_faskes_level'] ?? $model->bpjs_faskes_level;
        $model->bpjs_cob = $data['bpjs_cob'] ?? $model->bpjs_cob;

        if ($model->save()) {
            Yii::$app->auditLogger->logUpdate('Pasien', $model->id, $oldData, $model->toArray());
            return $model;
        }

        throw new \yii\web\UnprocessableEntityHttpException(json_encode($model->errors));
    }

    public function actionDelete(string $id): array
    {
        $this->requirePermission('master-pasien-delete');

        $model = Pasien::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Pasien tidak ditemukan');
        }

        $kunjunganCount = \common\models\Kunjungan::find()->where(['pasien_id' => $id, 'is_deleted' => false])->count();
        if ($kunjunganCount > 0) {
            throw new \yii\web\BadRequestHttpException('Pasien dengan kunjungan tidak dapat dihapus');
        }

        $model->is_deleted = true;
        $model->deleted_at = date('Y-m-d H:i:s');
        $model->save(false, ['is_deleted', 'deleted_at']);

        $user = $model->user;
        $user->is_deleted = true;
        $user->deleted_at = date('Y-m-d H:i:s');
        $user->save(false, ['is_deleted', 'deleted_at']);

        if ($user->profile) {
            $user->profile->is_deleted = true;
            $user->profile->deleted_at = date('Y-m-d H:i:s');
            $user->profile->save(false, ['is_deleted', 'deleted_at']);
        }

        Yii::$app->auditLogger->logDelete('Pasien', $id, $model->toArray());

        return ['success' => true, 'message' => 'Pasien berhasil dihapus'];
    }

    public function actionSearch(): array
    {
        $this->requirePermission('master-pasien-view');

        $q = Yii::$app->request->get('q', '');
        $limit = (int) Yii::$app->request->get('limit', 10);

        if (strlen($q) < 2) {
            return ['success' => true, 'data' => []];
        }

        $results = Pasien::findActive()
            ->innerJoinWith('user.profile')
            ->where(['or',
                ['like', 'pasien.no_rm', $q],
                ['like', 'profile.full_name', $q],
                ['like', 'profile.nik', $q],
                ['like', 'user.email', $q],
                ['like', 'user.phone', $q],
            ])
            ->limit($limit)
            ->with(['user.profile'])
            ->asArray()
            ->all();

        return ['success' => true, 'data' => $results];
    }

    public function actionByNik(string $nik): array
    {
        $this->requirePermission('master-pasien-view');

        $profile = Profile::find()->where(['nik' => $nik])->with('user.pasien')->one();

        if (!$profile) {
            throw new NotFoundHttpException('Pasien tidak ditemukan');
        }

        return ['success' => true, 'data' => $profile->user->pasien];
    }

    public function actionKunjungan(string $id): ActiveDataProvider
    {
        $this->requirePermission('master-pasien-view');

        $pasien = Pasien::findActive()->where(['id' => $id])->one();
        if (!$pasien) {
            throw new NotFoundHttpException('Pasien tidak ditemukan');
        }

        $query = \common\models\Kunjungan::findActive()
            ->where(['pasien_id' => $id])
            ->with(['poli', 'dokter', 'antrean']);

        return new ActiveDataProvider([
            'query' => $query,
            'pagination' => [
                'pageSize' => Yii::$app->params['pagination.pageSize'],
            ],
            'sort' => [
                'defaultOrder' => ['tanggal' => SORT_DESC],
            ],
        ]);
    }

    public function actionRekamMedis(string $id): ActiveDataProvider
    {
        $this->requirePermission('transaksi-pemeriksaan-view');

        $pasien = Pasien::findActive()->where(['id' => $id])->one();
        if (!$pasien) {
            throw new NotFoundHttpException('Pasien tidak ditemukan');
        }

        $query = \common\models\RekamMedis::findActive()
            ->innerJoinWith('kunjungan')
            ->where(['kunjungan.pasien_id' => $id])
            ->with(['kunjungan.poli', 'kunjungan.dokter', 'diagnosaUtama', 'pemeriksaan']);

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
}
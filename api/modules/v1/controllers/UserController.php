<?php

namespace api\modules\v1\controllers;

use Yii;
use yii\data\ActiveDataProvider;
use yii\web\NotFoundHttpException;
use common\models\User;
use common\models\Profile;
use common\models\AuthAssignment;
use common\models\AuthItem;

class UserController extends BaseController
{
    public $modelClass = User::class;

    public function actions(): array
    {
        $actions = parent::actions();
        unset($actions['create'], $actions['update'], $actions['delete']);
        return $actions;
    }

    public function actionIndex(): ActiveDataProvider
    {
        $this->requirePermission('pengaturan-user-view');

        $query = User::findActive()->with(['profile', 'authAssignments.item']);

        $params = Yii::$app->request->queryParams;

        if (!empty($params['search'])) {
            $query->andWhere(['or',
                ['like', 'username', $params['search']],
                ['like', 'email', $params['search']],
                ['like', 'phone', $params['search']],
            ]);
        }

        if (!empty($params['status'])) {
            $query->andWhere(['status' => (int)$params['status']]);
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

    public function actionView(string $id): User
    {
        $this->requirePermission('pengaturan-user-view');

        $model = User::findActive()
            ->with(['profile', 'authAssignments.item'])
            ->where(['id' => $id])
            ->one();

        if (!$model) {
            throw new NotFoundHttpException('Pengguna tidak ditemukan');
        }
        return $model;
    }

    public function actionCreate(): User
    {
        $this->requirePermission('pengaturan-user-create');

        $data = Yii::$app->request->getBodyParams();

        $required = ['username', 'email', 'full_name'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                throw new \yii\web\BadRequestHttpException("Kolom '$field' wajib diisi");
            }
        }

        if (User::findActive()->where(['username' => $data['username']])->exists()) {
            throw new \yii\web\BadRequestHttpException('Nama pengguna sudah digunakan');
        }

        if (User::findActive()->where(['email' => $data['email']])->exists()) {
            throw new \yii\web\BadRequestHttpException('Email sudah digunakan');
        }

        if (!empty($data['phone']) && User::findActive()->where(['phone' => $data['phone']])->exists()) {
            throw new \yii\web\BadRequestHttpException('Nomor telepon sudah digunakan');
        }

        $transaction = Yii::$app->db->beginTransaction();
        try {
            $user = new User();
            $user->id = \Ramsey\Uuid\Uuid::uuid4()->toString();
            $user->username = $data['username'];
            $user->email = $data['email'];
            $user->phone = $data['phone'] ?? null;
            $user->password = $data['password'] ?? 'password123';
            $user->status = $data['status'] ?? User::STATUS_ACTIVE;
            $user->save(false);

            $profile = new Profile();
            $profile->id = \Ramsey\Uuid\Uuid::uuid4()->toString();
            $profile->user_id = $user->id;
            $profile->full_name = $data['full_name'];
            $profile->nik = $data['nik'] ?? null;
            $profile->gender = $data['gender'] ?? null;
            $profile->birth_date = $data['birth_date'] ?? null;
            $profile->save(false);

            if (!empty($data['roles']) && is_array($data['roles'])) {
                foreach ($data['roles'] as $roleName) {
                    $role = AuthItem::find()->where(['name' => $roleName, 'type' => 1])->one();
                    if ($role) {
                        $assignment = new AuthAssignment();
                        $assignment->item_name = $roleName;
                        $assignment->user_id = $user->id;
                        $assignment->created_at = time();
                        $assignment->save(false);
                    }
                }
            }

            $transaction->commit();

            Yii::$app->auditLogger->logCreate('User', $user->id, $user->toArray());

            return $user;
        } catch (\Throwable $e) {
            $transaction->rollBack();
            throw new \yii\web\ServerKesalahanHttpException($e->getMessage());
        }
    }

    public function actionUpdate(string $id): User
    {
        $this->requirePermission('pengaturan-user-update');

        $model = User::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Pengguna tidak ditemukan');
        }

        $oldData = $model->toArray();
        $data = Yii::$app->request->getBodyParams();

        if (!empty($data['email']) && $data['email'] !== $model->email) {
            if (User::findActive()->where(['email' => $data['email']])->exists()) {
                throw new \yii\web\BadRequestHttpException('Email sudah digunakan');
            }
            $model->email = $data['email'];
        }

        if (!empty($data['phone']) && $data['phone'] !== $model->phone) {
            if (User::findActive()->where(['phone' => $data['phone']])->exists()) {
                throw new \yii\web\BadRequestHttpException('Nomor telepon sudah digunakan');
            }
            $model->phone = $data['phone'];
        }

        $model->status = $data['status'] ?? $model->status;

        if (!empty($data['password'])) {
            $model->password = $data['password'];
        }

        if ($model->save()) {
            if ($model->profile) {
                $model->profile->full_name = $data['full_name'] ?? $model->profile->full_name;
                $model->profile->nik = $data['nik'] ?? $model->profile->nik;
                $model->profile->gender = $data['gender'] ?? $model->profile->gender;
                $model->profile->birth_date = $data['birth_date'] ?? $model->profile->birth_date;
                $model->profile->save(false);
            }

            if (isset($data['roles']) && is_array($data['roles'])) {
                AuthAssignment::deleteAll(['user_id' => $id]);
                foreach ($data['roles'] as $roleName) {
                    $role = AuthItem::find()->where(['name' => $roleName, 'type' => 1])->one();
                    if ($role) {
                        $assignment = new AuthAssignment();
                        $assignment->item_name = $roleName;
                        $assignment->user_id = $id;
                        $assignment->created_at = time();
                        $assignment->save(false);
                    }
                }
            }

            Yii::$app->auditLogger->logUpdate('User', $model->id, $oldData, $model->toArray());
            return $model;
        }

        throw new \yii\web\UnprocessableEntityHttpException(json_encode($model->errors));
    }

    public function actionDelete(string $id): array
    {
        $this->requirePermission('pengaturan-user-delete');

        $model = User::findActive()->where(['id' => $id])->one();
        if (!$model) {
            throw new NotFoundHttpException('Pengguna tidak ditemukan');
        }

        if ($model->id === Yii::$app->user->id) {
            throw new \yii\web\BadRequestHttpException('Pengguna tidak dapat menghapus akunnya sendiri');
        }

        $model->is_deleted = true;
        $model->deleted_at = date('Y-m-d H:i:s');
        $model->save(false, ['is_deleted', 'deleted_at']);

        if ($model->profile) {
            $model->profile->is_deleted = true;
            $model->profile->deleted_at = date('Y-m-d H:i:s');
            $model->profile->save(false, ['is_deleted', 'deleted_at']);
        }

        AuthAssignment::deleteAll(['user_id' => $id]);

        Yii::$app->auditLogger->logDelete('User', $id, $model->toArray());

        return ['success' => true, 'message' => 'Pengguna berhasil dihapus'];
    }
}
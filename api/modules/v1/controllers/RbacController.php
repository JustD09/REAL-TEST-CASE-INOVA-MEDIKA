<?php

namespace api\modules\v1\controllers;

use Yii;
use yii\rbac\Role;

class RbacController extends BaseController
{
    public $modelClass = Role::class;

    public function actions(): array
    {
        return [];
    }

    public function actionRoles(): array
    {
        $this->requirePermission('pengaturan-user-view');

        $roles = [];
        foreach (Yii::$app->authManager->getRoles() as $role) {
            $roles[] = [
                'name' => $role->name,
                'description' => $role->description,
                'permissions' => array_keys(Yii::$app->authManager->getPermissionsByRole($role->name)),
            ];
        }

        return ['success' => true, 'data' => $roles];
    }

    public function actionPermissions(): array
    {
        $this->requirePermission('pengaturan-user-view');

        $permissions = [];
        foreach (Yii::$app->authManager->getPermissions() as $permission) {
            $permissions[] = [
                'name' => $permission->name,
                'description' => $permission->description,
            ];
        }

        return ['success' => true, 'data' => $permissions];
    }

    public function actionUserRoles(string $id): array
    {
        $this->requirePermission('pengaturan-user-view');

        return [
            'success' => true,
            'data' => array_keys(Yii::$app->authManager->getRolesByUser($id)),
        ];
    }

    public function actionAssignRole(string $id): array
    {
        $this->requirePermission('pengaturan-user-update');

        $roleName = Yii::$app->request->getBodyParam('role');
        $role = $roleName ? Yii::$app->authManager->getRole($roleName) : null;
        if (!$role) {
            throw new \yii\web\BadRequestHttpException('Peran tidak ditemukan');
        }

        Yii::$app->authManager->assign($role, $id);

        return ['success' => true, 'message' => 'Peran berhasil ditetapkan'];
    }

    public function actionRevokeRole(string $id, string $role): array
    {
        $this->requirePermission('pengaturan-user-update');

        $authRole = Yii::$app->authManager->getRole($role);
        if ($authRole) {
            Yii::$app->authManager->revoke($authRole, $id);
        }

        return ['success' => true, 'message' => 'Peran berhasil dicabut'];
    }
}

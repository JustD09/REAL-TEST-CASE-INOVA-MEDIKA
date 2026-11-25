<?php

namespace api\modules\v1\controllers;

use Yii;
use yii\rest\ActiveController;
use yii\filters\auth\HttpBearerAuth;
use yii\filters\RateLimiter;
use yii\web\ForbiddenHttpException;
use common\models\User;

class BaseController extends ActiveController
{
    public $serializer = [
        'class' => 'yii\rest\Serializer',
        'collectionEnvelope' => 'data',
    ];
    
    public function behaviors(): array
    {
        $behaviors = parent::behaviors();
        
        // Autentikasi
        $behaviors['authenticator'] = [
            'class' => HttpBearerAuth::class,
            'except' => ['options', 'login', 'refresh-token'],
            'optional' => ['index', 'view'],
        ];
        
        // Pembatasan laju permintaan
        $behaviors['rateLimiter'] = [
            'class' => RateLimiter::class,
            'enableRateLimitHeaders' => true,
        ];
        
        // CORS dihapus - gunakan global config
        
        return $behaviors;
    }
    
    public function checkAccess($action, $model = null, $params = []): void
    {
        // Override pada controller turunan untuk pemeriksaan izin khusus
        // optional auth: izinkan guest untuk index/view jika tidak ada token
        if (Yii::$app->user->isGuest && !in_array($action, ['index', 'view'])) {
            throw new ForbiddenHttpException('Autentikasi diperlukan');
        }
    }
    
    protected function getCurrentUser(): ?User
    {
        return Yii::$app->user->identity;
    }
    
    protected function requirePermission(string $permission): void
    {
        $user = $this->getCurrentUser();
        if (!$user || !$user->hasPermission($permission)) {
            throw new ForbiddenHttpException("Izin ditolak: $permission");
        }
    }
    
    protected function requireRole(string $role): void
    {
        $user = $this->getCurrentUser();
        if (!$user || !$user->hasRole($role)) {
            throw new ForbiddenHttpException("Peran wajib: $role");
        }
    }
    
    public function actionOptions($id = null): array
    {
        return [];
    }
}
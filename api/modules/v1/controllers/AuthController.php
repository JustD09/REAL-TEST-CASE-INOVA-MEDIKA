<?php

namespace api\modules\v1\controllers;

use Yii;
use yii\rest\Controller;
use yii\web\BadRequestHttpException;
use yii\web\UnauthorizedHttpException;
use common\models\User;
use common\models\LoginForm;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class AuthController extends Controller
{
    
    public function behaviors(): array
    {
        $behaviors = parent::behaviors();
        unset($behaviors['authenticator']);
        return $behaviors;
    }
    
    public function actionOptions(): array
    {
        return [];
    }

    public function actionLogin(): array
    {
        $model = new LoginForm();
        $model->load(Yii::$app->request->post(), '');
        
        if (!$model->validate()) {
            throw new BadRequestHttpException('Kredensial tidak valid');
        }
        
        $user = User::findByUsername($model->username);
        if (!$user || !$user->validatePassword($model->password)) {
            throw new UnauthorizedHttpException('Nama pengguna atau kata sandi tidak valid');
        }
        
        if ($user->status !== User::STATUS_ACTIVE) {
            throw new UnauthorizedHttpException('Akun tidak aktif');
        }
        
        // Perbarui waktu login terakhir
        $user->last_login_at = date('Y-m-d H:i:s');
        $user->save(false, ['last_login_at']);
        
        // Hasilkan token
        $accessToken = $this->generateAccessToken($user);
        $refreshToken = $this->generateRefreshToken($user);
        
        // Catat audit
        Yii::$app->auditLogger->logLogin($user->id, true);
        
        return [
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'email' => $user->email,
                    'full_name' => $user->getFullName(),
                    'roles' => array_keys($user->getRoles()),
                    'permissions' => $user->getPermissions(),
                ],
                'access_token' => $accessToken,
                'refresh_token' => $refreshToken,
                'expires_in' => Yii::$app->params['api.jwtExpiration'],
            ],
            'message' => 'Login berhasil',
        ];
    }
    
    public function actionRefreshToken(): array
    {
        $refreshToken = Yii::$app->request->post('refresh_token');
        if (!$refreshToken) {
            throw new BadRequestHttpException('Refresh token wajib diisi');
        }
        
        try {
            $decoded = JWT::decode($refreshToken, new Key(Yii::$app->params['jwtSecret'] ?? 'simrs-secret-key', 'HS256'));
            $userId = $decoded->uid ?? null;
            
            if (!$userId) {
                throw new UnauthorizedHttpException('Refresh token tidak valid');
            }
            
            $user = User::findIdentity($userId);
            if (!$user || $user->status !== User::STATUS_ACTIVE) {
                throw new UnauthorizedHttpException('Pengguna tidak ditemukan or inactive');
            }
            
            $accessToken = $this->generateAccessToken($user);
            $newRefreshToken = $this->generateRefreshToken($user);
            
            return [
                'success' => true,
                'data' => [
                    'access_token' => $accessToken,
                    'refresh_token' => $newRefreshToken,
                    'expires_in' => Yii::$app->params['api.jwtExpiration'],
                ],
                'message' => 'Token refreshed',
            ];
        } catch (\Exception $e) {
            throw new UnauthorizedHttpException('Refresh token tidak valid atau sudah kedaluwarsa');
        }
    }
    
    public function actionLogout(): array
    {
        // Klien harus menghapus token
        return [
            'success' => true,
            'message' => 'Berhasil keluar',
        ];
    }
    
    public function actionMe(): array
    {
        $user = Yii::$app->user->identity;
        if (!$user) {
            throw new UnauthorizedHttpException('Belum terautentikasi');
        }
        
        return [
            'success' => true,
            'data' => [
                'id' => $user->id,
                'username' => $user->username,
                'email' => $user->email,
                'full_name' => $user->getFullName(),
                'roles' => array_keys($user->getRoles()),
                'permissions' => $user->getPermissions(),
                'profile' => $user->profile ? $user->profile->toArray() : null,
                'dokter' => $user->dokter ? $user->dokter->toArray() : null,
                'pasien' => $user->pasien ? $user->pasien->toArray() : null,
            ],
        ];
    }
    
    private function generateAccessToken(User $user): string
    {
        $payload = [
            'iss' => 'simrs-api',
            'aud' => 'simrs-client',
            'iat' => time(),
            'exp' => time() + Yii::$app->params['api.jwtExpiration'],
            'uid' => $user->id,
            'username' => $user->username,
            'roles' => array_keys($user->getRoles()),
            'permissions' => $user->getPermissions(),
            'type' => 'access',
        ];
        
        return JWT::encode($payload, Yii::$app->params['jwtSecret'] ?? 'simrs-secret-key', 'HS256');
    }
    
    private function generateRefreshToken(User $user): string
    {
        $payload = [
            'iss' => 'simrs-api',
            'aud' => 'simrs-client',
            'iat' => time(),
            'exp' => time() + Yii::$app->params['api.jwtRefreshExpiration'],
            'uid' => $user->id,
            'type' => 'refresh',
        ];
        
        return JWT::encode($payload, Yii::$app->params['jwtSecret'] ?? 'simrs-secret-key', 'HS256');
    }
}
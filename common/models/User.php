<?php

namespace common\models;

use Yii;
use yii\db\ActiveQuery;
use yii\web\IdentityInterface;
use yii\base\NotSupportedException;
use Ramsey\Uuid\Uuid;

class User extends ActiveRecord implements IdentityInterface
{
    public const STATUS_INACTIVE = 0;
    public const STATUS_ACTIVE = 10;
    public const STATUS_SUSPENDED = 20;
    
    public const ROLE_ADMIN = 'admin';
    public const ROLE_PETUGAS_PENDAFTARAN = 'petugas_pendaftaran';
    public const ROLE_DOKTER = 'dokter';
    public const ROLE_PETUGAS_FARMASI = 'petugas_farmasi';
    public const ROLE_PETUGAS_LABORATORIUM = 'petugas_laboratorium';
    public const ROLE_KASIR = 'kasir';
    
    public $password;
    public $password_repeat;
    public $authKey;
    
    public static function tableName(): string
    {
        return '{{%user}}';
    }
    
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            [['username', 'email', 'status'], 'required'],
            [['username', 'email'], 'string', 'max' => 100],
            [['email'], 'email'],
            [['username', 'email'], 'unique', 'filter' => ['is_deleted' => false]],
            [['password_hash', 'auth_key', 'password_reset_token'], 'string', 'max' => 255],
            [['status'], 'integer', 'min' => 0, 'max' => 20],
            [['last_login_at'], 'safe'],
            [['password'], 'string', 'min' => 8, 'max' => 72, 'on' => ['create', 'update']],
            [['password_repeat'], 'compare', 'compareAttribute' => 'password', 'on' => ['create', 'update']],
        ]);
    }
    
    public function attributeLabels(): array
    {
        return [
            'id' => 'ID',
            'username' => 'Username',
            'email' => 'Email',
            'password' => 'Password',
            'password_repeat' => 'Konfirmasi Password',
            'status' => 'Status',
            'last_login_at' => 'Terakhir Login',
            'created_at' => 'Dibuat',
            'updated_at' => 'Diupdate',
        ];
    }
    
    public static function findIdentity($id): ?IdentityInterface
    {
        return static::findActive()->where(['id' => $id])->one();
    }
    
    public static function findIdentityByAccessToken($token, $type = null): ?IdentityInterface
    {
        try {
            $decoded = \Firebase\JWT\JWT::decode($token, new \Firebase\JWT\Key(Yii::$app->params['jwtSecret'] ?? 'simrs-secret-key', 'HS256'));
            $uid = $decoded->uid ?? null;
            if (!$uid) {
                return null;
            }
            return static::findIdentity($uid);
        } catch (\Exception $e) {
            return null;
        }
    }
    
    public function getId(): string
    {
        return $this->id;
    }
    
    public function getAuthKey(): string
    {
        return $this->auth_key;
    }
    
    public function validateAuthKey($authKey): bool
    {
        return $this->auth_key === $authKey;
    }
    
    public static function findByUsername(string $username): ?self
    {
        return static::findActive()->where(['username' => $username])->one();
    }
    
    public static function findByEmail(string $email): ?self
    {
        return static::findActive()->where(['email' => $email])->one();
    }
    
    public static function findByPasswordResetToken(string $token): ?self
    {
        if (!static::isPasswordResetTokenValid($token)) {
            return null;
        }
        return static::findActive()->where(['password_reset_token' => $token])->one();
    }
    
    public static function isPasswordResetTokenValid(string $token): bool
    {
        if (empty($token)) {
            return false;
        }
        $timestamp = (int) substr($token, strrpos($token, '_') + 1);
        $expire = Yii::$app->params['user.passwordResetTokenExpire'] ?? 3600;
        return $timestamp + $expire >= time();
    }
    
    public function validatePassword(string $password): bool
    {
        return Yii::$app->security->validatePassword($password, $this->password_hash);
    }
    
    public function setPassword(string $password): void
    {
        $this->password_hash = Yii::$app->security->generatePasswordHash($password);
    }
    
    public function generateAuthKey(): void
    {
        $this->auth_key = Yii::$app->security->generateRandomString();
    }
    
    public function generatePasswordResetToken(): void
    {
        $this->password_reset_token = Yii::$app->security->generateRandomString() . '_' . time();
    }
    
    public function removePasswordResetToken(): void
    {
        $this->password_reset_token = null;
    }
    
    public function getRoles(): array
    {
        return Yii::$app->authManager->getRolesByUser($this->id);
    }
    
    public function getPermissions(): array
    {
        $roles = $this->getRoles();
        $permissions = [];
        foreach ($roles as $role) {
            $permissions = array_merge($permissions, $this->getRolePermissions($role->name));
        }
        return array_unique($permissions);
    }
    
    protected function getRolePermissions(string $roleName): array
    {
        $children = Yii::$app->authManager->getChildren($roleName);
        $permissions = [];
        foreach ($children as $child) {
            if ($child->type === 2) { // Izin
                $permissions[] = $child->name;
            } else {
                $permissions = array_merge($permissions, $this->getRolePermissions($child->name));
            }
        }
        return $permissions;
    }
    
    public function hasPermission(string $permission): bool
    {
        return in_array($permission, $this->getPermissions());
    }
    
    public function hasRole(string $role): bool
    {
        return isset($this->getRoles()[$role]);
    }
    
    public function assignRole(string $roleName): bool
    {
        $role = Yii::$app->authManager->getRole($roleName);
        if (!$role) {
            return false;
        }
        return Yii::$app->authManager->assign($role, $this->id) !== false;
    }
    
    public function revokeRole(string $roleName): bool
    {
        $role = Yii::$app->authManager->getRole($roleName);
        if (!$role) {
            return false;
        }
        return Yii::$app->authManager->revoke($role, $this->id);
    }
    
    public function getProfile(): ActiveQuery
    {
        return $this->hasOne(Profile::class, ['user_id' => 'id']);
    }
    
    public function getDokter(): ActiveQuery
    {
        return $this->hasOne(Dokter::class, ['user_id' => 'id']);
    }
    
    public function getPasien(): ActiveQuery
    {
        return $this->hasOne(Pasien::class, ['user_id' => 'id']);
    }
    
    public function getFullName(): string
    {
        return $this->profile ? $this->profile->full_name : $this->username;
    }
    
    public function beforeSave($insert): bool
    {
        if (parent::beforeSave($insert)) {
            if ($insert) {
                $this->generateAuthKey();
                if (!empty($this->password)) {
                    $this->setPassword($this->password);
                }
            } elseif (!empty($this->password)) {
                $this->setPassword($this->password);
            }
            return true;
        }
        return false;
    }
    
    public function afterSave($insert, $changedAttributes): void
    {
        parent::afterSave($insert, $changedAttributes);
        if ($insert && $this->status === self::STATUS_ACTIVE) {
            // Tetapkan peran default berdasarkan konteks
        }
    }
}
<?php
require __DIR__ . '/../../vendor/autoload.php';
require __DIR__ . '/../../vendor/yiisoft/yii2/Yii.php';

$config = require __DIR__ . '/config/main.php';
$app = new yii\web\Application($config);
$app->bootstrap();

$user = common\models\User::find()->where(['username' => 'admin'])->one();
echo "User: {$user->username}\n";
echo "Roles:\n";
print_r($user->getRoles());
echo "Permissions:\n";
print_r($user->getPermissions());
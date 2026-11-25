<?php

$params = array_merge(
    require __DIR__ . '/../../common/config/params.php',
    require __DIR__ . '/params.php'
);
$common = require __DIR__ . '/../../common/config/main.php';

return array_merge($common, [
    'id' => 'app-backend',
    'basePath' => dirname(__DIR__),
    'bootstrap' => ['log'],
    'controllerNamespace' => 'backend\controllers',
    'aliases' => [
        '@bower' => '@vendor/bower-asset',
        '@npm' => '@vendor/npm-asset',
    ],
    'components' => [
        'request' => [
            'csrfParam' => '_csrf-backend',
            'parsers' => [
                'application/json' => 'yii\web\JsonParser',
            ],
        ],
        'user' => [
            'identityClass' => 'common\models\User',
            'enableAutoLogin' => true,
            'identityCookie' => ['name' => '_identity-backend', 'httpOnly' => true, 'sameSite' => 'strict'],
        ],
        'session' => [
            'name' => 'SIMRS_BACKEND_SESSION',
            'cookieParams' => ['httponly' => true, 'secure' => YII_ENV_PROD, 'samesite' => 'strict'],
        ],
        'log' => [
            'traceLevel' => YII_DEBUG ? 3 : 0,
            'targets' => [
                [
                    'class' => 'yii\log\FileTarget',
                    'levels' => ['error', 'warning'],
                    'logFile' => '@runtime/logs/backend.log',
                ],
                [
                    'class' => 'yii\log\FileTarget',
                    'levels' => ['info'],
                    'categories' => ['audit'],
                    'logFile' => '@runtime/logs/backend-audit.log',
                ],
            ],
        ],
        'errorHandler' => [
            'errorAction' => 'site/error',
        ],
        'urlManager' => [
            'enablePrettyUrl' => true,
            'showScriptName' => false,
            'rules' => [
                '' => 'dashboard/index',
                'login' => 'site/login',
                'logout' => 'site/logout',
                'master/<controller:\w+>/<action:\w+>' => 'master/<controller>/<action>',
                'master/<controller:\w+>' => 'master/<controller>/index',
                'transaksi/<controller:\w+>/<action:\w+>' => 'transaksi/<controller>/<action>',
                'transaksi/<controller:\w+>' => 'transaksi/<controller>/index',
                'laporan/<controller:\w+>/<action:\w+>' => 'laporan/<controller>/<action>',
                'laporan/<controller:\w+>' => 'laporan/<controller>/index',
                'pengaturan/<controller:\w+>/<action:\w+>' => 'pengaturan/<controller>/<action>',
                'pengaturan/<controller:\w+>' => 'pengaturan/<controller>/index',
            ],
        ],
        'view' => [
            'theme' => [
                'pathMap' => [
                    '@app/views' => '@backend/views',
                ],
            ],
        ],
    ],
    'params' => $params,
    'as access' => [
        'class' => 'yii\filters\AccessControl',
        'except' => ['site/login', 'site/error'],
        'rules' => [
            [
                'allow' => true,
                'roles' => ['@'],
            ],
        ],
    ],
    'modules' => [
        'gii' => [
            'class' => 'yii\gii\Module',
            'allowedIPs' => ['127.0.0.1', '::1', '192.168.*.*'],
        ],
    ],
]);
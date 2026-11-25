<?php

use yii\web\Application;

$params = array_merge(
    require __DIR__ . '/../../common/config/params.php',
    require __DIR__ . '/params.php'
);
$common = require __DIR__ . '/../../common/config/main.php';

return array_merge($common, [
    'id' => 'app-frontend',
    'basePath' => dirname(__DIR__),
    'bootstrap' => ['log'],
    'controllerNamespace' => 'frontend\controllers',
    'aliases' => [
        '@bower' => '@vendor/bower-asset',
        '@npm' => '@vendor/npm-asset',
    ],
    'components' => [
        'request' => [
            'csrfParam' => '_csrf-frontend',
            'parsers' => [
                'application/json' => 'yii\web\JsonParser',
            ],
        ],
        'user' => [
            'identityClass' => 'common\models\User',
            'enableAutoLogin' => true,
            'identityCookie' => ['name' => '_identity-frontend', 'httpOnly' => true, 'sameSite' => 'strict'],
        ],
        'session' => [
            'name' => 'SIMRS_FRONTEND_SESSION',
            'cookieParams' => ['httponly' => true, 'secure' => YII_ENV_PROD, 'samesite' => 'strict'],
        ],
        'log' => [
            'traceLevel' => YII_DEBUG ? 3 : 0,
            'targets' => [
                [
                    'class' => 'yii\log\FileTarget',
                    'levels' => ['error', 'warning'],
                    'logFile' => '@runtime/logs/frontend.log',
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
                '' => 'site/index',
                'login' => 'site/login',
                'logout' => 'site/logout',
                'register' => 'site/register',
                'pasien/<action:(index|view|create|update|delete)>' => 'pasien/<action>',
                'pendaftaran/<action:(index|create|view|queue|history)>' => 'pendaftaran/<action>',
                'rekam-medis/<action:(index|view|create|update)>' => 'rekam-medis/<action>',
                'pemeriksaan/<action:(index|view|create|update)>' => 'pemeriksaan/<action>',
                'tindakan/<action:(index|view|create|update)>' => 'tindakan/<action>',
                'resep/<action:(index|view|create|update|dispense)>' => 'resep/<action>',
                'laboratorium/<action:(index|view|create|update|result)>' => 'laboratorium/<action>',
                'billing/<action:(index|view|pay|invoice|receipt)>' => 'billing/<action>',
                'dashboard/<action:(index|summary|report)>' => 'dashboard/<action>',
                'profile/<action:(index|update|password)>' => 'profile/<action>',
            ],
        ],
    ],
    'params' => $params,
    'modules' => [
        'gii' => [
            'class' => 'yii\gii\Module',
            'allowedIPs' => ['127.0.0.1', '::1', '192.168.*.*'],
            'generators' => [
                'crud' => [
                    'class' => 'yii\gii\generators\crud\Generator',
                    'templates' => [
                        'simrs' => '@common/gii/templates/crud/simrs',
                    ],
                ],
                'model' => [
                    'class' => 'yii\gii\generators\model\Generator',
                    'templates' => [
                        'simrs' => '@common/gii/templates/model/simrs',
                    ],
                ],
            ],
        ],
    ],
]);
<?php

defined('YII_DEBUG') or define('YII_DEBUG', true);
defined('YII_ENV') or define('YII_ENV', 'dev');

$params = require __DIR__ . '/params.php';
$db = require __DIR__ . '/db.php';

$config = [
    'id' => 'basic-console',
    'basePath' => dirname(__DIR__),
    'bootstrap' => ['log'],
    'controllerNamespace' => 'app\commands',
    'aliases' => [
        '@bower' => '@vendor/bower-asset',
        '@npm'   => '@vendor/npm-asset',
        '@tests' => '@app/tests',
    ],
    'components' => [
        'cache' => [
            'class' => \yii\caching\FileCache::class,
        ],
        'log' => [
            'targets' => [
                [
                    'class' => \yii\log\FileTarget::class,
                    'levels' => ['error', 'warning'],
                ],
            ],
        ],
        'db' => $db,
        'authManager' => [
            'class' => \yii\rbac\DbManager::class,
            'defaultRoles' => ['guest'],
        ],
    ],
    'params' => $params,
    'controllerMap' => [
        'rbac' => [
            'class' => 'console\controllers\RbacController',
        ],
        'seed' => [
            'class' => 'console\controllers\SeedController',
        ],
    ],
];

if (YII_ENV_DEV) {
    // Penyesuaian konfigurasi untuk lingkungan 'dev'
    $config['bootstrap'][] = 'gii';
    $config['modules']['gii'] = [
        'class' => \yii\gii\Module::class,
    ];
    // Penyesuaian konfigurasi untuk lingkungan 'dev'
    // Memerlukan versi `2.1.21` modul yii2-debug
    $config['bootstrap'][] = 'debug';
    $config['modules']['debug'] = [
        'class' => \yii\debug\Module::class,
        // Hapus komentar baris berikut untuk menambahkan IP jika koneksi bukan dari localhost.
        //'allowedIPs' => ['127.0.0.1', '::1'],
    ];
}

return $config;

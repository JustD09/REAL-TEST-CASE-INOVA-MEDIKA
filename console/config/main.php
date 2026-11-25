<?php

$params = array_merge(
    require __DIR__ . '/../../common/config/params.php',
    require __DIR__ . '/../../config/params.php'
);
$common = require __DIR__ . '/../../common/config/main.php';

return array_merge($common, [
    'id' => 'app-console',
    'basePath' => dirname(__DIR__),
    'bootstrap' => ['log'],
    'controllerNamespace' => 'console\controllers',
    'aliases' => [
        '@bower' => '@vendor/bower-asset',
        '@npm' => '@vendor/npm-asset',
    ],
    'components' => [
        'db' => $common['components']['db'],
        'authManager' => $common['components']['authManager'],
        'log' => [
            'targets' => [
                [
                    'class' => 'yii\log\FileTarget',
                    'levels' => ['error', 'warning'],
                    'logFile' => '@runtime/logs/console.log',
                ],
            ],
        ],
    ],
    'params' => $params,
    'controllerMap' => [
        'migrate' => [
            'class' => 'yii\console\controllers\MigrateController',
            'migrationPath' => [
                '@console/migrations',
                '@yii/rbac/migrations',
            ],
            'migrationNamespaces' => [
                'console\migrations',
            ],
        ],
        'fixture' => [
            'class' => 'yii\console\controllers\FixtureController',
            'namespace' => 'common\fixtures',
        ],
        'rbac' => [
            'class' => 'console\controllers\RbacController',
        ],
        'seed' => [
            'class' => 'console\controllers\SeedController',
        ],
        'queue' => [
            'class' => 'console\controllers\QueueController',
        ],
        'billing' => [
            'class' => 'console\controllers\BillingController',
        ],
        'report' => [
            'class' => 'console\controllers\ReportController',
        ],
    ],
]);
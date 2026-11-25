<?php

$params = array_merge(
    require __DIR__ . '/../../common/config/params.php',
    require __DIR__ . '/../../config/params.php'
);
$common = require __DIR__ . '/../../common/config/main.php';

return array_merge($common, [
    'id' => 'app-api',
    'basePath' => dirname(__DIR__),
    'bootstrap' => ['log'],
    'controllerNamespace' => 'api\controllers',
    'components' => [
        'cache' => [
            'class' => 'yii\caching\FileCache',
        ],
        'db' => require __DIR__ . '/../../config/db.php',
        'auditLogger' => [
            'class' => 'common\components\AuditLogger',
        ],
        'request' => [
            'class' => 'common\components\ApiRequest',
            'parsers' => [
                'application/json' => 'yii\web\JsonParser',
                'multipart/form-data' => 'yii\web\MultipartFormDataParser',
            ],
            'enableCsrfValidation' => false,
            'enableCookieValidation' => false,
        ],
        'response' => [
            'class' => 'yii\web\Response',
            'format' => 'json',
            'on beforeSend' => function ($event) {
                $response = $event->sender;
                if ($response->data !== null && !isset($response->data['success'])) {
                    $response->data = [
                        'success' => $response->isSuccessful,
                        'data' => $response->data,
                        'message' => $response->isSuccessful ? 'Berhasil' : 'Kesalahan',
                        'timestamp' => time(),
                    ];
                    if (!$response->isSuccessful && isset($response->data['errors'])) {
                        $response->data['errors'] = $response->data['errors'];
                    }
                }
            },
        ],
        'user' => [
            'class' => 'yii\web\User',
            'identityClass' => 'common\models\User',
            'enableSession' => false,
            'enableAutoLogin' => false,
            'loginUrl' => null,
        ],
        'authManager' => [
            'class' => 'yii\rbac\DbManager',
            'db' => 'db',
        ],
        'response' => [
            'class' => 'yii\web\Response',
            'format' => 'json',
            'on beforeSend' => function ($event) {
                $response = $event->sender;
                if ($response->data !== null && !isset($response->data['success'])) {
                    $response->data = [
                        'success' => $response->isSuccessful,
                        'data' => $response->data,
                        'message' => $response->isSuccessful ? 'Berhasil' : 'Kesalahan',
                        'timestamp' => time(),
                    ];
                    if (!$response->isSuccessful && isset($response->data['errors'])) {
                        $response->data['errors'] = $response->data['errors'];
                    }
                }
            },
        ],
        'log' => [
            'traceLevel' => YII_DEBUG ? 3 : 0,
            'targets' => [
                [
                    'class' => 'yii\log\FileTarget',
                    'levels' => ['error', 'warning'],
                    'logFile' => '@runtime/logs/api.log',
                    'prefix' => function () {
                        return '[' . (Yii::$app->request->getUserIP() ?? 'unknown') . '] ';
                    },
                ],
                [
                    'class' => 'yii\log\FileTarget',
                    'levels' => ['info'],
                    'categories' => ['api.request'],
                    'logFile' => '@runtime/logs/api-requests.log',
                ],
            ],
        ],
        'urlManager' => [
            'enablePrettyUrl' => true,
            'enableStrictParsing' => true,
            'showScriptName' => false,
            'rules' => [
                // Endpoint autentikasi tanpa awalan v1 untuk kompatibilitas frontend
                'OPTIONS auth/login' => 'v1/auth/options',
                'OPTIONS auth/refresh' => 'v1/auth/options',
                'OPTIONS auth/refresh-token' => 'v1/auth/options',
                'OPTIONS auth/logout' => 'v1/auth/options',
                'POST auth/login' => 'v1/auth/login',
                'POST /auth/login' => 'v1/auth/login',
                'POST auth/refresh' => 'v1/auth/refresh-token',
                'POST auth/refresh-token' => 'v1/auth/refresh-token',
                'POST auth/logout' => 'v1/auth/logout',
                'GET auth/me' => 'v1/auth/me',
                
                // Endpoint utama tanpa awalan v1 untuk kompatibilitas frontend
                'GET pasien' => 'v1/pasien/index',
                'POST pasien' => 'v1/pasien/create',
                'GET pasien/<id>' => 'v1/pasien/view',
                'PUT pasien/<id>' => 'v1/pasien/update',
                'PATCH pasien/<id>' => 'v1/pasien/update',
                'DELETE pasien/<id>' => 'v1/pasien/delete',
                'GET poli' => 'v1/poli/index',
                'GET dokter' => 'v1/dokter/index',
                'GET jadwal' => 'v1/jadwal/index',
                'GET tindakan' => 'v1/tindakan/index',
                'GET obat' => 'v1/obat/index',
                'GET pendaftaran' => 'v1/kunjungan/index',
                'POST pendaftaran' => 'v1/kunjungan/create',
                'GET antrean' => 'v1/antrean/index',
                'POST antrean' => 'v1/antrean/create',
                'GET rekam-medis' => 'v1/kunjungan/index',
                'GET pemeriksaan' => 'v1/pemeriksaan/index',
                'GET laboratorium' => 'v1/laboratorium/index',
                'GET billing' => 'v1/billing/index',
                'GET dashboard' => 'v1/dashboard/summary',
                'GET kunjungan' => 'v1/kunjungan/index',
                'GET diagnosa' => 'v1/diagnosa/index',
                'GET rbac/roles' => 'v1/rbac/roles',
                'GET rbac/permissions' => 'v1/rbac/permissions',
                'GET user' => 'v1/user/index',
                'GET specialist' => 'v1/specialist/index',
                'GET jadwal-praktik' => 'v1/jadwal/index',
                'GET tindakan-category' => 'v1/tindakan-category/index',
                'GET jenis-pemeriksaan-lab' => 'v1/jenis-pemeriksaan-lab/index',
                'GET obat-category' => 'v1/obat-category/index',
                'GET jenis-pemeriksaan-lab-category' => 'v1/jenis-pemeriksaan-lab-category/index',
                'GET integration/logs' => 'v1/integration/logs',
                'GET laporan/kunjungan' => 'v1/laporan/kunjungan',
                'GET laporan/poli' => 'v1/laporan/poli',
                'GET laporan/dokter' => 'v1/laporan/dokter',
                'GET laporan/tindakan' => 'v1/laporan/tindakan',
                'GET laporan/obat' => 'v1/laporan/obat',
                'GET laporan/pendapatan' => 'v1/laporan/pendapatan',
                'GET laporan/piutang' => 'v1/laporan/piutang',
                'GET laporan/stok' => 'v1/laporan/stok',

                // Rute modul v1
                ['class' => 'yii\rest\UrlRule', 'controller' => 'v1/auth', 'pluralize' => false],
                ['class' => 'yii\rest\UrlRule', 'controller' => 'v1/pasien', 'pluralize' => false],
                ['class' => 'yii\rest\UrlRule', 'controller' => 'v1/dokter', 'pluralize' => false],
                ['class' => 'yii\rest\UrlRule', 'controller' => 'v1/poli', 'pluralize' => false],
                ['class' => 'yii\rest\UrlRule', 'controller' => 'v1/jadwal', 'pluralize' => false],
                ['class' => 'yii\rest\UrlRule', 'controller' => 'v1/tindakan', 'pluralize' => false],
                ['class' => 'yii\rest\UrlRule', 'controller' => 'v1/obat', 'pluralize' => false],
                ['class' => 'yii\rest\UrlRule', 'controller' => 'v1/pendaftaran', 'pluralize' => false],
                ['class' => 'yii\rest\UrlRule', 'controller' => 'v1/antrean', 'pluralize' => false],
                ['class' => 'yii\rest\UrlRule', 'controller' => 'v1/rekam-medis', 'pluralize' => false],
                ['class' => 'yii\rest\UrlRule', 'controller' => 'v1/pemeriksaan', 'pluralize' => false],
                ['class' => 'yii\rest\UrlRule', 'controller' => 'v1/tindakan-medis', 'pluralize' => false],
                ['class' => 'yii\rest\UrlRule', 'controller' => 'v1/resep', 'pluralize' => false],
                ['class' => 'yii\rest\UrlRule', 'controller' => 'v1/farmasi', 'pluralize' => false],
                ['class' => 'yii\rest\UrlRule', 'controller' => 'v1/laboratorium', 'pluralize' => false],
                ['class' => 'yii\rest\UrlRule', 'controller' => 'v1/billing', 'pluralize' => false],
                ['class' => 'yii\rest\UrlRule', 'controller' => 'v1/pembayaran', 'pluralize' => false],
                ['class' => 'yii\rest\UrlRule', 'controller' => 'v1/dashboard', 'pluralize' => false, 'only' => ['index', 'summary']],
                ['class' => 'yii\rest\UrlRule', 'controller' => 'v1/kunjungan', 'pluralize' => false],
                ['class' => 'yii\rest\UrlRule', 'controller' => 'v1/diagnosa', 'pluralize' => false],
                // ['class' => 'yii\rest\UrlRule', 'controller' => 'v1/rbac', 'pluralize' => false],  // Disable REST rule for rbac to allow custom actions
                ['class' => 'yii\rest\UrlRule', 'controller' => 'v1/user', 'pluralize' => false],
                ['class' => 'yii\rest\UrlRule', 'controller' => 'v1/specialist', 'pluralize' => false],
                ['class' => 'yii\rest\UrlRule', 'controller' => 'v1/tindakan-category', 'pluralize' => false],
                ['class' => 'yii\rest\UrlRule', 'controller' => 'v1/jenis-pemeriksaan-lab', 'pluralize' => false],
                ['class' => 'yii\rest\UrlRule', 'controller' => 'v1/obat-category', 'pluralize' => false],
                ['class' => 'yii\rest\UrlRule', 'controller' => 'v1/jenis-pemeriksaan-lab-category', 'pluralize' => false],
                ['class' => 'yii\rest\UrlRule', 'controller' => 'v1/integration', 'pluralize' => false],
                'OPTIONS auth/<action:\w+>' => 'v1/auth/options',
                'OPTIONS v1/<controller:\w+>' => 'v1/<controller>/options',
                'OPTIONS <controller:\w+>' => 'v1/<controller>/options',
                'OPTIONS laporan/<action:\w+>' => 'v1/laporan/<action>',
                'OPTIONS integration/<action:\w+>' => 'v1/integration/<action>',
                'OPTIONS rbac/<action:\w+>' => 'v1/rbac/<action>',
                'OPTIONS jadwal-praktik' => 'v1/jadwal/index',
                'OPTIONS tindakan-category' => 'v1/tindakan-category/options',
                'OPTIONS obat-category' => 'v1/obat-category/options',
                'OPTIONS jenis-pemeriksaan-lab' => 'v1/jenis-pemeriksaan-lab/options',
                'OPTIONS jenis-pemeriksaan-lab-category' => 'v1/jenis-pemeriksaan-lab-category/options',
                'OPTIONS integration/logs' => 'v1/integration/options',
            ],
        ],
    ],
    'params' => $params,
    'modules' => [
        'v1' => [
            'class' => 'api\modules\v1\Module',
        ],
    ],
    'as cors' => [
        'class' => 'yii\filters\Cors',
        'cors' => [
            'Origin' => ['http://localhost:3000', 'http://127.0.0.1:3000'],
            'Access-Control-Request-Method' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
            'Access-Control-Request-Headers' => ['*'],
            'Access-Control-Allow-Credentials' => true,
            'Access-Control-Max-Age' => 86400,
            'Access-Control-Expose-Headers' => ['X-Pagination-Total-Count', 'X-Pagination-Page-Count', 'X-Pagination-Current-Page', 'X-Pagination-Per-Page'],
        ],
    ],
    'as rateLimit' => [
        'class' => 'common\filters\RateLimitFilter',
        'limit' => 100,
        'window' => 60,
    ],
]);
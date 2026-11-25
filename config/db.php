<?php

$projectRoot = dirname(__DIR__);
$envFile = $projectRoot . DIRECTORY_SEPARATOR . '.env';

if (class_exists(\Dotenv\Dotenv::class) && is_file($envFile)) {
    \Dotenv\Dotenv::createImmutable($projectRoot)->safeLoad();
}

$env = static function (string $key, mixed $default = null): mixed {
    if (array_key_exists($key, $_ENV)) {
        return $_ENV[$key];
    }

    if (array_key_exists($key, $_SERVER)) {
        return $_SERVER[$key];
    }

    $value = getenv($key);
    return $value === false ? $default : $value;
};

return [
    'class' => \yii\db\Connection::class,
    'dsn' => sprintf(
        'pgsql:host=%s;port=%s;dbname=%s',
        $env('DB_HOST', 'localhost'),
        $env('DB_PORT', '5432'),
        $env('DB_NAME', 'simrs_db')
    ),
    'username' => $env('DB_USER', 'postgres'),
    'password' => $env('DB_PASSWORD', ''),
    'charset' => 'utf8',
    'tablePrefix' => 'simrs_',
    'attributes' => [
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::ATTR_STRINGIFY_FETCHES => false,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_PERSISTENT => true,
    ],
    'enableSchemaCache' => getenv('APP_ENV') === 'production',
    'schemaCacheDuration' => 3600,
    'schemaCache' => 'cache',
];

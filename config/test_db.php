<?php

$db = require __DIR__ . '/db.php';
// Basis data uji terpisah. Jangan jalankan pengujian pada basis data development atau produksi.
$db['dsn'] = sprintf(
    'pgsql:host=%s;port=%s;dbname=%s',
    getenv('TEST_DB_HOST') ?: 'localhost',
    getenv('TEST_DB_PORT') ?: '5432',
    getenv('TEST_DB_NAME') ?: 'simrs_test'
);
$db['username'] = getenv('TEST_DB_USER') ?: (getenv('DB_USER') ?: 'postgres');
$db['password'] = getenv('TEST_DB_PASSWORD') ?: (getenv('DB_PASSWORD') ?: '');

return $db;

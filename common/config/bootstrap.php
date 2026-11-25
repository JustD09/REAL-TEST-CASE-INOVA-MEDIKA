<?php

use yii\BaseYii as Yii;
use common\components\AuditLogger;
use common\components\IdempotencyHandler;

// Fungsi bantuan global
if (!function_exists('simrs_generate_id')) {
    function simrs_generate_id(string $prefix = ''): string
    {
        return $prefix . strtoupper(bin2hex(random_bytes(8)));
    }
}

if (!function_exists('simrs_format_currency')) {
    function simrs_format_currency(float|int $amount, bool $withSymbol = true): string
    {
        $formatted = number_format($amount, 0, ',', '.');
        return $withSymbol ? 'Rp ' . $formatted : $formatted;
    }
}

if (!function_exists('simrs_calculate_age')) {
    function simrs_calculate_age(string $birthDate, ?string $referenceDate = null): int
    {
        $birth = new DateTime($birthDate);
        $ref = $referenceDate ? new DateTime($referenceDate) : new DateTime();
        return $birth->diff($ref)->y;
    }
}

// Komponen bootstrap
Yii::$container->setSingleton(AuditLogger::class);
Yii::$container->setSingleton(IdempotencyHandler::class);
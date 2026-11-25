<?php

return [
    'adminEmail' => 'admin@simrs.local',
    'appName' => 'SIMRS - Sistem Informasi Manajemen Rumah Sakit',
    'hospitalName' => 'Rumah Sakit Inova Medika',
    'hospitalAddress' => 'Jl. Kesehatan No. 123, Jakarta',
    'hospitalPhone' => '(021) 12345678',
    'hospitalEmail' => 'info@rsinova.com',
    
    // Pagination
    'pagination.pageSize' => 20,
    'pagination.pageSizeOptions' => [10, 20, 50, 100],
    
    // Queue settings
    'queue.autoGenerateNumber' => true,
    'queue.prefix' => 'ANT',
    'queue.resetDaily' => true,
    
    // Billing
    'billing.autoCalculate' => true,
    'billing.taxPercent' => 0,
    'billing.serviceChargePercent' => 0,
    'billing.rounding' => 100, // pembulatan ke 100
    
    // Stock
    'stock.allowNegative' => false,
    'stock.lowStockThreshold' => 10,
    'stock.autoDeductOnDispense' => true,
    
    // Payment
    'payment.idempotencyKeyPrefix' => 'PAY_',
    'payment.maxPartialPayments' => 5,
    'payment.simulationMode' => true,
    
    // API
    'jwtSecret' => 'simrs-secret-key',
    'api.rateLimit' => 100, // permintaan per menit
    'api.jwtExpiration' => 3600, // 1 hour
    'api.jwtRefreshExpiration' => 604800, // 7 days
    
    // File upload
    'upload.maxFileSize' => 10 * 1024 * 1024, // 10MB
    'upload.allowedExtensions' => ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
    'upload.path' => '@webroot/uploads/',
    
    // Report
    'report.defaultPeriod' => 'monthly',
    'report.exportFormats' => ['pdf', 'excel', 'csv'],
    
    // Node.js service
    'nodeService.url' => 'http://localhost:3001',
    'nodeService.apiKey' => 'simrs-node-service-key',
    'nodeService.timeout' => 30,
    
    // External integration
    'bpjs.enabled' => false,
    'bpjs.consId' => '',
    'bpjs.secretKey' => '',
    'bpjs.baseUrl' => 'https://api.bpjs-kesehatan.go.id',
    
    'satusehat.enabled' => false,
    'satusehat.clientId' => '',
    'satusehat.clientSecret' => '',
    'satusehat.baseUrl' => 'https://api.satusehat.kemkes.go.id',
];
<?php

// Router for PHP built-in server to handle subdirectory entry scripts
$requestUri = $_SERVER['REQUEST_URI'];
$scriptFile = __DIR__ . '/Yii-SIMRS/api/index.php';

// Parse the request URI
$pathInfo = parse_url($requestUri, PHP_URL_PATH);

// Set the correct script variables for the API entry point
$_SERVER['SCRIPT_NAME'] = '/Yii-SIMRS/api/index.php';
$_SERVER['PHP_SELF'] = '/Yii-SIMRS/api/index.php';
$_SERVER['SCRIPT_FILENAME'] = $scriptFile;
$_SERVER['DOCUMENT_ROOT'] = __DIR__;

// The router.php is invoked for ALL requests when using `php -S localhost:8443 router.php`
// REQUEST_URI contains the original request path (e.g., /auth/login)
// We need to keep REQUEST_URI as-is for Yii2 routing

error_log("Routing request: " . $requestUri);
error_log("SCRIPT_NAME: " . $_SERVER['SCRIPT_NAME']);
error_log("SCRIPT_FILENAME: " . $_SERVER['SCRIPT_FILENAME']);
error_log("DOCUMENT_ROOT: " . $_SERVER['DOCUMENT_ROOT']);

// Include the actual entry point
require $scriptFile;
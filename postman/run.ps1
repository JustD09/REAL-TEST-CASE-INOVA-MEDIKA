#!/usr/bin/env pwsh
<# 
.SYNOPSIS
    Run Postman API Tests for Yii-SIMRS and generate PDF report

.DESCRIPTION
    This script installs dependencies, runs the Postman collection via Newman,
    and generates a PDF report with API responses for documentation.

.NOTES
    Requires Node.js 16+ installed
    Postman collection: Yii-SIMRS-API.postman_collection.json
    Environment: environment.json
#>

param(
    [string]$BaseUrl = "http://localhost:8080",
    [switch]$Bail
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Yii-SIMRS Postman API Test Runner" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "[INFO] Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Create results directory
$resultsDir = Join-Path $PSScriptRoot "results"
if (-not (Test-Path $resultsDir)) {
    New-Item -ItemType Directory -Path $resultsDir | Out-Null
    Write-Host "[INFO] Created results directory" -ForegroundColor Green
}

# Update environment with BaseUrl
$envPath = Join-Path $PSScriptRoot "environment.json"
$env = Get-Content $envPath -Raw | ConvertFrom-Json
$baseUrlValue = $env.values | Where-Object { $_.key -eq 'baseUrl' }
if ($baseUrlValue) {
    $baseUrlValue.value = $BaseUrl
    $env | ConvertTo-Json -Depth 10 | Set-Content $envPath
    Write-Host "[INFO] Updated baseUrl to $BaseUrl" -ForegroundColor Green
}

# Install dependencies
Write-Host "[INFO] Installing dependencies..." -ForegroundColor Yellow
try {
    npm install
    Write-Host "[INFO] Dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Run tests
Write-Host "[INFO] Running Postman tests..." -ForegroundColor Yellow
$scriptPath = Join-Path $PSScriptRoot "run-tests.js"
$args = @($scriptPath)
if ($Bail) {
    $args += "--bail"
}

try {
    & node @args
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "SUCCESS! Reports generated:" -ForegroundColor Green
    Write-Host "  - $resultsDir\test-results.json" -ForegroundColor Green
    Write-Host "  - $resultsDir\test-report.html" -ForegroundColor Green
    Write-Host "  - $resultsDir\API_Test_Report.pdf" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
} catch {
    Write-Host "[ERROR] Tests failed" -ForegroundColor Red
    exit 1
}
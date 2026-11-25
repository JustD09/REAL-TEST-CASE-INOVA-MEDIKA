@echo off
REM Run Postman API Tests for Yii-SIMRS
REM Generates PDF report with API responses

echo ========================================
echo Yii-SIMRS Postman API Test Runner
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [INFO] Node.js found
echo.

REM Create results directory
if not exist "results" mkdir results

echo [INFO] Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [INFO] Running tests and generating PDF report...
call npm test

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Tests failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo SUCCESS! Report generated:
echo - results\test-results.json
echo - results\test-report.html
echo - results\API_Test_Report.pdf
echo ========================================
echo.

pause
@echo off
echo ========================================
echo Starting iYaya Backend Server
echo ========================================
echo.

cd /d "%~dp0iyaya-backend"

echo Checking if Node.js is installed...
node --version
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js is available
echo.

echo Installing dependencies...
npm install
echo.

echo Starting server...
echo Backend will be available at:
echo   - http://localhost:5000
echo   - http://127.0.0.1:5000
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

node server.js
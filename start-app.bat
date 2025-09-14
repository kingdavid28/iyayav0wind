@echo off
echo Starting Iyaya App...
echo.

echo Checking if backend is running...
curl -s http://localhost:5000/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo Backend not running. Starting backend...
    start "Backend" cmd /c "cd iyaya-backend && node app.js"
    timeout /t 5 >nul
) else (
    echo Backend is already running.
)

echo.
echo Starting Expo development server...
npx expo start

pause
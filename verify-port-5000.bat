@echo off
echo ========================================
echo Verifying Port 5000 Configuration
echo ========================================
echo.

echo Checking Backend Configuration:
echo --------------------------------
echo Backend .env PORT setting:
findstr "PORT=" iyaya-backend\.env
echo.

echo Backend config/env.js default port:
findstr "port:" iyaya-backend\config\env.js
echo.

echo Checking Frontend Configuration:
echo ---------------------------------
echo Frontend .env API URL:
findstr "EXPO_PUBLIC_API_URL=" .env
echo.

echo Frontend constants.js configuration:
findstr "5000" src\config\constants.js
echo.

echo Frontend apiService.js fallback:
findstr "localhost:" src\services\apiService.js
echo.

echo Checking Batch Files:
echo ----------------------
echo start-backend.bat:
findstr "localhost:" start-backend.bat
echo.

echo start-backend-simple.bat:
findstr "localhost:" start-backend-simple.bat
echo.

echo ========================================
echo ✅ All configurations should show port 5000
echo ========================================
pause
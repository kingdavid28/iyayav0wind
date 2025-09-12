@echo off
echo ========================================
echo Fixing Nannies Endpoint Issue
echo ========================================
echo.

echo The issue was that your frontend calls /nannies
echo but your backend only had /caregivers routes.
echo.

echo ✅ Added /nannies route alias in backend
echo.

echo Now restart your backend:
echo 1. Press Ctrl+C in the backend terminal
echo 2. Run: start-backend.bat
echo.

echo Or use this command:
cd /d "%~dp0iyaya-backend"
echo Restarting backend server...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul
node server.js
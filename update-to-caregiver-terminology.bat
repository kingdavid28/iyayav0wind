@echo off
echo ========================================
echo Updated to Caregiver Terminology
echo ========================================
echo.

echo ✅ Changes made:
echo - Frontend now uses /caregivers instead of /nannies
echo - Updated API imports and exports
echo - Updated AppContext state (nannies → caregivers)
echo - Updated logging and cache keys
echo - Removed /nannies backend alias
echo.

echo 🔄 Restart both servers:
echo 1. Backend: Ctrl+C then start-backend.bat
echo 2. Frontend: Ctrl+C then npx expo start
echo.

echo Now consistently using "caregiver" terminology! 🎯
pause
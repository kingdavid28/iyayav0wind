@echo off
echo ========================================
echo Restarting Expo with Network Fix
echo ========================================
echo.

echo ✅ Backend is running on: http://10.207.238.117:5000
echo ✅ API configuration updated with your network IP
echo.

echo Clearing Expo cache and restarting...
npx expo start --clear

echo.
echo ========================================
echo If connection still fails, try:
echo   npx expo start --tunnel
echo ========================================
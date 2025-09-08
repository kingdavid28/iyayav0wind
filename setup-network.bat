@echo off
echo Setting up network configuration for Expo Go...
echo.

echo Your current network configuration:
ipconfig | findstr /i "IPv4"

echo.
echo Starting Expo development server with network access...
echo This will allow your phone to connect via Expo Go
echo.

npx expo start --clear

pause
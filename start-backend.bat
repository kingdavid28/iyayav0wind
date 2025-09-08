@echo off
echo Starting Iyaya Backend Server...
echo.

cd /d "c:\Users\reycel\iYayaAll2\iyayav0CleanStart todeepseek\iyaya-backend"

echo Checking if Node.js is installed...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version

echo.
echo Installing dependencies...
npm install

echo.
echo Starting server...
npm start

pause
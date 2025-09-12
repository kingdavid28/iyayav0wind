@echo off
echo Starting iYaya Backend Server...
echo.

cd /d "c:\Users\reycel\iYayaAll2\iyayav0CleanStart todeepseek\iyaya-backend"

if not exist "node_modules" (
    echo Installing backend dependencies...
    npm install
)

echo.
echo Starting server on port 5000...
echo Backend will be available at: http://localhost:5000
echo.

node app.js
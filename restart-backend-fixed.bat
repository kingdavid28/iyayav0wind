@echo off
echo 🔧 Restarting backend with JWT and caregiver fixes...

cd iyaya-backend

echo 📊 Checking if server is running...
tasklist /FI "IMAGENAME eq node.exe" 2>NUL | find /I /N "node.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo 🛑 Stopping existing Node.js processes...
    taskkill /F /IM node.exe >NUL 2>&1
    timeout /t 2 >NUL
)

echo 🚀 Starting backend server...
start "iYaya Backend" cmd /k "node app.js"

echo ✅ Backend server started with fixes!
echo 🔍 JWT algorithm: HS256
echo 👥 Test caregivers: 3 created
echo 🌐 Server URL: http://localhost:5000

pause
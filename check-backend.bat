@echo off
echo ========================================
echo Backend Connection Diagnostics
echo ========================================
echo.

echo 1. Checking if backend is running on port 5000...
netstat -an | findstr :5000
if %errorlevel% equ 0 (
    echo ✅ Port 5000 is in use
) else (
    echo ❌ Port 5000 is not in use - Backend may not be running
)
echo.

echo 2. Testing localhost connection...
curl -s -o nul -w "Status: %%{http_code}" http://localhost:5000/api/health
echo.

echo 3. Testing 127.0.0.1 connection...
curl -s -o nul -w "Status: %%{http_code}" http://127.0.0.1:5000/api/health
echo.

echo 4. Getting your network IP...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set ip=%%a
    set ip=!ip: =!
    echo Network IP: !ip!
    echo Testing network connection...
    curl -s -o nul -w "Status: %%{http_code}" http://!ip!:5000/api/health
    echo.
)

echo 5. Checking if backend process is running...
tasklist | findstr node.exe
echo.

echo ========================================
echo If you see "Status: 200" above, backend is working
echo If you see connection errors, start backend with:
echo   cd iyaya-backend
echo   node server.js
echo ========================================
pause
@echo off
echo ========================================
echo MongoDB Atlas Troubleshooting & Setup
echo ========================================
echo.

echo 🔍 Checking MongoDB Atlas Cluster Status...
echo.

REM Test MongoDB Atlas connection
echo Testing Atlas connection...
node test-mongodb.js

if %errorlevel% == 0 (
    echo.
    echo ✅ SUCCESS: MongoDB Atlas is accessible!
    echo.
    echo Your backend should now start successfully.
    echo Starting backend server...
    echo.
    npm start
) else (
    echo.
    echo ❌ MongoDB Atlas connection failed.
    echo.
    echo 🔧 SETTING UP LOCAL MONGODB AS BACKUP...
    echo.
    echo To use MongoDB Atlas:
    echo 1. Go to https://cloud.mongodb.com
    echo 2. Sign in to your account
    echo 3. Check if your cluster is paused (free clusters auto-pause)
    echo 4. Click "Resume" if paused
    echo 5. Verify network access settings
    echo.
    echo To use local MongoDB instead:
    echo 1. Download from: https://www.mongodb.com/try/download/community
    echo 2. Install with default settings
    echo 3. Run: net start MongoDB
    echo.
    echo Switching to local MongoDB for now...
    echo.

    REM Switch to local MongoDB
    powershell -Command "(Get-Content .env) -replace 'mongodb\+srv://.*', 'mongodb://localhost:27017/iyaya' | Set-Content .env"

    echo ✅ Switched to local MongoDB configuration
    echo.
    echo Starting backend with local MongoDB...
    npm start
)

pause

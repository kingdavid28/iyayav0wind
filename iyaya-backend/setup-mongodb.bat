@echo off
echo ========================================
echo MongoDB Setup for Iyaya Backend
echo ========================================
echo.

echo Checking if MongoDB is installed...

REM Check if MongoDB is already installed
mongod --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ MongoDB is already installed
    goto :start_mongodb
)

echo ❌ MongoDB not found. Installing MongoDB Community Edition...

REM Download and install MongoDB (requires administrative privileges)
echo.
echo To install MongoDB:
echo 1. Visit: https://www.mongodb.com/try/download/community
echo 2. Download MongoDB Community Server for Windows
echo 3. Run the installer with default settings
echo 4. Make sure MongoDB is added to PATH
echo.
echo Alternative: Use Docker
echo docker run -d -p 27017:27017 --name mongodb mongo:latest
echo.
pause
exit /b 1

:start_mongodb
echo.
echo Starting MongoDB service...

REM Try to start MongoDB service
net start MongoDB >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ MongoDB service started successfully
) else (
    echo ⚠️ MongoDB service not found, trying to start manually...
    echo Starting MongoDB with default data directory...
    mongod --dbpath "C:\data\db" --bind_ip 127.0.0.1
    if %errorlevel% == 0 (
        echo ✅ MongoDB started manually
    ) else (
        echo ❌ Failed to start MongoDB
        echo.
        echo Troubleshooting:
        echo 1. Create data directory: mkdir "C:\data\db"
        echo 2. Try: mongod --dbpath "C:\data\db"
        echo 3. Or install MongoDB service: mongod --install
        echo.
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo MongoDB is now running!
echo ========================================
echo.
echo You can now start the Iyaya backend:
echo npm start
echo.
pause

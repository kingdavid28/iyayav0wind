#!/usr/bin/env pwsh

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MongoDB Setup for Iyaya Backend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if MongoDB is already installed
try {
    $null = & mongod --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ MongoDB is already installed" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ MongoDB not found. Installing MongoDB Community Edition..." -ForegroundColor Red
    Write-Host ""
    Write-Host "To install MongoDB:" -ForegroundColor Yellow
    Write-Host "1. Visit: https://www.mongodb.com/try/download/community" -ForegroundColor Yellow
    Write-Host "2. Download MongoDB Community Server for Windows" -ForegroundColor Yellow
    Write-Host "3. Run the installer with default settings" -ForegroundColor Yellow
    Write-Host "4. Make sure MongoDB is added to PATH" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternative: Use Docker" -ForegroundColor Yellow
    Write-Host "docker run -d -p 27017:27017 --name mongodb mongo:latest" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter after installing MongoDB"
}

Write-Host ""
Write-Host "Starting MongoDB..." -ForegroundColor Cyan

# Try to start MongoDB service
try {
    Start-Service -Name MongoDB -ErrorAction Stop
    Write-Host "✅ MongoDB service started successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️ MongoDB service not found, trying to start manually..." -ForegroundColor Yellow

    # Create data directory if it doesn't exist
    if (!(Test-Path "C:\data\db")) {
        New-Item -ItemType Directory -Path "C:\data\db" -Force | Out-Null
        Write-Host "📁 Created data directory: C:\data\db" -ForegroundColor Yellow
    }

    # Start MongoDB manually
    try {
        Start-Process -FilePath "mongod" -ArgumentList "--dbpath", "C:\data\db", "--bind_ip", "127.0.0.1" -NoNewWindow
        Write-Host "✅ MongoDB started manually" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to start MongoDB" -ForegroundColor Red
        Write-Host ""
        Write-Host "Troubleshooting:" -ForegroundColor Yellow
        Write-Host "1. Create data directory: mkdir C:\data\db" -ForegroundColor Yellow
        Write-Host "2. Try: mongod --dbpath C:\data\db" -ForegroundColor Yellow
        Write-Host "3. Or install MongoDB service: mongod --install" -ForegroundColor Yellow
        Write-Host ""
        Read-Host "Press Enter to continue"
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MongoDB is now running!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now start the Iyaya backend:" -ForegroundColor Yellow
Write-Host "npm start" -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to continue"

@echo off
echo Cleaning up consolidated services...

REM Create backup directory
if not exist "src\services\backup" mkdir "src\services\backup"

REM Move old services to backup (instead of deleting)
echo Moving old services to backup...
move "src\services\apiService.js" "src\services\backup\" 2>nul
move "src\services\authService.js" "src\services\backup\" 2>nul
move "src\services\bookingService.js" "src\services\backup\" 2>nul
move "src\services\chatClient.js" "src\services\backup\" 2>nul
move "src\services\crudService.js" "src\services\backup\" 2>nul
move "src\services\customEmailService.js" "src\services\backup\" 2>nul
move "src\services\emailService.js" "src\services\backup\" 2>nul
move "src\services\fetchMyBookings.js" "src\services\backup\" 2>nul
move "src\services\firebaseAuthService.js" "src\services\backup\" 2>nul
move "src\services\integratedService.js" "src\services\backup\" 2>nul
move "src\services\jobService.js" "src\services\backup\" 2>nul
move "src\services\nativeAuthShim.js" "src\services\backup\" 2>nul
move "src\services\notificationService.js" "src\services\backup\" 2>nul
move "src\services\profileService.js" "src\services\backup\" 2>nul
move "src\services\ratingService.js" "src\services\backup\" 2>nul
move "src\services\realtime.js" "src\services\backup\" 2>nul
move "src\services\settingsService.js" "src\services\backup\" 2>nul
move "src\services\socketService.js" "src\services\backup\" 2>nul
move "src\services\userService.js" "src\services\backup\" 2>nul

REM Keep messagingService.js as it's still referenced directly
echo Keeping messagingService.js for compatibility...

echo.
echo ✅ Service consolidation complete!
echo.
echo 📁 Old services backed up to: src\services\backup\
echo 🚀 New consolidated service: src\services\index.js
echo 📖 Migration guide: src\services\MIGRATION.md
echo.
echo All existing imports will continue to work.
echo Consider migrating to apiService.xxx pattern for enhanced features.
pause
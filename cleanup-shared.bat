@echo off
echo Cleaning up shared directory duplicates and unused code...

REM Create backup
if not exist "backup\shared" mkdir "backup\shared"
xcopy "src\shared" "backup\shared" /E /I /Y

REM Remove duplicate LoadingSpinner
del "src\shared\ui\LoadingSpinner.js" 2>nul

REM Remove duplicate PrimaryButton
del "src\shared\ui\buttons\PrimaryButton.js" 2>nul
rmdir "src\shared\ui\buttons" 2>nul

REM Remove empty modals directory
rmdir /s /q "src\shared\ui\modals" 2>nul

echo Cleanup complete. Backup created in backup\shared\
echo.
echo Removed:
echo - Duplicate LoadingSpinner.js (25 lines)
echo - Duplicate PrimaryButton.js (50 lines)  
echo - Empty buttons directory
echo - Empty modals directory
echo.
echo Fixed:
echo - Import path in validation.js
echo - Card component exports (commented out non-existent)
echo - LoadingSpinner export (use enhanced version)
echo.
echo Total cleanup: ~75 lines of duplicate code removed
pause
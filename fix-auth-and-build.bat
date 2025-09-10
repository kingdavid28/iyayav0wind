@echo off
echo 🔧 Fixing authentication and preparing for build...

echo.
echo 1. Creating test users in database...
cd iyaya-backend
node createTestUser.js
cd ..

echo.
echo 2. Testing backend connection...
curl -X GET http://192.168.1.10:5000/api/health

echo.
echo 3. Clearing Expo cache...
npx expo start --clear --no-dev --minify

echo.
echo 4. Ready for build. Run: eas build --platform android --clear-cache
pause
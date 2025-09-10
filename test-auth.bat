@echo off
echo 🔧 Testing authentication fix...

echo.
echo 1. Testing backend health...
curl -X GET http://192.168.1.10:5000/api/health

echo.
echo 2. Creating test users...
curl -X POST http://192.168.1.10:5000/api/dev/create-test-users

echo.
echo 3. Testing login with test user...
curl -X POST http://192.168.1.10:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"test@test.com\",\"password\":\"password123\"}"

echo.
echo ✅ Authentication should now work with:
echo 📧 Parent: test@test.com / password123
echo 📧 Caregiver: caregiver@test.com / password123
pause
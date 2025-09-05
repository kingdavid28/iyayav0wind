@echo off
echo Installing missing dependencies...

cd /d "c:\Users\reycel\iYayaAll2\iyayav0CleanStart todeepseek\iyaya-backend"

echo Installing Joi for validation...
npm install joi

echo Installing Firebase Admin SDK...
npm install firebase-admin

echo Installing Socket.IO for real-time features...
npm install socket.io

echo Installing additional utilities...
npm install lodash

echo All dependencies installed!
pause
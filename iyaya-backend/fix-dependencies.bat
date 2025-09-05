@echo off
echo Installing missing dependencies...

cd /d "c:\Users\reycel\iYayaAll2\iyayav0CleanStart todeepseek\iyaya-backend"

echo Installing Joi for validation...
npm install joi

echo Starting server...
node server.js

pause
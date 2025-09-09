# Network Connection Fix Guide

## Quick Fix Steps

### 1. Start Backend Server
```bash
# Run this in the project root directory
start-backend-simple.bat
```

### 2. Check Backend Status
```bash
# Run this to verify backend is working
check-backend.bat
```

### 3. Start Frontend
```bash
# In project root
npx expo start --clear
```

## Troubleshooting

### Backend Not Starting
If backend fails to start:
1. Install Node.js from https://nodejs.org/
2. Open Command Prompt as Administrator
3. Navigate to project folder
4. Run: `cd iyaya-backend && npm install && node server.js`

### Network Connection Issues
If you see "Network request failed":

1. **Check your network IP:**
   - Run `ipconfig` in Command Prompt
   - Look for "IPv4 Address" under your WiFi adapter
   - Example: `192.168.1.10`

2. **Update backend .env file:**
   - Open `iyaya-backend\.env`
   - Add your IP to CORS_ORIGIN:
   ```
   CORS_ORIGIN=http://localhost:8081,http://127.0.0.1:8081,http://YOUR_IP:8081,http://YOUR_IP:19006
   ```

3. **Restart both servers:**
   - Stop backend (Ctrl+C)
   - Stop Expo (Ctrl+C)
   - Start backend: `start-backend-simple.bat`
   - Start Expo: `npx expo start --clear`

### Expo Go Connection
For physical device testing:
1. Ensure phone and computer are on same WiFi
2. Backend should show your network IP when starting
3. Use the network IP shown in backend startup logs
4. If still failing, try: `npx expo start --tunnel`

## Expected Output

### Backend Started Successfully:
```
🚀 Server running in development mode
🔗 Local: http://localhost:5000
🌐 Network: http://192.168.1.10:5000
📱 Expo Go: Use http://192.168.1.10:5000
```

### Frontend Connected:
```
✅ Detected working API: http://localhost:5000/api
```

## Common Issues

1. **Port 5000 in use**: Change PORT in `.env` to 5001
2. **Firewall blocking**: Allow Node.js through Windows Firewall
3. **Antivirus blocking**: Add project folder to antivirus exclusions
4. **Network switching**: Restart both servers when changing networks
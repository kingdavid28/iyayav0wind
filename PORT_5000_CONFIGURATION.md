# Port 5000 Configuration Summary

## ✅ Confirmed Port 5000 Usage

Your Iyaya app is now consistently configured to use **port 5000** across all components:

### Backend Configuration
- **iyaya-backend/.env**: `PORT=5000` ✅
- **iyaya-backend/config/env.js**: `port: parseInt(process.env.PORT) || 5000` ✅
- **iyaya-backend/server.js**: Uses config.port (which reads from .env) ✅

### Frontend Configuration
- **.env**: `EXPO_PUBLIC_API_URL="http://192.168.1.10:5000"` ✅
- **src/config/constants.js**: Uses port 5000 in baseHost calculation ✅
- **src/services/apiService.js**: Fallback URL updated to `http://localhost:5000/api` ✅

### Startup Scripts
- **start-backend.bat**: Updated to show port 5000 ✅
- **start-backend-simple.bat**: Already configured for port 5000 ✅

### Example Files
- **.env.example**: Updated to use port 5000 ✅

## 🚀 How to Start Your App

### 1. Start Backend (Port 5000)
```bash
# Option 1: Use batch file
start-backend.bat

# Option 2: Manual start
cd iyaya-backend
node server.js
```

### 2. Start Frontend (Expo)
```bash
# In project root
npx expo start
```

## 🔧 Network Configuration

Your current setup:
- **Backend**: Running on `http://localhost:5000` and `http://192.168.1.10:5000`
- **Frontend**: Configured to connect to `http://192.168.1.10:5000`

## 📱 For Expo Go (Physical Device)

Make sure your phone and computer are on the same WiFi network, then:
1. Backend will be accessible at: `http://192.168.1.10:5000`
2. Frontend will automatically connect to this address
3. Scan the QR code from `npx expo start`

## 🔍 Verification

Run the verification script to confirm all settings:
```bash
verify-port-5000.bat
```

## 🎯 Key Benefits of Port 5000

- **Consistency**: All components use the same port
- **No Conflicts**: Avoids common port conflicts (3000 is often used by React dev servers)
- **Clear Configuration**: Easy to identify and maintain
- **Production Ready**: Standard port that works well in production environments

## 🔧 If You Need to Change the Port

To change to a different port (e.g., 8000):

1. Update `iyaya-backend/.env`: `PORT=8000`
2. Update `.env`: `EXPO_PUBLIC_API_URL="http://192.168.1.10:8000"`
3. The rest will automatically adapt through the configuration system

---

**Remember**: Always use port 5000 for this project! 🎯
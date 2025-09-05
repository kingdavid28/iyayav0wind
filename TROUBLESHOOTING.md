# Iyaya App Troubleshooting Guide

## Authentication Issues

### Problem: "Token invalid or network timeout, removing from storage"

**Symptoms:**
- App shows "Authentication required" errors
- Falls back to mock data
- User gets logged out automatically

**Solutions:**

1. **Start the Backend Server**
   ```bash
   # Option 1: Use the batch file
   start-backend.bat
   
   # Option 2: Manual start
   cd iyaya-backend
   npm run server
   ```

2. **Check Backend Status**
   ```bash
   node check-backend.js
   ```

3. **Verify Network Configuration**
   - Ensure your device/simulator can reach the backend
   - For iOS Simulator: Backend should be on `http://localhost:5001`
   - For Android Emulator: Backend should be on `http://10.0.2.2:5001`
   - For Physical Device: Use your computer's IP address

### Problem: Network Connection Issues

**Solutions:**

1. **Update API Base URL**
   - Check `src/config/constants.js`
   - Ensure the correct IP address is used for your network

2. **Firewall Settings**
   - Allow Node.js through Windows Firewall
   - Ensure port 5001 is not blocked

3. **Environment Variables**
   - Check `iyaya-backend/.env` file exists
   - Verify MongoDB connection string is correct

## Backend Server Issues

### Problem: Server Won't Start

**Check these files:**
1. `iyaya-backend/.env` - Environment configuration
2. `iyaya-backend/package.json` - Dependencies
3. MongoDB connection - Ensure database is accessible

**Common fixes:**
```bash
cd iyaya-backend
npm install  # Reinstall dependencies
npm run server  # Start in development mode
```

### Problem: Database Connection Errors

**Solutions:**
1. Check MongoDB Atlas connection string in `.env`
2. Verify network access to MongoDB
3. Check database credentials

## Mobile App Issues

### Problem: App Stuck on Loading Screen

**Solutions:**
1. Clear app cache/storage
2. Restart Metro bundler: `npx expo start --clear`
3. Check if backend is running

### Problem: Mock Data Showing Instead of Real Data

**This is expected behavior when:**
- Backend server is not running
- Network connection fails
- Authentication token is invalid

**To fix:**
1. Start backend server
2. Clear app storage and re-login
3. Check network connectivity

## Development Setup

### Quick Start Checklist

1. ✅ Backend server running (`npm run server` in iyaya-backend/)
2. ✅ MongoDB connection working
3. ✅ Expo development server running (`npx expo start`)
4. ✅ Device/simulator can reach backend API

### Network Configuration

**For Development:**
- iOS Simulator: `http://localhost:5001/api`
- Android Emulator: `http://10.0.2.2:5001/api`
- Physical Device: `http://[YOUR_IP]:5001/api`

### Environment Files

**Frontend (.env):**
```
EXPO_PUBLIC_API_URL=http://localhost:5001
```

**Backend (.env):**
```
PORT=5001
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

## Common Error Messages

### "Authentication required"
- Backend not running or unreachable
- Invalid/expired JWT token
- **Fix:** Start backend, clear app storage, re-login

### "Network timeout"
- Backend server not responding
- Network connectivity issues
- **Fix:** Check backend status, verify network configuration

### "Cannot connect to server"
- Backend server is down
- Wrong API URL configuration
- **Fix:** Start backend server, check API configuration

## Testing Authentication

1. **Check Backend Health:**
   ```bash
   curl http://localhost:5001/api/health
   ```

2. **Test Login Endpoint:**
   ```bash
   curl -X POST http://localhost:5001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password"}'
   ```

3. **Verify Token Storage:**
   - Check AsyncStorage in React Native Debugger
   - Look for `@auth_token` key

## Getting Help

If issues persist:
1. Check the console logs in both frontend and backend
2. Verify all environment variables are set correctly
3. Ensure all dependencies are installed (`npm install`)
4. Try clearing all caches and restarting everything

## Quick Recovery Steps

1. **Full Reset:**
   ```bash
   # Stop all servers
   # Clear app storage/cache
   cd iyaya-backend && npm run server
   # In new terminal:
   npx expo start --clear
   ```

2. **Check Everything is Working:**
   ```bash
   node check-backend.js
   ```
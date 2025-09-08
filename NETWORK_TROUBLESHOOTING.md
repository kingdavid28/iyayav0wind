# Network Troubleshooting Guide

## Quick Fix for Network Issues

### 1. Start the Backend Server

**Option A: Use the batch script**
```bash
# Double-click this file or run in command prompt:
start-backend.bat
```

**Option B: Manual start**
```bash
cd iyaya-backend
npm install
npm start
```

The server should start on port 5000 and display network information like:
```
🚀 Server running in development mode
🔗 Local: http://localhost:5000
🌐 Network: http://192.168.1.10:5000
📱 Expo Go: Use http://192.168.1.10:5000
```

### 2. Fix Frontend Network Configuration

**Option A: Use the setup script**
```bash
# Double-click this file or run in command prompt:
setup-network.bat
```

**Option B: Manual setup**
```bash
# In the main project directory
npx expo start --clear
```

### 3. Verify Connection

1. **Check if backend is running:**
   - Open browser and go to: `http://localhost:5000/api/health`
   - You should see: `{"status":"success","message":"Server is running"}`

2. **Check network IP:**
   - Look at the backend startup logs for your network IP
   - Example: `🌐 Network: http://192.168.1.10:5000`

3. **Test from your phone:**
   - Make sure your phone is on the same WiFi network
   - Open browser on phone and go to: `http://YOUR_NETWORK_IP:5000/api/health`

## Common Issues and Solutions

### Issue 1: "Network request failed"
**Cause:** Backend server is not running or not accessible
**Solution:**
1. Start the backend server using `start-backend.bat`
2. Check Windows Firewall settings
3. Ensure your phone and computer are on the same WiFi network

### Issue 2: "Base64 upload failed"
**Cause:** Upload timeout or server not responding
**Solution:**
1. Restart the backend server
2. Check your internet connection
3. Try uploading a smaller image

### Issue 3: "Change profile photo failed"
**Cause:** Image upload endpoint not accessible
**Solution:**
1. Verify backend is running on port 5000
2. Check the network IP in backend logs
3. Restart Expo with `npx expo start --clear`

### Issue 4: ImagePicker deprecation warnings
**Status:** ✅ FIXED - All MediaTypeOptions have been updated to MediaType

## Network Configuration Details

### Backend Configuration
- **Port:** 5000
- **Health Check:** `/api/health`
- **CORS:** Configured for Expo Go and local development
- **Upload Limits:** 10MB for images and documents

### Frontend Configuration
- **Dynamic IP Detection:** Automatically tests multiple network ranges
- **Fallback System:** Uses mock data when backend is unavailable
- **Caching:** 5-minute cache for successful API endpoints

## Manual Network Setup

If automatic detection fails, you can manually configure the network:

1. **Find your computer's IP address:**
   ```bash
   ipconfig
   ```
   Look for "IPv4 Address" under your WiFi adapter

2. **Update API configuration (if needed):**
   - The app automatically detects working endpoints
   - No manual configuration should be needed

3. **Restart services:**
   ```bash
   # Backend
   cd iyaya-backend
   npm start
   
   # Frontend
   npx expo start --clear
   ```

## Testing Checklist

- [ ] Backend server starts without errors
- [ ] Health check responds at `http://localhost:5000/api/health`
- [ ] Network IP is displayed in backend logs
- [ ] Expo Go can connect to the development server
- [ ] Phone and computer are on the same WiFi network
- [ ] Windows Firewall allows Node.js connections
- [ ] No ImagePicker deprecation warnings in logs

## Still Having Issues?

1. **Check Windows Firewall:**
   - Allow Node.js through Windows Defender Firewall
   - Allow port 5000 for both inbound and outbound connections

2. **Network Troubleshooting:**
   - Try connecting from a different device
   - Check if your router blocks device-to-device communication
   - Try using a mobile hotspot for testing

3. **Reset Everything:**
   ```bash
   # Stop all processes
   # Clear Expo cache
   npx expo start --clear --reset-cache
   
   # Restart backend
   cd iyaya-backend
   npm start
   ```

4. **Use Tunnel Mode (Last Resort):**
   ```bash
   npx expo start --tunnel
   ```
   This uses Expo's tunnel service but is slower.
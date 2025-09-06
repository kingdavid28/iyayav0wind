# Expo Go Setup Guide

This guide helps you run the Iyaya app on your physical device using Expo Go.

## Quick Setup

### 1. Automatic Network Configuration
```bash
# Run the network setup script
npm run setup-network

# Start the backend
cd iyaya-backend
npm run dev

# Start Expo with cache clear
npx expo start --clear
```

### 2. Manual Network Configuration

If automatic setup doesn't work, follow these steps:

#### Find Your Computer's IP Address

**Windows:**
```cmd
ipconfig
```
Look for "IPv4 Address" under your WiFi adapter (usually starts with 192.168.x.x)

**Mac/Linux:**
```bash
ifconfig
```
Look for "inet" address under your WiFi interface (usually starts with 192.168.x.x)

#### Update API Configuration

1. Open `src/config/api.js`
2. Replace the IP address in the `baseURLs` array with your computer's IP
3. Example: Change `192.168.1.10` to your actual IP like `192.168.0.105`

```javascript
baseURLs: [
  'http://YOUR_IP_HERE:5001/api',  // Replace with your IP
  // ... other fallback IPs
],
```

## Network Requirements

### Same WiFi Network
- Your computer and phone must be on the same WiFi network
- Corporate networks may block device-to-device communication
- Guest networks often don't allow device communication

### Firewall Settings
- Windows Firewall may block incoming connections
- Temporarily disable firewall or add exception for port 5001
- Add exception for Node.js in Windows Defender

### Port Configuration
- Backend runs on port 5001
- Expo dev server runs on port 19000-19006
- Make sure these ports are not blocked

## Troubleshooting

### Connection Issues

**Problem:** "Network request failed" or "Reset password failed: 404"
**Solutions:**
1. Check if backend is running: `http://YOUR_IP:5001/api/health`
2. Verify same WiFi network
3. Try tunnel mode: `npx expo start --tunnel`
4. Check firewall settings

**Problem:** "CORS blocked" errors
**Solutions:**
1. Backend automatically allows common IP ranges in development
2. Check console for CORS messages
3. Restart backend after IP changes

**Problem:** App loads but API calls fail
**Solutions:**
1. Run network detection: `npm run setup-network`
2. Clear Expo cache: `npx expo start --clear`
3. Check backend logs for connection attempts

### Alternative Connection Methods

#### Tunnel Mode (Slower but works everywhere)
```bash
npx expo start --tunnel
```
- Works through firewalls and different networks
- Slower than direct connection
- Good for corporate networks

#### USB Debugging (Android)
```bash
npx expo start --localhost
adb reverse tcp:5001 tcp:5001
```
- Requires Android Debug Bridge (ADB)
- Most reliable connection method
- Only works with Android devices

## Network Detection Features

The app includes automatic network detection:

- **Auto IP Detection:** Tries multiple common IP addresses
- **Health Check:** Tests backend connectivity before API calls
- **Fallback URLs:** Multiple IP configurations for different networks
- **Error Recovery:** Graceful handling of network failures

## Common Network Configurations

### Home Networks
- Router IP: `192.168.1.1` → Computer: `192.168.1.x`
- Router IP: `192.168.0.1` → Computer: `192.168.0.x`

### Corporate Networks
- Often use `10.0.x.x` or `172.16.x.x` ranges
- May require VPN or special configuration
- Try tunnel mode if direct connection fails

### Mobile Hotspot
- Usually `192.168.43.x` range
- Connect computer to phone's hotspot
- Phone and computer will be on same network

## Verification Steps

1. **Backend Health Check:**
   ```
   http://YOUR_IP:5001/api/health
   ```
   Should return: `{"status": "success", "message": "Server is running"}`

2. **Network Connectivity:**
   ```bash
   ping YOUR_IP
   ```
   Should show successful ping responses

3. **Port Accessibility:**
   ```bash
   telnet YOUR_IP 5001
   ```
   Should connect successfully

## Support

If you're still having issues:

1. Check the console logs in Expo Go
2. Check backend server logs
3. Try the network setup script: `npm run setup-network`
4. Use tunnel mode as fallback: `npx expo start --tunnel`

The app is designed to work with multiple network configurations automatically, but manual configuration may be needed in some environments.
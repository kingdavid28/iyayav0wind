# Facebook Authentication Troubleshooting Guide

## 🚨 Common Error: "Facebook authentication was cancelled or failed"

This error typically occurs due to configuration issues. Follow this step-by-step guide to resolve it.

## 🔍 Step 1: Verify Environment Variables

Check your `.env` file contains the correct Facebook credentials:

```bash
# Your current values:
EXPO_PUBLIC_FACEBOOK_APP_ID=1976692839796722
EXPO_PUBLIC_FACEBOOK_APP_SECRET=f165f5a83adb5ace87362335a24eefc4
```

**Verification Steps:**
1. Open your `.env` file
2. Confirm the App ID matches your Facebook Developer Console
3. Confirm the App Secret is correct (never share this publicly!)
4. Restart your Expo development server after changing `.env`

## 🔍 Step 2: Facebook Developer Console Configuration

### A. Check App Status
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Select your app: "iYaya Childcare App" (ID: 1976692839796722)
3. Ensure the app is **NOT in Development Mode** or add test users

### B. Verify Facebook Login Settings
1. Go to **Products** → **Facebook Login** → **Settings**
2. Check **Valid OAuth Redirect URIs** includes:
   ```
   https://iyayav0.firebaseapp.com/__/auth/handler
   exp://192.168.1.9:8081/--/
   iyaya-app://
   ```

### C. App Domains Configuration
1. Go to **Settings** → **Basic**
2. Add to **App Domains**:
   ```
   iyayav0.firebaseapp.com
   localhost
   192.168.1.9
   ```

## 🔍 Step 3: Firebase Configuration

### A. Enable Facebook Provider
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project → **Authentication** → **Sign-in method**
3. Click **Facebook** → **Enable**
4. Enter your Facebook App ID: `1976692839796722`
5. Enter your Facebook App Secret: `f165f5a83adb5ace87362335a24eefc4`
6. **Save** the configuration

### B. Copy OAuth Redirect URI
1. In Firebase, copy the **OAuth redirect URI**
2. Add it to Facebook Login settings (Step 2B above)

## 🔍 Step 4: Test with Debug Logs

The updated `facebookAuthService.js` now includes detailed logging. Check your console for:

```
🔵 Starting Facebook sign-in process...
🔧 Facebook App ID: 1976692839796722
🔧 User Role: parent
🔧 Auth request created: { clientId: ..., redirectUri: ..., scopes: [...] }
🔵 Prompting user for Facebook authentication...
🔧 Auth result: { type: "cancel", params: "none", error: undefined }
```

## 🔧 Step 5: Common Issues & Solutions

### Issue 1: "App ID is not configured"
**Solution:** Restart Expo development server after updating `.env`
```bash
# Stop current server (Ctrl+C)
npm start
# or
npx expo start
```

### Issue 2: "Invalid OAuth redirect URI"
**Solution:** Add all possible redirect URIs to Facebook:
```
https://iyayav0.firebaseapp.com/__/auth/handler
exp://192.168.1.9:8081/--/
iyaya-app://
http://localhost:8081/--/
```

### Issue 3: "App is in Development Mode"
**Solutions:**
- **Option A:** Add test users in Facebook Developer Console
- **Option B:** Switch app to Live mode (requires app review)
- **Option C:** Use your own Facebook account (you're automatically a test user)

### Issue 4: "Network Error"
**Solutions:**
- Check internet connection
- Verify Facebook services are not blocked
- Try on different network/device

### Issue 5: User cancels authentication
**Expected behavior:** User will see "Facebook sign-in was cancelled by user"

## 🧪 Step 6: Testing Checklist

### Before Testing:
- [ ] Environment variables set correctly
- [ ] Expo server restarted
- [ ] Facebook app configured
- [ ] Firebase provider enabled
- [ ] Test user added (if app in development mode)

### During Testing:
1. **Open app** → Go to Parent or Caregiver auth screen
2. **Tap "Continue with Facebook"**
3. **Check console logs** for detailed debug info
4. **Complete Facebook login** in the popup/browser
5. **Verify redirect** back to your app

### Expected Flow:
```
🔵 Starting Facebook sign-in process...
🔧 Facebook App ID: 1976692839796722
🔧 Auth request created: {...}
🔵 Prompting user for Facebook authentication...
[User completes Facebook login]
🔧 Auth result: { type: "success", params: {...} }
✅ Facebook auth successful, exchanging code for token...
✅ Access token obtained, fetching user profile...
✅ Facebook user profile: { id: "...", name: "...", email: "..." }
✅ Firebase sign-in successful
```

## 🔧 Step 7: Alternative Testing Method

If the OAuth flow continues to fail, try testing with a simpler approach:

1. **Test Facebook Graph API directly:**
   ```javascript
   // In browser console at developers.facebook.com
   fetch('https://graph.facebook.com/me?access_token=YOUR_ACCESS_TOKEN')
   ```

2. **Verify app permissions:**
   - Go to Facebook → Settings → Apps and Websites
   - Check if your app appears and has correct permissions

## 🆘 Step 8: Emergency Fallback

If Facebook auth still doesn't work, users can still:
1. **Use email/password registration** (existing functionality)
2. **Complete profile manually** after registration
3. **Link Facebook later** (can be implemented as future feature)

## 📞 Need Help?

### Debug Information to Collect:
1. **Console logs** from the authentication attempt
2. **Facebook App ID** being used
3. **Redirect URIs** configured in Facebook
4. **Firebase configuration** status
5. **Device/platform** being tested (iOS/Android/Web)

### Common Success Indicators:
- ✅ Facebook popup/browser opens
- ✅ User can log into Facebook
- ✅ Redirect back to app occurs
- ✅ User profile data is retrieved
- ✅ Firebase authentication succeeds

---

**Remember:** Facebook authentication requires proper configuration on both Facebook Developer Console and Firebase. Most issues stem from mismatched redirect URIs or incomplete setup.

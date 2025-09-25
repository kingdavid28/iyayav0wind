# Facebook Authentication Setup Guide

This guide will help you enable Facebook Sign-In for both Parent and Caregiver authentication in your Iyaya app.

## 📋 Prerequisites

- Facebook Developer Account
- Firebase Project with Authentication enabled
- Expo/React Native app configured

## 🔧 Step 1: Facebook Developer Console Setup

### A. Create Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **"Create App"** → Choose **"Consumer"** → **"Next"**
3. Enter app details:
   - **App Name**: "Iyaya Childcare App"
   - **App Contact Email**: Your email
   - **App Purpose**: "Provide a service to other businesses"

### B. Configure Facebook Login
1. In your Facebook app dashboard, go to **"Add Products"**
2. Find **"Facebook Login"** → Click **"Set Up"**
iYaya Childcare App
App ID
: 1976692839796722
Mode: In development
3. Choose **"Web"** platform
4. Add your site URL: `https://iyayav0.firebaseapp.com`

<script>
  window.fbAsyncInit = function() {
    FB.init({
      appId      : '1976692839796722',
      cookie     : true,
      xfbml      : true,
      version    : 'v18.0'
    });
      
    FB.AppEvents.logPageView();   
      
  };

  (function(d, s, id){
     var js, fjs = d.getElementsByTagName(s)[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement(s); js.id = id;
     js.src = "https://connect.facebook.net/en_US/sdk.js";
     fjs.parentNode.insertBefore(js, fjs);
   }(document, 'script', 'facebook-jssdk'));
</script>


FB.getLoginStatus(function(response) {
    statusChangeCallback(response);
});

{
    status: 'connected',
    authResponse: {
        accessToken: '...',
        expiresIn:'...',
        signedRequest:'...',
        userID:'...'
    }
}

<fb:login-button 
  scope="public_profile,email"
  onlogin="checkLoginState();">
</fb:login-button>

function checkLoginState() {
  FB.getLoginStatus(function(response) {
    statusChangeCallback(response);
  });
}

### C. Add OAuth Redirect URI
1. Go to **Facebook Login** → **Settings**
2. In **"Valid OAuth Redirect URIs"**, add:
   ```
   https://iyayav0.firebaseapp.com/__/auth/handler
   ```
3. Save changes

### D. Get App Credentials
1. Go to **Settings** → **Basic**
2. Copy your **App ID** and **App Secret**
1976692839796722: f165f5a83adb5ace87362335a24eefc4
3. Keep these secure - you'll need them for environment variables

## 🔥 Step 2: Firebase Configuration

### A. Enable Facebook Provider
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project → **Authentication** → **Sign-in method**
3. Click **Facebook** → **Enable**
4. Enter your Facebook **App ID** and **App Secret**
5. Copy the **OAuth redirect URI** provided by Firebase
6. Save the configuration

### B. Add Firebase OAuth URI to Facebook
1. Go back to Facebook Developer Console
2. **Facebook Login** → **Settings**
3. Add the Firebase OAuth redirect URI to **"Valid OAuth Redirect URIs"**

## 📱 Step 3: App Configuration

### A. Install Required Packages
```bash
npx expo install expo-auth-session expo-crypto
```

### B. Update Environment Variables
Add these to your `.env` file:
```env
# Facebook Authentication
EXPO_PUBLIC_FACEBOOK_APP_ID=1976692839796722
EXPO_PUBLIC_FACEBOOK_APP_SECRET=f165f5a83adb5ace87362335a24eefc4
```

### C. Update App Configuration
The `app.config.js` has been updated with the correct scheme:
```javascript
scheme: "iyaya-app"
```

## 🎯 Step 4: Implementation

### A. Facebook Auth Service
✅ **Created**: `src/services/facebookAuthService.js`
- Handles Facebook OAuth flow
- Integrates with Firebase Authentication
- Syncs user data with your backend

### B. Facebook Sign-In Button
✅ **Created**: `src/components/auth/FacebookSignInButton.js`
- Reusable component for both Parent and Caregiver auth
- Handles loading states and error handling
- Customizable styling

### C. Updated Auth Screens
✅ **ParentAuth.js**: Added Facebook sign-in option
✅ **CaregiverAuth.js**: Ready for Facebook integration

## 🔐 Step 5: Security Configuration

### A. App Domains (Facebook)
1. Go to **Settings** → **Basic**
2. Add your domains to **App Domains**:
   - `iyayav0.firebaseapp.com`
   - `localhost` (for development)

### B. Platform Configuration
1. Go to **Settings** → **Basic** → **Add Platform**
2. Choose **Website**
3. Add Site URL: `https://iyayav0.firebaseapp.com`

## 🚀 Step 6: Testing

### A. Development Testing
1. Start your Expo development server
2. Test Facebook login on both Parent and Caregiver screens
3. Verify user data is properly synced

### B. Production Testing
1. Build and deploy your app
2. Test the complete OAuth flow
3. Verify Firebase integration works

## 🔧 Step 7: Backend Integration

### A. User Model Updates
Ensure your backend user model supports:
```javascript
{
  authProvider: 'facebook',
  facebookId: String,
  profileImage: String, // From Facebook
  // ... other fields
}
```

### B. API Endpoint Updates
The `/api/auth/firebase-sync` endpoint should handle Facebook users:
- Accept `authProvider: 'facebook'`
- Store Facebook profile data
- Handle profile image URLs

## 📋 Step 8: Final Checklist

### Facebook App Settings
- [ ] App ID and App Secret configured
- [ ] OAuth redirect URIs added
- [ ] App domains configured
- [ ] Platform (Website) added

### Firebase Settings
- [ ] Facebook provider enabled
- [ ] App ID and App Secret added
- [ ] OAuth redirect URI copied to Facebook

### App Configuration
- [ ] Environment variables set
- [ ] App scheme configured
- [ ] Required packages installed

### Code Integration
- [ ] Facebook auth service implemented
- [ ] Sign-in buttons added to auth screens
- [ ] Error handling implemented
- [ ] Backend sync configured

## 🎉 Usage

### For Parents
```javascript
<FacebookSignInButton
  userRole="parent"
  onSuccess={(result) => {
    // Handle successful login
    console.log('Parent logged in:', result.user);
  }}
  onError={(error) => {
    // Handle error
    Alert.alert('Login Failed', error.message);
  }}
/>
```

### For Caregivers
```javascript
<FacebookSignInButton
  userRole="caregiver"
  onSuccess={(result) => {
    // Handle successful login
    console.log('Caregiver logged in:', result.user);
  }}
  onError={(error) => {
    // Handle error
    Alert.alert('Login Failed', error.message);
  }}
/>
```

## 🔍 Troubleshooting

### Common Issues

1. **"Invalid OAuth redirect URI"**
   - Verify the URI in Facebook matches Firebase exactly
   - Check for trailing slashes or typos

2. **"App not configured for Facebook Login"**
   - Ensure Facebook Login product is added and configured
   - Check that the app is not in development mode restrictions

3. **"Token exchange failed"**
   - Verify App Secret is correct
   - Check network connectivity

4. **"User data not syncing"**
   - Verify backend API endpoint is working
   - Check Firebase token validation

### Debug Tips

1. Enable verbose logging in development
2. Test with Facebook's Graph API Explorer
3. Verify Firebase Authentication logs
4. Check network requests in browser dev tools

## 📚 Additional Resources

- [Facebook Login for Apps](https://developers.facebook.com/docs/facebook-login/)
- [Firebase Facebook Auth](https://firebase.google.com/docs/auth/web/facebook-login)
- [Expo AuthSession](https://docs.expo.dev/guides/authentication/#facebook)

## 🔒 Security Best Practices

1. **Never expose App Secret** in client-side code
2. **Validate tokens** on your backend
3. **Use HTTPS** for all OAuth redirects
4. **Implement rate limiting** for auth endpoints
5. **Monitor for suspicious activity**

---

**Note**: Replace `your-facebook-app-id` and `your-facebook-app-secret` with your actual Facebook app credentials in your `.env` file.

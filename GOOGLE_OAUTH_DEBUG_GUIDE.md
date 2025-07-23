# 🔍 Google OAuth Debugging Guide

## 🚨 **Common Error: "Invalid audience" or "OAuth client ID mismatch"**

This error occurs when your backend's `GOOGLE_CLIENT_ID` doesn't match the client ID from your Android app.

## 📋 **Step-by-Step Debugging Process**

### **Step 1: Check Your Backend Configuration**

1. **Test the new configuration endpoint:**
   ```bash
   GET http://localhost:3000/api/user/check-google-config
   ```

2. **Expected Response:**
   ```json
   {
     "status": true,
     "message": "Configuration check completed",
     "data": {
       "googleClientId": {
         "exists": true,
         "length": 72,
         "preview": "123456789012345678901...",
         "endsWith": "Valid format"
       },
       "emailConfig": {
         "user": "Set",
         "password": "Set"
       },
       "environment": "development"
     }
   }
   ```

### **Step 2: Get Your Firebase OAuth Client ID**

1. **Go to Firebase Console:** https://console.firebase.google.com/
2. **Select your project:** "neuroheal-e3ab7"
3. **Go to Project Settings** (gear icon ⚙️)
4. **Scroll to "OAuth 2.0 Client IDs" section**
5. **Copy the Android client ID** (ends with `.apps.googleusercontent.com`)

### **Step 3: Update Your Backend Environment**

1. **Open your `.env` file**
2. **Update the Google Client ID:**
   ```env
   GOOGLE_CLIENT_ID=your_android_client_id_here.apps.googleusercontent.com
   ```
3. **Restart your backend server**

### **Step 4: Test with Postman**

#### **Test Configuration:**
```
GET http://localhost:3000/api/user/check-google-config
```

#### **Test Google Pre-Login:**
```
POST http://localhost:3000/api/user/google-pre-login
Content-Type: application/json

{
  "googleToken": "your_google_id_token_here"
}
```

#### **Test Google Login:**
```
POST http://localhost:3000/api/user/google-login
Content-Type: application/json

{
  "googleToken": "your_google_id_token_here"
}
```

## 🔧 **How to Get Google Token for Testing**

### **Method 1: Google OAuth Playground**
1. Go to: https://developers.google.com/oauthplayground/
2. Click the settings icon (⚙️)
3. Check "Use your own OAuth credentials"
4. Enter your OAuth client ID
5. Select "Google+ API v1" → "userinfo.email"
6. Click "Authorize APIs"
7. Click "Exchange authorization code for tokens"
8. Copy the "ID token"

### **Method 2: Flutter App (Real Testing)**
```dart
// In your Flutter app
final GoogleSignInAccount? googleUser = await GoogleSignIn().signIn();
final GoogleSignInAuthentication? googleAuth = await googleUser?.authentication;
final String? idToken = googleAuth?.idToken;

// Send this idToken to your backend
```

## 🐛 **Common Issues and Solutions**

### **Issue 1: "GOOGLE_CLIENT_ID not set"**
**Solution:**
```env
# Add to your .env file
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
```

### **Issue 2: "Invalid audience"**
**Solution:**
- Make sure you're using the **Android** client ID from Firebase
- Not the Web client ID
- Not the iOS client ID

### **Issue 3: "Wrong number of segments"**
**Solution:**
- The token is malformed
- Make sure you're sending the complete ID token
- Check if the token is being truncated

### **Issue 4: "Token used too late"**
**Solution:**
- The token has expired
- Get a fresh token from Google
- Tokens expire after 1 hour

## 📱 **Flutter Integration Check**

### **1. Check your `google-services.json`:**
```json
{
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "1:123456789012:android:abcdef1234567890",
        "android_client_info": {
          "package_name": "com.yourpackage.name"
        }
      },
      "oauth_client": [
        {
          "client_id": "123456789012-abcdefghijklmnop.apps.googleusercontent.com",
          "client_type": 3
        }
      ]
    }
  ]
}
```

### **2. Check your `pubspec.yaml`:**
```yaml
dependencies:
  google_sign_in: ^6.1.6
```

### **3. Check your Android configuration:**
```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<manifest ...>
  <uses-permission android:name="android.permission.INTERNET"/>
  <!-- ... -->
</manifest>
```

## 🔍 **Enhanced Debugging**

### **Backend Logs to Watch:**
```
🔍 Google Token received: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
🔍 Token length: 1234
🔍 Using Client ID: 123456789012-abcdefgh...
🔍 Google Payload: { sub: '123456789', email: 'user@gmail.com', ... }
✅ Google login successful for: user@gmail.com
```

### **Error Logs to Watch:**
```
❌ Google Token Verification Error: Invalid audience
❌ GOOGLE_CLIENT_ID not configured in environment
❌ Google Login Error: Wrong number of segments
```

## 🎯 **Quick Fix Checklist**

- [ ] ✅ Backend has correct `GOOGLE_CLIENT_ID` in `.env`
- [ ] ✅ Using Android client ID from Firebase
- [ ] ✅ Backend server restarted after `.env` changes
- [ ] ✅ Flutter app has correct `google-services.json`
- [ ] ✅ Testing with fresh Google token
- [ ] ✅ Checked configuration endpoint response

## 📞 **Still Having Issues?**

1. **Run the configuration check:**
   ```bash
   GET /api/user/check-google-config
   ```

2. **Check your backend logs for detailed error messages**

3. **Verify your Firebase project settings match your app**

4. **Make sure you're using the correct client ID type (Android vs Web)**

## 🔗 **Useful Links**

- [Firebase Console](https://console.firebase.google.com/)
- [Google OAuth Playground](https://developers.google.com/oauthplayground/)
- [Google Sign-In Flutter Plugin](https://pub.dev/packages/google_sign_in)
- [Google Auth Library Documentation](https://github.com/googleapis/google-auth-library-nodejs) 
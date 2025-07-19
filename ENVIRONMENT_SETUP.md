# 🔧 Environment Setup Guide

## 📋 **Required Environment Variables**

Add these to your `.env` file for production:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/your_database_name

# JWT Configuration
JWT_SECRET=your_very_secure_jwt_secret_key_here
JWT_REFRESH_SECRET=your_very_secure_jwt_refresh_secret_key_here

# Email Configuration (REQUIRED for password reset)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password_here

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=https://yourdomain.com/google-callback

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# Server Configuration
PORT=3001
NODE_ENV=production
```

## 📧 **Email Setup (Gmail) - REQUIRED**

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account Settings
2. Security → 2-Step Verification → Turn it ON

### Step 2: Generate App Password
1. Go to Google Account Settings
2. Security → 2-Step Verification → App passwords
3. Select "Mail" and "Other (Custom name)"
4. Name it "NeuroHeal Backend"
5. Copy the generated 16-character password

### Step 3: Add to Environment
```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_16_character_app_password
```

## 🔑 **Google OAuth Setup**

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API

### Step 2: Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - `https://yourdomain.com/google-callback` (production)
   - `http://localhost:3001/google-callback` (development)

### Step 3: Get Credentials
- Copy Client ID and Client Secret
- Add to your `.env` file

## 🚀 **Production Deployment Checklist**

### ✅ Environment Variables
- [ ] All environment variables set
- [ ] Email credentials configured
- [ ] Google OAuth credentials configured
- [ ] JWT secrets are secure and unique

### ✅ Security
- [ ] HTTPS enabled
- [ ] Strong JWT secrets
- [ ] Email service working
- [ ] Rate limiting implemented

### ✅ Testing
- [ ] Password reset flow tested
- [ ] Google OAuth flow tested
- [ ] All endpoints working

## 📱 **Flutter Frontend Integration**

### Password Reset Flow
```dart
// Request password reset
Future<void> forgotPassword(String email) async {
  try {
    final response = await http.post(
      Uri.parse('$baseUrl/forgot-password'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email}),
    );
    
    final data = jsonDecode(response.body);
    
    if (data['status'] == true) {
      // Show success message
      showSuccessDialog('Password reset email sent!');
    } else {
      // Show error message
      showErrorDialog(data['message']);
    }
  } catch (e) {
    showErrorDialog('Network error. Please try again.');
  }
}
```

### Google OAuth Flow
```dart
// Google Sign-In
Future<void> googleSignIn() async {
  try {
    final GoogleSignInAccount? googleUser = await GoogleSignIn().signIn();
    
    if (googleUser != null) {
      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      
      final response = await http.post(
        Uri.parse('$baseUrl/google-login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'googleToken': googleAuth.idToken}),
      );
      
      final data = jsonDecode(response.body);
      
      if (data['status'] == true) {
        // Store tokens and navigate
        await saveTokens(data['data']['accessToken'], data['data']['refreshToken']);
        Navigator.pushReplacementNamed(context, '/dashboard');
      }
    }
  } catch (e) {
    showErrorDialog('Google sign-in failed. Please try again.');
  }
}
```

## 🧪 **Testing in Postman**

### 1. Forgot Password
```
POST http://localhost:3001/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### 2. Verify Reset Token
```
GET http://localhost:3001/verify-reset-token/{token}
```

### 3. Reset Password
```
POST http://localhost:3001/reset-password
Content-Type: application/json

{
  "token": "reset_token_here",
  "newPassword": "newPassword123"
}
```

### 4. Google Login
```
POST http://localhost:3001/google-login
Content-Type: application/json

{
  "googleToken": "google_id_token_here"
}
```

## 🚨 **Important Notes**

1. **Email is REQUIRED** for password reset functionality
2. **Never expose tokens** in production responses
3. **Use HTTPS** in production
4. **Test thoroughly** before deployment
5. **Monitor logs** for any issues

## 📞 **Support**

If you encounter issues:
1. Check environment variables are set correctly
2. Verify email service configuration
3. Test Google OAuth credentials
4. Check server logs for detailed errors 
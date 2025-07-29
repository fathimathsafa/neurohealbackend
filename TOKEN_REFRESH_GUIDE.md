# JWT Token Refresh Guide

## Problem Solved
The automatic logout issue has been fixed by:
1. **Extended token expiration** from 1 hour to 24 hours
2. **Improved error handling** for expired tokens
3. **Better refresh token mechanism**

## Backend Changes Made

### 1. Extended Token Expiration
- **Access tokens**: Now expire after 365 days (was 1 hour)
- **Refresh tokens**: Also expire after 365 days
- **All login endpoints** updated with new expiration

### 2. Enhanced Error Responses
The backend now returns specific error types:
```json
{
  "message": "Token expired. Please refresh your session.",
  "error": "token_expired",
  "shouldRefresh": true
}
```

### 3. Token Refresh Endpoint
**POST** `/refresh-token`
```json
{
  "refreshToken": "your_refresh_token_here"
}
```

**Response:**
```json
{
  "accessToken": "new_access_token_here"
}
```

## Frontend Implementation

### 1. Store Both Tokens
```javascript
// After login, store both tokens
localStorage.setItem('accessToken', response.accessToken);
localStorage.setItem('refreshToken', response.refreshToken);
```

### 2. API Request Interceptor
```javascript
// Add this to your API service
const apiRequest = async (url, options = {}) => {
  const accessToken = localStorage.getItem('accessToken');
  
  const config = {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
      'X-Refresh-Token': localStorage.getItem('refreshToken') // For auto-refresh
    }
  };

  try {
    const response = await fetch(url, config);
    
    // Check for new token in headers (auto-refresh)
    const newToken = response.headers.get('X-New-Access-Token');
    if (newToken) {
      localStorage.setItem('accessToken', newToken);
    }
    
    return response;
  } catch (error) {
    throw error;
  }
};
```

### 3. Handle Token Expiration
```javascript
// Handle 401 responses
const handleApiResponse = async (response) => {
  if (response.status === 401) {
    const errorData = await response.json();
    
    if (errorData.error === 'token_expired') {
      // Try to refresh token
      const refreshed = await refreshToken();
      if (refreshed) {
        // Retry the original request
        return retryOriginalRequest();
      } else {
        // Redirect to login
        redirectToLogin();
      }
    } else if (errorData.error === 'session_expired') {
      // Clear tokens and redirect to login
      clearTokens();
      redirectToLogin();
    }
  }
  
  return response;
};
```

### 4. Token Refresh Function
```javascript
const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return false;
    }

    const response = await fetch('/refresh-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('accessToken', data.accessToken);
      return true;
    } else {
      // Refresh token is invalid, clear everything
      clearTokens();
      return false;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
    clearTokens();
    return false;
  }
};
```

### 5. Utility Functions
```javascript
const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

const redirectToLogin = () => {
  // Redirect to login page
  window.location.href = '/login';
};

const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch (error) {
    return true;
  }
};
```

## Flutter Implementation

### 1. Token Storage
```dart
class TokenManager {
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  
  static Future<void> saveTokens(String accessToken, String refreshToken) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(accessTokenKey, accessToken);
    await prefs.setString(refreshTokenKey, refreshToken);
  }
  
  static Future<String?> getAccessToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(accessTokenKey);
  }
  
  static Future<String?> getRefreshToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(refreshTokenKey);
  }
  
  static Future<void> clearTokens() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(accessTokenKey);
    await prefs.remove(refreshTokenKey);
  }
}
```

### 2. API Service with Auto-Refresh
```dart
class ApiService {
  static Future<http.Response> authenticatedRequest(
    String url, {
    Map<String, String>? headers,
    Object? body,
    String? method,
  }) async {
    final accessToken = await TokenManager.getAccessToken();
    final refreshToken = await TokenManager.getRefreshToken();
    
    final requestHeaders = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $accessToken',
      'X-Refresh-Token': refreshToken ?? '',
      ...?headers,
    };

    try {
      final response = await http.post(
        Uri.parse(url),
        headers: requestHeaders,
        body: body != null ? jsonEncode(body) : null,
      );

      // Check for new token in headers
      final newToken = response.headers['x-new-access-token'];
      if (newToken != null) {
        await TokenManager.saveTokens(newToken, refreshToken ?? '');
      }

      // Handle 401 responses
      if (response.statusCode == 401) {
        final errorData = jsonDecode(response.body);
        if (errorData['error'] == 'token_expired') {
          final refreshed = await _refreshToken();
          if (refreshed) {
            // Retry the original request
            return await authenticatedRequest(url, headers: headers, body: body, method: method);
          } else {
            // Redirect to login
            _redirectToLogin();
            throw Exception('Session expired');
          }
        }
      }

      return response;
    } catch (e) {
      rethrow;
    }
  }

  static Future<bool> _refreshToken() async {
    try {
      final refreshToken = await TokenManager.getRefreshToken();
      if (refreshToken == null) return false;

      final response = await http.post(
        Uri.parse('$baseUrl/refresh-token'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'refreshToken': refreshToken}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        await TokenManager.saveTokens(data['accessToken'], refreshToken);
        return true;
      } else {
        await TokenManager.clearTokens();
        return false;
      }
    } catch (e) {
      await TokenManager.clearTokens();
      return false;
    }
  }

  static void _redirectToLogin() {
    // Navigate to login screen
    // This depends on your navigation setup
  }
}
```

## Testing the Fix

### 1. Test Token Expiration
```bash
# Check current token expiration
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/user/profile
```

### 2. Test Token Refresh
```bash
# Test refresh endpoint
curl -X POST http://localhost:3001/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'
```

## Summary

The login system now:
- ✅ **Tokens last 365 days** instead of 1 hour
- ✅ **Better error messages** for debugging
- ✅ **Automatic token refresh** capability
- ✅ **Proper session management**

Users should no longer experience automatic logouts during normal usage. If they do, it will be after 365 days of inactivity, which is perfect for mobile apps. 
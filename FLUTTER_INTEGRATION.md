# 📱 Flutter Integration Guide

## 🔐 **Seamless Password Reset Implementation**

### **Backend Response Types**

#### **1. Production Mode (Email Service Configured)**
```json
{
  "status": true,
  "message": "If an account with this email exists, a password reset link has been sent."
}
```

#### **2. Development Mode (Email Service Not Configured)**
```json
{
  "status": true,
  "message": "Password reset token generated successfully",
  "email": "user@example.com",
  "resetToken": "abc123def456ghi789",
  "resetUrl": "http://localhost:3001/reset-password/abc123def456ghi789",
  "isDevelopment": true
}
```

#### **3. Email Send Failed (Development)**
```json
{
  "status": true,
  "message": "Password reset token generated (email failed)",
  "email": "user@example.com",
  "resetToken": "abc123def456ghi789",
  "resetUrl": "http://localhost:3001/reset-password/abc123def456ghi789",
  "isDevelopment": true,
  "emailError": "Invalid credentials"
}
```

## 🚀 **Flutter Implementation**

### **1. Forgot Password Service**

```dart
class AuthService {
  static const String baseUrl = 'http://localhost:3001'; // Change for production
  
  // Request password reset
  static Future<Map<String, dynamic>> forgotPassword(String email) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/forgot-password'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email}),
      );
      
      final data = jsonDecode(response.body);
      
      if (data['status'] == true) {
        // Check if it's development mode with token
        if (data['isDevelopment'] == true && data['resetToken'] != null) {
          // Auto-fill token for seamless development experience
          return {
            'success': true,
            'message': data['message'],
            'isDevelopment': true,
            'resetToken': data['resetToken'],
            'email': data['email'],
            'resetUrl': data['resetUrl'],
          };
        } else {
          // Production mode - email sent
          return {
            'success': true,
            'message': data['message'],
            'isDevelopment': false,
          };
        }
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Something went wrong',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Network error. Please try again.',
      };
    }
  }
  
  // Reset password with token
  static Future<Map<String, dynamic>> resetPassword(String token, String newPassword) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/reset-password'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'token': token,
          'newPassword': newPassword,
        }),
      );
      
      final data = jsonDecode(response.body);
      
      return {
        'success': data['status'] == true,
        'message': data['message'] ?? 'Something went wrong',
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'Network error. Please try again.',
      };
    }
  }
}
```

### **2. Forgot Password Screen**

```dart
class ForgotPasswordScreen extends StatefulWidget {
  @override
  _ForgotPasswordScreenState createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;
  String? _resetToken;
  String? _userEmail;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Forgot Password')),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              TextFormField(
                controller: _emailController,
                decoration: InputDecoration(
                  labelText: 'Email Address',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value?.isEmpty ?? true) {
                    return 'Please enter your email';
                  }
                  if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value!)) {
                    return 'Please enter a valid email';
                  }
                  return null;
                },
              ),
              SizedBox(height: 16),
              ElevatedButton(
                onPressed: _isLoading ? null : _requestPasswordReset,
                child: _isLoading 
                  ? CircularProgressIndicator(color: Colors.white)
                  : Text('Send Reset Link'),
              ),
              if (_resetToken != null) ...[
                SizedBox(height: 24),
                _buildDevelopmentTokenSection(),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDevelopmentTokenSection() {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        border: Border.all(color: Colors.blue.shade200),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '🔧 Development Mode',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: Colors.blue.shade700,
            ),
          ),
          SizedBox(height: 8),
          Text(
            'Email service not configured. Use this token to test:',
            style: TextStyle(color: Colors.blue.shade600),
          ),
          SizedBox(height: 8),
          Container(
            padding: EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(4),
            ),
            child: SelectableText(
              _resetToken!,
              style: TextStyle(fontFamily: 'monospace'),
            ),
          ),
          SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => _navigateToResetPassword(),
            child: Text('Continue to Reset Password'),
          ),
        ],
      ),
    );
  }

  Future<void> _requestPasswordReset() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final result = await AuthService.forgotPassword(_emailController.text);

      if (result['success']) {
        if (result['isDevelopment'] == true) {
          // Development mode - show token
          setState(() {
            _resetToken = result['resetToken'];
            _userEmail = result['email'];
          });
          
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Development mode: Token generated successfully'),
              backgroundColor: Colors.blue,
            ),
          );
        } else {
          // Production mode - email sent
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['message']),
              backgroundColor: Colors.green,
            ),
          );
          
          // Navigate back or show success screen
          Navigator.pop(context);
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message']),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _navigateToResetPassword() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ResetPasswordScreen(
          token: _resetToken!,
          email: _userEmail!,
        ),
      ),
    );
  }
}
```

### **3. Reset Password Screen**

```dart
class ResetPasswordScreen extends StatefulWidget {
  final String token;
  final String email;

  ResetPasswordScreen({required this.token, required this.email});

  @override
  _ResetPasswordScreenState createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Reset Password')),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              Text(
                'Reset password for: ${widget.email}',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 24),
              TextFormField(
                controller: _passwordController,
                decoration: InputDecoration(
                  labelText: 'New Password',
                  border: OutlineInputBorder(),
                ),
                obscureText: true,
                validator: (value) {
                  if (value?.isEmpty ?? true) {
                    return 'Please enter a password';
                  }
                  if (value!.length < 6) {
                    return 'Password must be at least 6 characters';
                  }
                  return null;
                },
              ),
              SizedBox(height: 16),
              TextFormField(
                controller: _confirmPasswordController,
                decoration: InputDecoration(
                  labelText: 'Confirm Password',
                  border: OutlineInputBorder(),
                ),
                obscureText: true,
                validator: (value) {
                  if (value != _passwordController.text) {
                    return 'Passwords do not match';
                  }
                  return null;
                },
              ),
              SizedBox(height: 24),
              ElevatedButton(
                onPressed: _isLoading ? null : _resetPassword,
                child: _isLoading 
                  ? CircularProgressIndicator(color: Colors.white)
                  : Text('Reset Password'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _resetPassword() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final result = await AuthService.resetPassword(
        widget.token,
        _passwordController.text,
      );

      if (result['success']) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Password reset successfully!'),
            backgroundColor: Colors.green,
          ),
        );
        
        // Navigate to login screen
        Navigator.pushNamedAndRemoveUntil(
          context,
          '/login',
          (route) => false,
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message']),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }
}
```

## 🎯 **User Experience Flow**

### **Development Mode:**
1. **User enters email** → Clicks "Send Reset Link"
2. **Backend returns token** → Flutter shows development section
3. **User clicks "Continue"** → Goes to reset password screen
4. **User enters new password** → Password is reset
5. **User navigates to login** → Can login with new password

### **Production Mode:**
1. **User enters email** → Clicks "Send Reset Link"
2. **Backend sends email** → Flutter shows success message
3. **User checks email** → Clicks reset link
4. **User enters new password** → Password is reset
5. **User navigates to login** → Can login with new password

## 🔧 **Environment Configuration**

### **Development (.env)**
```env
NODE_ENV=development
# Email credentials not set (will return tokens)
```

### **Production (.env)**
```env
NODE_ENV=production
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

This implementation provides a **seamless development experience** while maintaining **production security**! 🚀 
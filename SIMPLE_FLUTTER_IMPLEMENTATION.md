# 📱 Simple Flutter Implementation

## 🔐 **Simple Password Reset Flow**

### **Step 1: Enter Email → Get Reset Code**
### **Step 2: Enter Reset Code + New Password**

## 🚀 **Flutter Implementation**

### **1. Simple Auth Service**

```dart
class SimpleAuthService {
  static const String baseUrl = 'http://localhost:3001';
  
  // Step 1: Request reset code
  static Future<Map<String, dynamic>> requestResetCode(String email) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/forgot-password'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email}),
      );
      
      final data = jsonDecode(response.body);
      
      return {
        'success': data['status'] == true,
        'message': data['message'],
        'resetCode': data['resetCode'],
        'email': data['email'],
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'Network error. Please try again.',
      };
    }
  }
  
  // Step 2: Reset password with code
  static Future<Map<String, dynamic>> resetPassword(String resetCode, String newPassword) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/reset-password'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'resetCode': resetCode,
          'newPassword': newPassword,
        }),
      );
      
      final data = jsonDecode(response.body);
      
      return {
        'success': data['status'] == true,
        'message': data['message'],
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

### **2. Simple Forgot Password Screen**

```dart
class SimpleForgotPasswordScreen extends StatefulWidget {
  @override
  _SimpleForgotPasswordScreenState createState() => _SimpleForgotPasswordScreenState();
}

class _SimpleForgotPasswordScreenState extends State<SimpleForgotPasswordScreen> {
  final _emailController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;
  String? _resetCode;
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
              Text(
                'Enter your email to reset password',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 24),
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
                  return null;
                },
              ),
              SizedBox(height: 16),
              ElevatedButton(
                onPressed: _isLoading ? null : _requestResetCode,
                child: _isLoading 
                  ? CircularProgressIndicator(color: Colors.white)
                  : Text('Get Reset Code'),
              ),
              if (_resetCode != null) ...[
                SizedBox(height: 24),
                _buildResetCodeSection(),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildResetCodeSection() {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.green.shade50,
        border: Border.all(color: Colors.green.shade200),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '✅ Reset Code Generated',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: Colors.green.shade700,
            ),
          ),
          SizedBox(height: 8),
          Text(
            'Your reset code:',
            style: TextStyle(color: Colors.green.shade600),
          ),
          SizedBox(height: 8),
          Container(
            padding: EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.green.shade100,
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              _resetCode!,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                fontFamily: 'monospace',
                color: Colors.green.shade800,
              ),
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

  Future<void> _requestResetCode() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final result = await SimpleAuthService.requestResetCode(_emailController.text);

      if (result['success']) {
        setState(() {
          _resetCode = result['resetCode'];
          _userEmail = result['email'];
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Reset code generated successfully!'),
            backgroundColor: Colors.green,
          ),
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

  void _navigateToResetPassword() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => SimpleResetPasswordScreen(
          resetCode: _resetCode!,
          email: _userEmail!,
        ),
      ),
    );
  }
}
```

### **3. Simple Reset Password Screen**

```dart
class SimpleResetPasswordScreen extends StatefulWidget {
  final String resetCode;
  final String email;

  SimpleResetPasswordScreen({required this.resetCode, required this.email});

  @override
  _SimpleResetPasswordScreenState createState() => _SimpleResetPasswordScreenState();
}

class _SimpleResetPasswordScreenState extends State<SimpleResetPasswordScreen> {
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
              SizedBox(height: 8),
              Container(
                padding: EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  'Reset Code: ${widget.resetCode}',
                  style: TextStyle(fontFamily: 'monospace'),
                ),
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
      final result = await SimpleAuthService.resetPassword(
        widget.resetCode,
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

## 🎯 **Simple User Flow**

### **Step 1: Enter Email**
1. User enters email address
2. Clicks "Get Reset Code"
3. Backend generates 6-digit code
4. Flutter shows the code on screen

### **Step 2: Reset Password**
1. User sees the reset code
2. Clicks "Continue to Reset Password"
3. User enters new password
4. Clicks "Reset Password"
5. Password is updated
6. User navigates to login

## 🧪 **Testing in Postman**

### **Step 1: Request Reset Code**
```bash
POST http://localhost:3001/forgot-password
Content-Type: application/json

{
  "email": "safahaneefa01@gmail.com"
}
```

**Response:**
```json
{
  "status": true,
  "message": "Reset code generated successfully",
  "email": "safahaneefa01@gmail.com",
  "resetCode": "123456",
  "canProceed": true
}
```

### **Step 2: Reset Password**
```bash
POST http://localhost:3001/reset-password
Content-Type: application/json

{
  "resetCode": "123456",
  "newPassword": "newPassword123"
}
```

**Response:**
```json
{
  "status": true,
  "message": "Password reset successfully"
}
```

## ✅ **Benefits**

- ✅ **Super simple** - No email setup needed
- ✅ **Direct flow** - Email → Code → New Password
- ✅ **No complications** - Works immediately
- ✅ **User-friendly** - Clear step-by-step process
- ✅ **Easy to test** - Code appears on screen

This is the **simplest possible implementation**! 🚀 
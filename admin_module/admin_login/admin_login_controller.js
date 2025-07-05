const jwt = require("jsonwebtoken");

const { ADMIN_USERNAME, ADMIN_PASSWORD } = require("./admin_login_model");

exports.adminLogin = (req, res) => {
  const { username, password } = req.body;
  console.log("Admin Login Attempt:", { username, password });
  

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, {
    expiresIn: "12h",
  });

  res.status(200).json({ token });
};

// ✅ Admin Logout
exports.adminLogout = (req, res) => {
  try {
    // For admin logout, since we don't store admin tokens in database,
    // we just return success. The client should remove the token.
    res.status(200).json({ 
      message: "Admin logout successful",
      success: true 
    });
  } catch (err) {
    console.error('Admin Logout Error:', err);
    res.status(500).json({ message: "Server error during logout" });
  }
};

// ✅ Check admin auth status
exports.checkAdminAuthStatus = (req, res) => {
  try {
    const adminId = req.admin?.id;
    
    if (!adminId) {
      return res.status(401).json({ 
        isAuthenticated: false,
        message: "Admin not authenticated" 
      });
    }

    res.status(200).json({
      isAuthenticated: true,
      admin: {
        role: "admin"
      }
    });

  } catch (err) {
    console.error('Check Admin Auth Status Error:', err);
    res.status(500).json({ message: "Server error checking auth status" });
  }
};

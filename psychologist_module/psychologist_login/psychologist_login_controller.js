const jwt = require('jsonwebtoken');
const Psychologist = require('../../admin_module/psychologist_adding/psychologist_adding_model');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

exports.psychologistLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // ✅ 1. Validate input
    if (!username || !password) {
      return res.status(400).json({ status: false, message: "Username and password are required" });
    }

    // ✅ 2. Check if psychologist exists
    const psychologist = await Psychologist.findOne({ username });

    if (!psychologist) {
      return res.status(404).json({ status: false, message: "Psychologist not found" });
    }

    // ✅ 3. Match password
    if (psychologist.password !== password) {
      return res.status(401).json({ status: false, message: "Incorrect password" });
    }

    // ✅ 4. Update login timestamp
    psychologist.lastLoginAt = new Date();
    psychologist.isActive = true;
    await psychologist.save();

    // ✅ 5. Create JWT token
    const token = jwt.sign(
      { id: psychologist._id, username: psychologist.username, role: "psychologist" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // ✅ 6. Send response
    res.status(200).json({
      status: true,
      message: "Login successful",
      token,
      psychologist: {
        id: psychologist._id,
        name: psychologist.name,
        specialization: psychologist.specialization,
        email: psychologist.email,
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, message: "Login failed" });
  }
};

// ✅ Psychologist Logout
exports.psychologistLogout = async (req, res) => {
  try {
    const psychologistId = req.psychologist?.id;
    
    if (!psychologistId) {
      return res.status(401).json({ 
        status: false, 
        message: "Psychologist not authenticated" 
      });
    }

    // For JWT-based logout, we can't invalidate the token server-side
    // But we can track logout time and update status
    await Psychologist.findByIdAndUpdate(psychologistId, {
      lastLogoutAt: new Date(),
      isActive: false
    });

    res.status(200).json({
      status: true,
      message: "Logout successful"
    });

  } catch (err) {
    console.error('Psychologist Logout Error:', err);
    res.status(500).json({ 
      status: false, 
      message: "Server error during logout" 
    });
  }
};

// ✅ Check psychologist auth status
exports.checkPsychologistAuthStatus = async (req, res) => {
  try {
    const psychologistId = req.psychologist?.id;
    
    if (!psychologistId) {
      return res.status(401).json({ 
        status: false,
        isAuthenticated: false,
        message: "Psychologist not authenticated" 
      });
    }

    const psychologist = await Psychologist.findById(psychologistId)
      .select('-password');
    
    if (!psychologist) {
      return res.status(401).json({ 
        status: false,
        isAuthenticated: false,
        message: "Psychologist not found" 
      });
    }

    res.status(200).json({
      status: true,
      isAuthenticated: true,
      psychologist: {
        id: psychologist._id,
        name: psychologist.name,
        specialization: psychologist.specialization,
        email: psychologist.email,
        username: psychologist.username
      }
    });

  } catch (err) {
    console.error('Check Psychologist Auth Status Error:', err);
    res.status(500).json({ 
      status: false, 
      message: "Server error checking auth status" 
    });
  }
};

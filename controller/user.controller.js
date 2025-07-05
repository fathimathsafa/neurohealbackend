const UserModel = require('../model/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();
const Psychologist = require('../admin_module/psychologist_adding/psychologist_adding_model');

const JWT_SECRET = process.env.JWT_SECRET;

const REFRESH_SECRET = process.env.REFRESH_SECRET;

const otpStore = {}; // In-memory store for OTPs

// ✅ Nodemailer config
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ Step 1: Pre-register (send OTP)
exports.preRegister = async (req, res) => {
  const { fullName, email, phone, password, confirmPassword } = req.body;

  if (!fullName || !email || !phone || !password || !confirmPassword)
    return res.status(400).json({ message: "All fields are required" });

  if (!email.includes('@'))
    return res.status(400).json({ message: "Invalid email format" });

  if (!/^\d{10}$/.test(phone))
    return res.status(400).json({ message: "Phone must be 10 digits" });

  if (password !== confirmPassword)
    return res.status(400).json({ message: "Passwords do not match" });

  try {
    const user = await UserModel.findOne({ email });
    if (user && user.password)
      return res.status(400).json({ message: "User already registered" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 5 * 60 * 1000;

    otpStore[email] = {
      otp,
      otpExpires,
      userData: { fullName, email, phone, password }
    };

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP Code',
      html: `<h3>Your OTP is: ${otp}</h3><p>Expires in 5 minutes.</p>`
    });

    res.status(200).json({ message: "OTP sent to email" });
  } catch (err) {
    console.error('PreRegister Error:', err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Step 2: Register with OTP
exports.register = async (req, res) => {
  const { email, otp } = req.body;
  const otpEntry = otpStore[email];

  if (!otpEntry)
    return res.status(400).json({ message: "No OTP sent to this email" });

  if (otpEntry.otp !== otp)
    return res.status(400).json({ message: "Invalid OTP" });

  if (Date.now() > otpEntry.otpExpires) {
    delete otpStore[email];
    return res.status(400).json({ message: "OTP expired" });
  }

  try {
    const existingUser = await UserModel.findOne({ email });
    if (existingUser && existingUser.password)
      return res.status(400).json({ message: "User already registered" });

    const { fullName, phone, password } = otpEntry.userData;
    const hashedPassword = await bcrypt.hash(password, 10); // ✅ hash

      const newUser = new UserModel({
      fullName,
      email,
      phone,
      password, // plain password; will be hashed in model
      loginMethod: 'password'
    });
    await newUser.save();
    delete otpStore[email];

    const token = jwt.sign({ id: newUser._id, email: newUser.email }, JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        email: newUser.email,
        fullName: newUser.fullName
      }
    });
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  // … your existing null checks …

  try {
    const user = await UserModel.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });

    // 1️⃣ Create Access Token
    const accessToken = jwt.sign(
      { id: user._id, email: user.email, role: 'user' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 2️⃣ Create Refresh Token
    const refreshToken = jwt.sign(
      { id: user._id, role: 'user' },
      REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // 3️⃣ Save refreshToken on user record and update login timestamp
    user.refreshToken = refreshToken;
    user.lastLoginAt = new Date();
    user.isActive = true;
    await user.save();

    // 4️⃣ Send both tokens back
    return res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user: { email: user.email, fullName: user.fullName }
    });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};


exports.loginDoctor = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ message: "Doctor username and password required" });

  try {
    // ✅ Check for psychologist by username
    const doctor = await Psychologist.findOne({ username, password });

    if (!doctor) {
      return res.status(401).json({ message: "Invalid doctor credentials" });
    }

    // ✅ Issue token
    const token = jwt.sign(
      { role: 'doctor', username: doctor.username, id: doctor._id },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.status(200).json({
      message: "Doctor login successful",
      token,
      doctor: {
        id: doctor._id,
        username: doctor.username,
        email: doctor.email,
        name: doctor.name
      }
    });
  } catch (err) {
    console.error("Doctor login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ✅ User Logout - Invalidates refresh token
exports.logout = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Clear refresh token from database
    await UserModel.findByIdAndUpdate(userId, {
      refreshToken: null,
      refreshTokenExpires: null
    });

    res.status(200).json({ 
      message: "Logout successful",
      success: true 
    });
  } catch (err) {
    console.error('Logout Error:', err);
    res.status(500).json({ message: "Server error during logout" });
  }
};

// ✅ Logout from all devices (invalidates all tokens)
exports.logoutAllDevices = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Clear refresh token and add a logout timestamp
    await UserModel.findByIdAndUpdate(userId, {
      refreshToken: null,
      refreshTokenExpires: null,
      lastLogoutAt: new Date()
    });

    res.status(200).json({ 
      message: "Logged out from all devices successfully",
      success: true 
    });
  } catch (err) {
    console.error('Logout All Devices Error:', err);
    res.status(500).json({ message: "Server error during logout" });
  }
};

// ✅ Check if user is logged in
exports.checkAuthStatus = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ 
        isAuthenticated: false,
        message: "User not authenticated" 
      });
    }

    const user = await UserModel.findById(userId).select('-password -refreshToken');
    
    if (!user) {
      return res.status(401).json({ 
        isAuthenticated: false,
        message: "User not found" 
      });
    }

    res.status(200).json({
      isAuthenticated: true,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        loginMethod: user.loginMethod
      }
    });
  } catch (err) {
    console.error('Check Auth Status Error:', err);
    res.status(500).json({ message: "Server error checking auth status" });
  }
};
// models/userModel.js
const mongoose = require('../config/db');
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  fullName: { type: String, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: { type: String, trim: true },
  // New registration fields
  state: { 
    type: String, 
    trim: true,
    required: true 
  },
  gender: { 
    type: String, 
    trim: true,
    required: true 
  },
  age: { 
    type: Number, 
    min: 13, 
    max: 120,
    required: true 
  },
  password: { type: String },
  otp: { type: String },
  otpExpires: { type: Date },
  // Password reset fields
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  // Login method
  loginMethod: {
    type: String,
    enum: ['password', 'otp'],
    default: 'password'
  },
  refreshToken: {
    type: String,
    required: false,    // will be set at login
  },
  // Optionally track expiry separate from JWT
  refreshTokenExpires: {
    type: Date,
    required: false,
  },
  // Track if user has completed questionnaire and booking
  isFirstTimeUser: {
    type: Boolean,
    default: true
  },
  hasCompletedQuestionnaire: {
    type: Boolean,
    default: false
  },
  hasHadAutomaticBooking: {
    type: Boolean,
    default: false
  },
  preferredState: {
    type: String,
    default: null
  },
  preferredSpecialization: {
    type: String,
    enum: ['Counseling', 'Child Psychology', 'Couples Therapy', 'Family Therapy'],
    default: null
  },
  // Logout tracking fields
  lastLogoutAt: {
    type: Date,
    default: null
  },
  lastLoginAt: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Premium user status
  isPremium: {
    type: Boolean,
    default: false
  },
  // Profile image URL
  profileImage: {
    type: String,
    default: null
  },
  // Who recommended this app
  recommendedBy: {
    type: String,
    enum: ['Friend', 'Family', 'Doctor', 'Social Media', 'Search Engine', 'Advertisement', 'Other'],
    default: null
  }
}, { timestamps: true });

// Hash password only if it's modified
userSchema.pre('save', async function (next) {
  const user = this;
  if (!user.isModified('password') || !user.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('User', userSchema);

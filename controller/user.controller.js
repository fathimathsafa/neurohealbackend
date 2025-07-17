const UserModel = require('../model/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();
const Psychologist = require('../admin_module/psychologist_adding/psychologist_adding_model');
const BookingModel = require('../user_module/psychologist_booking/psychologist_booking_model');

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
  const { fullName, email, phone, password, confirmPassword, state, gender, age } = req.body;

  if (!fullName || !email || !phone || !password || !confirmPassword || !state || !gender || !age)
    return res.status(400).json({ message: "All fields are required" });

  if (!email.includes('@'))
    return res.status(400).json({ message: "Invalid email format" });

  if (!/^\d{10}$/.test(phone))
    return res.status(400).json({ message: "Phone must be 10 digits" });

  if (password !== confirmPassword)
    return res.status(400).json({ message: "Passwords do not match" });

  // Validate age
  const ageNum = parseInt(age);
  if (isNaN(ageNum) || ageNum < 13 || ageNum > 120)
    return res.status(400).json({ message: "Age must be between 13 and 120 years" });

  try {
    const user = await UserModel.findOne({ email });
    if (user && user.password)
      return res.status(400).json({ message: "User already registered" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 5 * 60 * 1000;

    otpStore[email] = {
      otp,
      otpExpires,
      userData: { fullName, email, phone, password, state, gender, age: ageNum }
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

    const { fullName, phone, password, state, gender, age } = otpEntry.userData;
    const hashedPassword = await bcrypt.hash(password, 10); // ✅ hash

      const newUser = new UserModel({
      fullName,
      email,
      phone,
      state,
      gender,
      age,
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
        fullName: newUser.fullName,
        state: newUser.state,
        gender: newUser.gender,
        age: newUser.age
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
      user: { 
        email: user.email, 
        fullName: user.fullName,
        state: user.state,
        gender: user.gender,
        age: user.age
      }
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
        state: user.state,
        gender: user.gender,
        age: user.age,
        loginMethod: user.loginMethod
      }
    });
  } catch (err) {
    console.error('Check Auth Status Error:', err);
    res.status(500).json({ message: "Server error checking auth status" });
  }
};

// ✅ Admin: Get all users with detailed information
exports.getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      filter = 'all',
      sortBy = 'recent',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build search query
    let searchQuery = {};
    if (search) {
      searchQuery = {
        $or: [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Build filter query
    let filterQuery = {};
    switch (filter) {
      case 'premium':
        filterQuery.isPremium = true;
        break;
      case 'regular':
        filterQuery.isPremium = false;
        break;
      case 'active':
        filterQuery.isActive = true;
        break;
      case 'inactive':
        filterQuery.isActive = false;
        break;
      default:
        // 'all' - no additional filter
        break;
    }

    // Combine search and filter queries
    const query = { ...searchQuery, ...filterQuery };

    // Build sort query
    let sortQuery = {};
    switch (sortBy) {
      case 'recent':
        sortQuery.createdAt = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'name':
        sortQuery.fullName = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'email':
        sortQuery.email = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'lastActivity':
        sortQuery.lastLoginAt = sortOrder === 'desc' ? -1 : 1;
        break;
      default:
        sortQuery.createdAt = -1;
    }

    // Get users with pagination
    const users = await UserModel.find(query)
      .select('-password -refreshToken -otp -otpExpires')
      .sort(sortQuery)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const totalUsers = await UserModel.countDocuments(query);

    // Get booking counts for each user
    const usersWithBookings = await Promise.all(
      users.map(async (user) => {
        const bookingCount = await BookingModel.countDocuments({ user: user._id });
        return {
          id: user._id,
          name: user.fullName,
          email: user.email,
          phone: user.phone,
          state: user.state,
          gender: user.gender,
          age: user.age,
          isPremium: user.isPremium,
          registeredDate: user.createdAt,
          totalBookings: bookingCount,
          status: user.isActive ? 'active' : 'inactive',
          lastActivity: user.lastLoginAt || user.createdAt,
          profileImage: user.profileImage,
          hasCompletedQuestionnaire: user.hasCompletedQuestionnaire,
          preferredState: user.preferredState,
          preferredSpecialization: user.preferredSpecialization,
          isFirstTimeUser: user.isFirstTimeUser
        };
      })
    );

    // Calculate statistics
    const totalCount = await UserModel.countDocuments();
    const premiumCount = await UserModel.countDocuments({ isPremium: true });
    const activeCount = await UserModel.countDocuments({ isActive: true });
    const totalBookings = await BookingModel.countDocuments();

    const statistics = {
      totalUsers: totalCount,
      premiumUsers: premiumCount,
      activeUsers: activeCount,
      totalBookings: totalBookings
    };

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users: usersWithBookings,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalUsers / limitNum),
          totalUsers: totalUsers,
          hasNextPage: pageNum < Math.ceil(totalUsers / limitNum),
          hasPrevPage: pageNum > 1
        },
        statistics
      }
    });

  } catch (error) {
    console.error('Get All Users Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving users',
      error: error.message
    });
  }
};

// ✅ Admin: Get user statistics only
exports.getUserStatistics = async (req, res) => {
  try {
    const totalUsers = await UserModel.countDocuments();
    const premiumUsers = await UserModel.countDocuments({ isPremium: true });
    const activeUsers = await UserModel.countDocuments({ isActive: true });
    const totalBookings = await BookingModel.countDocuments();

    // Additional statistics
    const newUsersThisMonth = await UserModel.countDocuments({
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    });

    const inactiveUsers = await UserModel.countDocuments({ isActive: false });

    res.status(200).json({
      success: true,
      message: 'User statistics retrieved successfully',
      data: {
        totalUsers,
        premiumUsers,
        activeUsers,
        inactiveUsers,
        totalBookings,
        newUsersThisMonth
      }
    });

  } catch (error) {
    console.error('Get User Statistics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user statistics',
      error: error.message
    });
  }
};

// ✅ Admin: Get single user details with bookings
exports.getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const user = await UserModel.findById(userId)
      .select('-password -refreshToken -otp -otpExpires');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's bookings
    const bookings = await BookingModel.find({ user: userId })
      .populate('psychologist', 'name email specialization')
      .sort({ createdAt: -1 });

    // Get booking statistics
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'completed').length;
    const pendingBookings = bookings.filter(b => b.status === 'pending').length;
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;

    const userDetails = {
      id: user._id,
      name: user.fullName,
      email: user.email,
      phone: user.phone,
      state: user.state,
      gender: user.gender,
      age: user.age,
      isPremium: user.isPremium,
      registeredDate: user.createdAt,
      status: user.isActive ? 'active' : 'inactive',
      lastActivity: user.lastLoginAt || user.createdAt,
      profileImage: user.profileImage,
      hasCompletedQuestionnaire: user.hasCompletedQuestionnaire,
      preferredState: user.preferredState,
      preferredSpecialization: user.preferredSpecialization,
      isFirstTimeUser: user.isFirstTimeUser,
      bookings: {
        total: totalBookings,
        completed: completedBookings,
        pending: pendingBookings,
        cancelled: cancelledBookings,
        history: bookings.map(booking => ({
          id: booking._id,
          date: booking.date,
          time: booking.time,
          status: booking.status,
          psychologist: booking.psychologist,
          bookingType: booking.bookingType,
          bookingMethod: booking.bookingMethod
        }))
      }
    };

    res.status(200).json({
      success: true,
      message: 'User details retrieved successfully',
      data: userDetails
    });

  } catch (error) {
    console.error('Get User Details Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving user details',
      error: error.message
    });
  }
};

// ✅ Admin: Update user status (activate/deactivate)
exports.updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value'
      });
    }

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    ).select('-password -refreshToken -otp -otpExpires');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: user._id,
        name: user.fullName,
        email: user.email,
        status: user.isActive ? 'active' : 'inactive'
      }
    });

  } catch (error) {
    console.error('Update User Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user status',
      error: error.message
    });
  }
};

// ✅ Admin: Update user premium status
exports.updateUserPremiumStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isPremium } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    if (typeof isPremium !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isPremium must be a boolean value'
      });
    }

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { isPremium },
      { new: true }
    ).select('-password -refreshToken -otp -otpExpires');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `User premium status ${isPremium ? 'enabled' : 'disabled'} successfully`,
      data: {
        id: user._id,
        name: user.fullName,
        email: user.email,
        isPremium: user.isPremium
      }
    });

  } catch (error) {
    console.error('Update User Premium Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user premium status',
      error: error.message
    });
  }
};

// ✅ Admin: Delete user (with booking check)
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { force = false } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Check if user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check for active bookings
    const activeBookings = await BookingModel.countDocuments({
      user: userId,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (activeBookings > 0 && !force) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete user. User has ${activeBookings} active booking(s). Use force=true to delete anyway.`,
        activeBookings
      });
    }

    // Delete user and all related bookings
    await UserModel.findByIdAndDelete(userId);
    
    if (force) {
      await BookingModel.deleteMany({ user: userId });
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: {
        deletedUser: user.fullName,
        deletedBookings: force ? activeBookings : 0
      }
    });

  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

// ✅ Update user profile information
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { fullName, phone, state, gender, age } = req.body;

    // Validate age if provided
    if (age) {
      const ageNum = parseInt(age);
      if (isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
        return res.status(400).json({ message: "Age must be between 13 and 120 years" });
      }
    }

    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (phone) updateData.phone = phone;
    if (state) updateData.state = state;
    if (gender) updateData.gender = gender;
    if (age) updateData.age = parseInt(age);

    const user = await UserModel.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password -refreshToken -otp -otpExpires');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        state: user.state,
        gender: user.gender,
        age: user.age
      }
    });

  } catch (err) {
    console.error('Update Profile Error:', err);
    res.status(500).json({ message: "Server error updating profile" });
  }
};

// ✅ Store who recommended this app
exports.storeRecommendationSource = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ 
        status: false,
        message: "User not authenticated" 
      });
    }

    const { recommendedBy } = req.body;

    // Validate the recommendation source
    const validSources = ['Friend', 'Family', 'Doctor', 'Social Media', 'Search Engine', 'Advertisement', 'Other'];
    
    if (!recommendedBy) {
      return res.status(400).json({
        status: false,
        message: "Recommendation source is required"
      });
    }

    if (!validSources.includes(recommendedBy)) {
      return res.status(400).json({
        status: false,
        message: `Invalid recommendation source. Must be one of: ${validSources.join(', ')}`
      });
    }

    // Update user with recommendation source
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { recommendedBy },
      { new: true }
    ).select('-password -refreshToken -otp -otpExpires');

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found"
      });
    }

    console.log(`✅ User ${user.email} recommendation source stored: ${recommendedBy}`);

    res.status(200).json({
      status: true,
      message: "Recommendation source stored successfully",
      data: {
        userId: user._id,
        email: user.email,
        recommendedBy: user.recommendedBy
      }
    });

  } catch (err) {
    console.error('Store Recommendation Source Error:', err);
    res.status(500).json({
      status: false,
      message: "Server error storing recommendation source",
      error: err.message
    });
  }
};

// ✅ Get who recommended this app
exports.getRecommendationSource = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ 
        status: false,
        message: "User not authenticated" 
      });
    }

    const user = await UserModel.findById(userId).select('recommendedBy');

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      status: true,
      message: "Recommendation source retrieved successfully",
      data: {
        userId: user._id,
        recommendedBy: user.recommendedBy
      }
    });

  } catch (err) {
    console.error('Get Recommendation Source Error:', err);
    res.status(500).json({
      status: false,
      message: "Server error retrieving recommendation source",
      error: err.message
    });
  }
};
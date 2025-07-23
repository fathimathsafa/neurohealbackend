const express = require('express');
const router = express.Router();
const fs = require('fs');
const multer = require('multer');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const User = require('../model/user.model');
const userController = require('../controller/user.controller');
const { addPsychologist, editPsychologist, getPsychologistById, deletePsychologist, forceDeletePsychologist } = require('../admin_module/psychologist_adding/psychologist_adding_controller');
const { getAllPsychologists } = require('../admin_module/psychologist_listing/psychologist_listing_controller');
const adminLoginController = require("../admin_module/admin_login/admin_login_controller");
const bookingController = require('../user_module/psychologist_booking/psychologist_booking_controller');
const bookingMiddleware = require('../user_module/psychologist_booking/booking_middleware');
const psychologistLoginController = require('../psychologist_module/psychologist_login/psychologist_login_controller');
const psychologistAuth = require('../psychologist_module/psychologist_login/psychologist_auth_middleware');
const Psychologist = require('../admin_module/psychologist_adding/psychologist_adding_model.js');
const controller  = require('../user_module/questions/questions_controller');
const { verifyToken, verifyAdmin } = require('../middlewares/authmiddleware');
const uploadWithErrorHandling = require('../config/multter_config'); // Adjust path as needed
const PsychologistMatchingService = require('../services/psychologist_matching_service');



// 🔐 Auth Routes
router.post('/pre-register', userController.preRegister);
router.post('/registration', userController.register);
router.post('/login', userController.login);
router.post('/login-doctor', userController.loginDoctor);

// 🔐 Password Reset Routes
router.post('/forgot-password', userController.forgotPassword);
router.post('/verify-otp', userController.verifyOTP);
router.post('/reset-password', userController.resetPassword);

// 🔧 Test Email Configuration
router.post('/test-email', userController.testEmail);

// 🔐 Google OAuth Routes
router.post('/google-login', userController.googleLogin);
router.post('/google-pre-login', userController.googlePreLogin);
router.post('/google-verify-otp', userController.googleVerifyOTP);
router.get('/google-callback', userController.googleCallback);

// 🔧 Configuration Check Route
router.get('/check-google-config', userController.checkGoogleConfig);

// 🔐 Logout Routes
router.post('/logout', verifyToken, userController.logout);
router.post('/logout-all-devices', verifyToken, userController.logoutAllDevices);
router.get('/auth-status', verifyToken, userController.checkAuthStatus);

router.get('/profile', verifyToken, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Fetch complete user details from database
    const user = await User.findById(userId).select('-password -refreshToken -otp -otpExpires');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ 
      message: `Welcome ${user.email}`, 
              user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          state: user.state,
          gender: user.gender,
          age: user.age,
          isPremium: user.isPremium,
          isActive: user.isActive,
          isFirstTimeUser: user.isFirstTimeUser,
          hasCompletedQuestionnaire: user.hasCompletedQuestionnaire,
          hasHadAutomaticBooking: user.hasHadAutomaticBooking,
          preferredState: user.preferredState,
          preferredSpecialization: user.preferredSpecialization,
          profileImage: user.profileImage,
          lastLoginAt: user.lastLoginAt,
          lastLogoutAt: user.lastLogoutAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
    });
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({ message: "Server error fetching profile" });
  }
});

// Update user profile
router.put('/profile', verifyToken, userController.updateProfile);

// Store who recommended this app
router.post('/recommendation-source', verifyToken, userController.storeRecommendationSource);
router.get('/recommendation-source', verifyToken, userController.getRecommendationSource);

// Check if user should be shown recommendation question after first booking
router.get('/check-recommendation-question', verifyToken, userController.checkRecommendationQuestion);

// Check if user has made their first booking
router.get('/check-first-booking', verifyToken, userController.checkFirstBooking);

router.get('/doctorlogin', verifyToken, (req, res) => {
  if (!req.doctor) return res.status(403).json({ message: "Forbidden: Doctors only" });
  res.json({ message: `Welcome Dr. ${req.doctor.email}`, doctor: req.doctor });
});

// Admin Login Route
router.post('/admin/login', adminLoginController.adminLogin);

// Admin Logout Routes
router.post('/admin/logout', verifyAdmin, adminLoginController.adminLogout);
router.get('/admin/auth-status', verifyAdmin, adminLoginController.checkAdminAuthStatus);

// Admin-protected Psychologist Add Route
router.post('/addpsychologist', verifyToken, uploadWithErrorHandling, addPsychologist);

// Admin-protected Psychologist Edit Routes
router.get('/admin/psychologist/:id', verifyAdmin, getPsychologistById);
router.put('/admin/psychologist/:id', verifyAdmin, uploadWithErrorHandling, editPsychologist);

// Admin-protected Psychologist Delete Routes
router.delete('/admin/psychologist/:id', verifyAdmin, deletePsychologist);
router.delete('/admin/psychologist/:id/force', verifyAdmin, forceDeletePsychologist);

// Public Psychologist List
router.get('/allpsychologist', getAllPsychologists);

// Psychologist booking
router.post('/book', bookingMiddleware, bookingController.createBooking);

// Enhanced booking flow with patient details
router.get('/psychologist/:psychologistId/available-dates', bookingMiddleware, bookingController.getAvailableDates);
router.get('/psychologist/:psychologistId/available-times/:date', bookingMiddleware, bookingController.getAvailableTimes);
router.post('/book-with-details', bookingMiddleware, bookingController.createBookingWithDetails);

// Get user's bookings
router.get('/my-bookings', bookingMiddleware, bookingController.getUserBookings);

// Get specific booking by ID
router.get('/booking/:bookingId', bookingMiddleware, bookingController.getBookingById);

// Get user's booking statistics
router.get('/booking-stats', bookingMiddleware, bookingController.getUserBookingStats);

// Get booking history with reschedule and cancellation details
router.get('/booking-history', bookingMiddleware, bookingController.getBookingHistory);

// Get available slots for rescheduling a specific booking
router.get('/booking/:bookingId/reschedule-slots', bookingMiddleware, bookingController.getRescheduleSlots);

// Reschedule a booking
router.put('/booking/:bookingId/reschedule', bookingMiddleware, bookingController.rescheduleBooking);

// Cancel a booking
router.put('/booking/:bookingId/cancel', bookingMiddleware, bookingController.cancelBooking);

// Get bookings by status
router.get('/bookings/pending', bookingMiddleware, bookingController.getPendingBookings);
router.get('/bookings/cancelled', bookingMiddleware, bookingController.getCancelledBookings);
router.get('/bookings/rescheduled', bookingMiddleware, bookingController.getRescheduledBookings);
router.get('/bookings/active', bookingMiddleware, bookingController.getActiveBookings);
router.get('/bookings/completed', bookingMiddleware, bookingController.getCompletedBookings);

// Get available time slots for a psychologist
router.get('/psychologist/:psychologistId/slots/:date', bookingMiddleware, async (req, res) => {
  try {
    const { psychologistId, date } = req.params;
    const slots = await PsychologistMatchingService.getPsychologistSlots(psychologistId, date);
    res.json({
      status: true,
      message: "Time slots retrieved successfully",
      slots: slots
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get weekly slots for a psychologist
router.get('/psychologist/:psychologistId/weekly-slots', bookingMiddleware, async (req, res) => {
  try {
    const { psychologistId } = req.params;
    const slots = await PsychologistMatchingService.getPsychologistWeeklySlots(psychologistId);
    res.json({
      status: true,
      message: "Weekly slots retrieved successfully",
      slots: slots
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Psychologist Login Route
router.post('/psychologistlogin', psychologistLoginController.psychologistLogin);

// Psychologist Logout Routes
router.post('/psychologist/logout', psychologistAuth, psychologistLoginController.psychologistLogout);
router.get('/psychologist/auth-status', psychologistAuth, psychologistLoginController.checkPsychologistAuthStatus);

// Psychologist Profile Route
router.get('/psychologist/profile', psychologistAuth, psychologistLoginController.getPsychologistProfile);

// Get bookings for psychologist
router.get('/psychologist/bookings', psychologistAuth, bookingController.getBookingsForPsychologist);

// Get today's bookings for psychologist
router.get('/psychologist/bookings/today', psychologistAuth, bookingController.getTodayBookingsForPsychologist);

// Get all bookings for psychologist with filtering and pagination
router.get('/psychologist/bookings/all', psychologistAuth, bookingController.getAllBookingsForPsychologist);

// Get bookings for a specific date for psychologist
router.get('/psychologist/bookings/date/:date', psychologistAuth, bookingController.getBookingsByDateForPsychologist);

// Get psychologist's total booking count
router.get('/psychologist/bookings/count', psychologistAuth, bookingController.getPsychologistBookingCount);

// Admin routes for psychologist booking counts
router.get('/admin/psychologists/bookings/count', verifyAdmin, bookingController.getAllPsychologistsBookingCount);
router.get('/admin/psychologist/:psychologistId/bookings/count', verifyAdmin, bookingController.getSpecificPsychologistBookingCount);

// Admin route for getting all booking details for a specific psychologist
router.get('/admin/psychologist/:psychologistId/bookings', verifyAdmin, bookingController.getSpecificPsychologistBookings);

// Admin routes for all bookings and summary
router.get('/admin/bookings/all', verifyAdmin, bookingController.getAllBookingsForAdmin);
router.get('/admin/bookings/summary', verifyAdmin, bookingController.getBookingCountSummaryForAdmin);

// Admin routes for user management
router.get('/admin/users', verifyAdmin, userController.getAllUsers);
router.get('/admin/users/statistics', verifyAdmin, userController.getUserStatistics);
router.get('/admin/users/:userId', verifyAdmin, userController.getUserDetails);
router.put('/admin/users/:userId/status', verifyAdmin, userController.updateUserStatus);
router.put('/admin/users/:userId/premium', verifyAdmin, userController.updateUserPremiumStatus);
router.delete('/admin/users/:userId', verifyAdmin, userController.deleteUser);

// Get count of psychologists
router.get('/psychologistcount', async (req, res) => {
  try {
    const count = await Psychologist.countDocuments();
    res.status(200).json({ status: true, total: count });
  } catch (error) {
    console.error('Error fetching psychologist count:', error);
    res.status(500).json({ status: false, message: 'Server error' });
  }
});

// OTP-based login (for users who want OTP login)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
});

router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    let user = await User.findOne({ email });
    if (user) {
      user.otp = otp;
      user.otpExpires = otpExpires;
      user.loginMethod = 'otp';
    } else {
      user = new User({
        email,
        otp,
        otpExpires,
        loginMethod: 'otp'
      });
    }
    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      html: `<h2>Your OTP is: ${otp}</h2><p>It will expire in 5 minutes.</p>`,
    });

    res.json({ message: "OTP sent to email" });
  } catch (err) {
    console.error("Send OTP error:", err);
    res.status(500).json({ message: "Error sending OTP" });
  }
});

router.post('/verify-otp', async (req, res) => {
  const email = req.body.email.toLowerCase();
  const otp = req.body.otp;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    if (user.otpExpires < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    user.otp = null;
    user.otpExpires = null;
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        email: user.email,
        fullName: user.fullName,
        loginMethod: user.loginMethod
      }
    });

  } catch (err) {
    console.error("OTP verification error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get('/states', controller.getStates);
router.get('/booking-options', controller.getBookingOptions);
router.get('/specializations', controller.getSpecializations);
router.get('/follow-up/:selectedOption', controller.getFollowUpQuestions);
router.get('/expanded-gender-options', controller.getExpandedGenderOptions);
router.get('/user-status', verifyToken, controller.getUserStatus);
router.post('/submit', verifyToken, controller.saveResponses);

// New endpoints for returning users
router.get('/psychologists/all', verifyToken, async (req, res) => {
  try {
    const psychologists = await PsychologistMatchingService.getAllAvailablePsychologists(req);
    res.json({
      status: true,
      message: "All psychologists retrieved successfully",
      psychologists: psychologists
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/psychologists/state/:state', verifyToken, async (req, res) => {
  try {
    const { state } = req.params;
    const psychologists = await PsychologistMatchingService.getPsychologistsByState(state, req);
    res.json({
      status: true,
      message: `Psychologists in ${state} retrieved successfully`,
      psychologists: psychologists
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to check psychologist availability by state and specialization
router.get('/debug/psychologists', async (req, res) => {
  try {
    const { state, specialization } = req.query;
    
    let query = { available: true };
    if (state) {
      // Case-insensitive state matching
      const normalizedState = state.trim().toLowerCase();
      query.state = { $regex: new RegExp(`^${normalizedState}$`, 'i') };
    }
    if (specialization) query.specialization = specialization;
    
    const psychologists = await Psychologist.find(query)
      .select('name specialization state rating experienceYears available')
      .sort({ state: 1, specialization: 1 });
    
    // Group by state
    const grouped = psychologists.reduce((acc, psych) => {
      if (!acc[psych.state]) acc[psych.state] = [];
      acc[psych.state].push(psych);
      return acc;
    }, {});
    
    res.json({
      status: true,
      message: "Psychologist availability debug info",
      query: { state, specialization },
      normalizedState: state ? state.trim().toLowerCase() : null,
      totalPsychologists: psychologists.length,
      groupedByState: grouped,
      allPsychologists: psychologists
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin routes for psychologist management
router.get('/admin/psychologists/:specialization', verifyToken, async (req, res) => {
  try {
    const { specialization } = req.params;
    const psychologists = await PsychologistMatchingService.getPsychologistsBySpecialization(specialization, req);
    res.json(psychologists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/admin/booking-stats', verifyToken, async (req, res) => {
  try {
    const stats = await PsychologistMatchingService.getBookingStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ error: "token_missing", message: "Refresh token required" });
  }

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);

    // Verify stored token matches
    const user = await UserModel.findById(payload.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ error: "token_invalid", message: "Invalid refresh token" });
    }

    // Issue new access token
    const newAccessToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "token_expired", message: "Refresh token expired" });
    }
    console.error('Refresh token error:', err);
    res.status(403).json({ error: "token_invalid", message: "Invalid refresh token" });
  }
});

module.exports = router;
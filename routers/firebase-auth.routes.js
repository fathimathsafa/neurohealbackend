const express = require('express');
const admin = require('../config/firebase');
const User = require('../model/user.model');
const router = express.Router();

// Middleware to verify Firebase ID token
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Firebase token verification error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
};

// Google Sign-In with Firebase
router.post('/google-signin', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid, email, displayName, photoURL } = req.user;
    
    // Check if user already exists
    let user = await User.findOne({ firebaseUid: uid });
    
    if (!user) {
      // Create new user
      user = await User.create({
        firebaseUid: uid,
        email: email,
        fullName: displayName || 'Unknown User',
        profileImage: photoURL,
        loginMethod: 'firebase',
        // Set default values for required fields
        state: 'Unknown',
        gender: 'Other',
        age: 18,
        isFirstTimeUser: true
      });
      
      console.log('✅ New Firebase user created:', user.email);
    } else {
      // Update existing user's info
      user.fullName = displayName || user.fullName;
      user.profileImage = photoURL || user.profileImage;
      user.lastLoginAt = new Date();
      await user.save();
      
      console.log('✅ Existing Firebase user logged in:', user.email);
    }

    // Return user data
    res.json({
      success: true,
      message: 'Google Sign-In successful',
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        profileImage: user.profileImage,
        isFirstTimeUser: user.isFirstTimeUser,
        hasCompletedQuestionnaire: user.hasCompletedQuestionnaire,
        hasHadAutomaticBooking: user.hasHadAutomaticBooking,
        preferredState: user.preferredState,
        preferredSpecialization: user.preferredSpecialization,
        isPremium: user.isPremium,
        age: user.age,
        gender: user.gender,
        state: user.state
      }
    });

  } catch (error) {
    console.error('Firebase Sign-In error:', error);
    res.status(500).json({
      success: false,
      message: 'Firebase Sign-In failed',
      error: error.message
    });
  }
});

// Get user profile (protected route)
router.get('/profile', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const user = await User.findOne({ firebaseUid: uid });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        profileImage: user.profileImage,
        isFirstTimeUser: user.isFirstTimeUser,
        hasCompletedQuestionnaire: user.hasCompletedQuestionnaire,
        hasHadAutomaticBooking: user.hasHadAutomaticBooking,
        preferredState: user.preferredState,
        preferredSpecialization: user.preferredSpecialization,
        isPremium: user.isPremium,
        age: user.age,
        gender: user.gender,
        state: user.state
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message
    });
  }
});

// Update user profile
router.put('/profile', verifyFirebaseToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const updateData = req.body;
    
    const user = await User.findOneAndUpdate(
      { firebaseUid: uid },
      { 
        ...updateData,
        lastLoginAt: new Date()
      },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        profileImage: user.profileImage,
        isFirstTimeUser: user.isFirstTimeUser,
        hasCompletedQuestionnaire: user.hasCompletedQuestionnaire,
        hasHadAutomaticBooking: user.hasHadAutomaticBooking,
        preferredState: user.preferredState,
        preferredSpecialization: user.preferredSpecialization,
        isPremium: user.isPremium,
        age: user.age,
        gender: user.gender,
        state: user.state
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

module.exports = router; 
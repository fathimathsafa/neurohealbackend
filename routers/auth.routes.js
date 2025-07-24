const express = require('express');
const passport = require('../config/passport');
const { OAuth2Client } = require('google-auth-library');
const User = require('../model/user.model');
const router = express.Router();

// Google OAuth client for token verification
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Start Google OAuth (for web)
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback (for web)
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication
    res.redirect('/'); // Change as needed
  }
);

// Mobile Google Sign-In endpoint (for Flutter app)
router.post('/google/mobile', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID token is required' 
      });
    }

    // Verify the ID token with Google
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name;
    const picture = payload.picture;

    // Find or create user
    let user = await User.findOne({ googleId });
    
    if (!user) {
      // Create new user
      user = await User.create({
        googleId,
        email,
        fullName: name,
        profileImage: picture,
        loginMethod: 'google',
        // Set default values for required fields
        state: 'Unknown',
        gender: 'Other',
        age: 18,
        isFirstTimeUser: true
      });
    } else {
      // Update existing user's info
      user.fullName = name;
      user.profileImage = picture;
      user.lastLoginAt = new Date();
      await user.save();
    }

    // Return success response
    res.json({
      success: true,
      message: 'Google Sign-In successful',
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        profileImage: user.profileImage,
        isFirstTimeUser: user.isFirstTimeUser,
        hasCompletedQuestionnaire: user.hasCompletedQuestionnaire
      }
    });

  } catch (error) {
    console.error('Google Sign-In error:', error);
    res.status(500).json({
      success: false,
      message: 'Google Sign-In failed',
      error: error.message
    });
  }
});

module.exports = router; 
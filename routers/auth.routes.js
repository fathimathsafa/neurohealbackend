const express = require('express');
const passport = require('../config/passport');
const router = express.Router();

// Start Google OAuth
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication
    res.redirect('/'); // Change as needed
  }
);

module.exports = router; 
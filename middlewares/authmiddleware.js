const jwt = require('jsonwebtoken');
const User = require('../model/user.model');

require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

// Enhanced verifyToken middleware with automatic refresh
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ 
        message: "Access token required",
        error: "token_missing"
      });
    }

    const token = authHeader.split(" ")[1];

    try {
      // Try to verify the token
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (tokenError) {
      // If token is expired, try to refresh it
      if (tokenError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: "Token expired. Please refresh your session.",
          error: "token_expired",
          shouldRefresh: true
        });
      }
      
      // If token is invalid for other reasons
      return res.status(401).json({ 
        message: "Invalid token",
        error: "token_invalid"
      });
    }
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(500).json({ 
      message: "Token verification failed",
      error: "verification_failed"
    });
  }
};

// Middleware to verify token and automatically refresh if needed
const verifyTokenWithAutoRefresh = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ 
        message: "Access token required",
        error: "token_missing"
      });
    }

    const token = authHeader.split(" ")[1];
    const refreshToken = req.headers['x-refresh-token']; // Get refresh token from header

    try {
      // Try to verify the token
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (tokenError) {
      // If token is expired and we have a refresh token, try to refresh
      if (tokenError.name === 'TokenExpiredError' && refreshToken) {
        try {
          const refreshPayload = jwt.verify(refreshToken, REFRESH_SECRET);
          const user = await User.findById(refreshPayload.id);
          
          if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({ 
              message: "Invalid refresh token",
              error: "refresh_token_invalid"
            });
          }

          // Generate new access token
          const newAccessToken = jwt.sign(
            { id: user._id, email: user.email, role: 'user' },
            JWT_SECRET,
            { expiresIn: '365d' }
          );

          // Set the new token in response headers
          res.setHeader('X-New-Access-Token', newAccessToken);
          
          // Continue with the request using the new token payload
          req.user = { id: user._id, email: user.email, role: 'user' };
          next();
        } catch (refreshError) {
          return res.status(401).json({ 
            message: "Session expired. Please log in again.",
            error: "session_expired"
          });
        }
      } else {
        // Token is invalid for other reasons
        return res.status(401).json({ 
          message: "Invalid token",
          error: "token_invalid"
        });
      }
    }
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(500).json({ 
      message: "Token verification failed",
      error: "verification_failed"
    });
  }
};

// ✅ 2. Admin-only middleware
const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token missing or invalid" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Not authorized as admin" });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token expired or invalid" });
  }
};

// ✅ 3. Psychologist-only middleware
const verifyPsychologist = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token missing or invalid" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== "psychologist") {
      return res.status(403).json({ message: "Not authorized as psychologist" });
    }

    req.psychologist = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token expired or invalid" });
  }
};

// ✅ Export all functions
module.exports = {
  verifyToken,
  verifyTokenWithAutoRefresh,
  verifyAdmin,
  verifyPsychologist
};

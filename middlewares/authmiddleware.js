const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

// ✅ 1. Generic Token Verifier for users or doctors
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach based on role
    if (decoded.role === "doctor") {
      req.doctor = decoded;
    } else {
      req.user = decoded;
    }

    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
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

// ✅ Export all functions
module.exports = {
  verifyToken,
  verifyAdmin
};

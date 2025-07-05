const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

module.exports = (req, res, next) => {
  try {
    // ✅ 1. Get the token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: Token missing or invalid" });
    }

    // ✅ 2. Extract token
    const token = authHeader.split(" ")[1];

    // ✅ 3. Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // ✅ 4. Check if role is psychologist
    if (decoded.role !== "psychologist") {
      return res.status(403).json({ message: "Access denied: Not a psychologist" });
    }

    // ✅ 5. Attach psychologist info to request object
    req.psychologist = decoded;

    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
  }
};

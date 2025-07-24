const express = require('express');
require('dotenv').config();
require('./config/db');
const path = require('path'); // ✅ Add this line

const cors = require('cors');
const body_parser = require('body-parser');
const session = require('express-session');
const passport = require('./config/passport');
const userRouter = require('./routers/user.routes');
const messageRouter = require('./routers/message.routes');
const authRoutes = require('./routers/auth.routes');
//const { getAllPsychologists } = require('./admin_module/psychologist_listing/psychologist_listing_controller');

const app = express();

// Middleware
app.use(cors());
app.use(body_parser.json());

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request body:', req.body);
  }
  next();
});

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads/messages directory if it doesn't exist
const fs = require('fs');
const messagesUploadDir = path.join(__dirname, 'uploads', 'messages');
if (!fs.existsSync(messagesUploadDir)) {
  fs.mkdirSync(messagesUploadDir, { recursive: true });
  console.log('✅ Created uploads/messages directory');
}

// Raw request logger (only for non-multipart requests)
// app.use((req, res, next) => {
//   if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
//     return next(); // Skip for multipart requests
//   }
  
//   let data = '';
//   req.on('data', chunk => data += chunk);
//   req.on('end', () => {
//     if (data) console.log('📥 Raw request body:', data);
//     next();
//   });
// });

// Main routes
app.use('/', userRouter);
app.use('/messages', messageRouter);
app.use('/auth', authRoutes);

// 🛑 404 fallback route
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// 🧨 Global error handler (logs all errors)
app.use((err, req, res, next) => {
  console.error('❌ Error occurred:', {
    message: err.message,
    stack: err.stack,
    status: err.status || 500,
    multer: err instanceof require('multer').MulterError ? err : undefined,
    reqMethod: req.method,
    reqUrl: req.originalUrl,
    reqBody: req.body,
    reqHeaders: req.headers,
  });

  // Handle multer errors specifically
  if (err instanceof require('multer').MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: 'File too large. Max size is 10MB.',
        error: err.message 
      });
    }
    return res.status(400).json({ 
      message: 'File upload error', 
      error: err.message 
    });
  }

  res.status(err.status || 500).json({
    message: 'Internal Server Error',
    error: err.message,
  });
});

module.exports = app;

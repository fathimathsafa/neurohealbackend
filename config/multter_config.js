const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads/psychologist');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('📁 Multer destination called for file:', file.originalname);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    console.log('📝 Multer filename generated:', uniqueName);
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  console.log('🔍 Multer fileFilter called for:', file.originalname, 'MIME type:', file.mimetype);
  
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    console.log('✅ File type allowed');
    cb(null, true);
  } else {
    console.log('❌ File type not allowed:', file.mimetype);
    cb(new Error('Only .jpg, .png, .webp images are allowed'));
  }
};

// Create multiple multer instances with different configurations
const upload = multer({
  storage,
  limits: { 
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 1, // Only allow 1 file
    fields: 20, // Allow up to 20 text fields
    fieldSize: 1024 * 1024 // 1MB for text fields
  },
  fileFilter,
  preservePath: false
}).single('image');

// Alternative upload with more lenient settings
const uploadLenient = multer({
  storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB (increased)
    files: 1,
    fields: 50, // More fields
    fieldSize: 2 * 1024 * 1024 // 2MB for text fields
  },
  fileFilter,
  preservePath: false
}).single('image');

// Wrap multer with error handling
const uploadWithErrorHandling = (req, res, next) => {
  // First try with standard upload
  upload(req, res, (err) => {
    if (err) {
      console.error('❌ Standard Multer Error:', err.message);
      
      // Check if it's a malformed part header error
      if (err.message === 'Malformed part header') {
        console.log('⚠️ Malformed part header detected, trying lenient upload...');
        
        // Try with lenient upload as fallback
        uploadLenient(req, res, (lenientErr) => {
          if (lenientErr) {
            console.error('❌ Lenient upload also failed:', lenientErr.message);
            
            // Check if file was actually saved despite the error
            if (req.file) {
              console.log('✅ File was actually processed successfully:', req.file.filename);
              return next();
            }
            
            return res.status(400).json({ 
              message: 'File upload failed due to malformed request',
              error: 'Please ensure your form data is properly formatted',
              details: lenientErr.message
            });
          }
          
          console.log('✅ Lenient upload succeeded');
          next();
        });
        return;
      }
      
      // Handle other multer errors
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            message: 'File too large. Max size is 2MB.',
            error: err.message 
          });
        }
        return res.status(400).json({ 
          message: 'File upload error', 
          error: err.message 
        });
      }
      
      return res.status(400).json({ 
        message: 'File upload error', 
        error: err.message 
      });
    }
    
    // No error, continue
    console.log('✅ Standard upload succeeded');
    next();
  });
};

// Enhanced upload middleware with better debugging
const uploadWithDebugging = (req, res, next) => {
  console.log('🚀 Starting file upload process...');
  console.log('📋 Request headers:', {
    'content-type': req.headers['content-type'],
    'content-length': req.headers['content-length']
  });
  
  uploadWithErrorHandling(req, res, (err) => {
    if (err) {
      console.error('❌ Upload failed:', err);
      return next(err);
    }
    
    console.log('✅ Upload completed successfully');
    if (req.file) {
      console.log('📁 File saved:', req.file.filename);
    }
    next();
  });
};

module.exports = uploadWithErrorHandling;
module.exports.debug = uploadWithDebugging;

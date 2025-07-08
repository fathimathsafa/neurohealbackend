const express = require('express');
const router = express.Router();
const messageController = require('../controller/message.controller');
const callController = require('../controller/call.controller');
const { verifyToken } = require('../middlewares/authmiddleware');
const multer = require('multer');
const path = require('path');

// Configure multer for message attachments
const messageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/messages/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const messageUpload = multer({
  storage: messageStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and common document types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and documents are allowed.'), false);
    }
  }
});

// Message Routes
router.post('/send', verifyToken, messageUpload.single('attachment'), messageController.sendMessage);

// GET /api/messages/conversation/:bookingId - Get conversation for a booking
router.get('/conversation/:bookingId', verifyToken, messageController.getConversation);

// GET /api/messages/unread-count - Get unread message count
router.get('/unread-count', verifyToken, messageController.getUnreadCount);

// POST /api/messages/mark-read - Mark messages as read
router.post('/mark-read', verifyToken, messageController.markAsRead);

// DELETE /api/messages/:messageId - Delete a message
router.delete('/:messageId', verifyToken, messageController.deleteMessage);

// GET /api/messages/recent-conversations - Get recent conversations
router.get('/recent-conversations', verifyToken, messageController.getRecentConversations);

// Call Routes
// POST /api/calls/initiate - Initiate a call
router.post('/calls/initiate', verifyToken, callController.initiateCall);

// POST /api/calls/:callId/answer - Answer a call
router.post('/calls/:callId/answer', verifyToken, callController.answerCall);

// POST /api/calls/:callId/decline - Decline a call
router.post('/calls/:callId/decline', verifyToken, callController.declineCall);

// POST /api/calls/:callId/end - End a call
router.post('/calls/:callId/end', verifyToken, callController.endCall);

// GET /api/calls/history/:bookingId - Get call history for a booking
router.get('/calls/history/:bookingId', verifyToken, callController.getCallHistory);

// GET /api/calls/active/:bookingId - Get active call for a booking
router.get('/calls/active/:bookingId', verifyToken, callController.getActiveCall);

// POST /api/calls/:callId/report-issue - Report connection issue
router.post('/calls/:callId/report-issue', verifyToken, callController.reportConnectionIssue);

module.exports = router; 
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'senderModel',
    required: true
  },
  senderModel: {
    type: String,
    required: true,
    enum: ['User', 'Psychologist']
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'receiverModel',
    required: true
  },
  receiverModel: {
    type: String,
    required: true,
    enum: ['User', 'Psychologist']
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  attachment: {
    url: String,
    filename: String,
    fileType: String,
    fileSize: Number
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  deletedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'senderModel'
    },
    deletedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for efficient querying
MessageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
MessageSchema.index({ bookingId: 1, createdAt: -1 });
MessageSchema.index({ receiver: 1, isRead: 1 });

// Virtual for message status
MessageSchema.virtual('status').get(function() {
  if (this.isRead) return 'read';
  return 'unread';
});

module.exports = mongoose.model('Message', MessageSchema); 
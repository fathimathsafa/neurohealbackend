const mongoose = require('mongoose');

const CallSchema = new mongoose.Schema({
  caller: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'callerModel',
    required: true
  },
  callerModel: {
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
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  callType: {
    type: String,
    enum: ['audio', 'video'],
    default: 'video'
  },
  status: {
    type: String,
    enum: ['initiated', 'ringing', 'answered', 'declined', 'missed', 'ended', 'busy'],
    default: 'initiated'
  },
  startTime: {
    type: Date,
    default: null
  },
  endTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  roomId: {
    type: String,
    required: true
  },
  recordingUrl: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: null
  },
  quality: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: null
  },
  connectionIssues: [{
    issue: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for efficient querying
CallSchema.index({ caller: 1, receiver: 1, createdAt: -1 });
CallSchema.index({ bookingId: 1, createdAt: -1 });
CallSchema.index({ status: 1, createdAt: -1 });
CallSchema.index({ roomId: 1 });

// Virtual for call duration in minutes
CallSchema.virtual('durationMinutes').get(function() {
  return Math.round(this.duration / 60 * 100) / 100;
});

// Virtual for call status
CallSchema.virtual('isActive').get(function() {
  return ['initiated', 'ringing', 'answered'].includes(this.status);
});

// Pre-save middleware to calculate duration
CallSchema.pre('save', function(next) {
  if (this.startTime && this.endTime && this.status === 'ended') {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  }
  next();
});

module.exports = mongoose.model('Call', CallSchema); 
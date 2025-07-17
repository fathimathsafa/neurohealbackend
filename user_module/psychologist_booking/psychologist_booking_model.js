const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // references the user who books
    required: true,
  },
  psychologist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Psychologist', // references the psychologist being booked
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rescheduled', 'upcoming'],
    default: 'pending',
  },
  // Patient details for manual booking (optional for automatic booking)
  patientDetails: {
    patientName: {
      type: String,
      required: function() {
        // Only required if this is a manual booking (no questionnaireData)
        return !this.questionnaireData;
      },
      trim: true
    },
    contactNumber: {
      type: String,
      required: function() {
        // Only required if this is a manual booking (no questionnaireData)
        return !this.questionnaireData;
      },
      trim: true
    },
    relationWithPatient: {
      type: String,
      required: function() {
        // Only required if this is a manual booking (no questionnaireData)
        return !this.questionnaireData;
      },
      enum: ['Self', 'Child', 'Spouse', 'Parent', 'Sibling', 'Friend', 'Other'],
      default: 'Self'
    },
    age: {
      type: Number,
      required: function() {
        // Only required if this is a manual booking (no questionnaireData)
        return !this.questionnaireData;
      },
      min: 1,
      max: 120
    }
  },
  // Questionnaire data for automatic booking
  questionnaireData: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  bookingType: {
    type: String,
    enum: ['Myself', 'My child', 'Couples', 'My loved ones'],
    required: false
  },
  // Booking method - automatic or manual
  bookingMethod: {
    type: String,
    enum: ['automatic', 'manual'],
    required: true,
    default: 'manual'
  },
  // Track reschedule history
  rescheduleHistory: [{
    previousDate: Date,
    previousTime: String,
    rescheduledAt: {
      type: Date,
      default: Date.now
    },
    reason: String
  }],
  // Track cancellation
  cancelledAt: Date,
  cancellationReason: String
}, { timestamps: true });

const BookingModel = mongoose.model('Booking', bookingSchema);
module.exports = BookingModel;

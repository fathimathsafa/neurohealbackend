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

// 🛡️ PRE-SAVE HOOK: Prevent duplicate bookings at model level
bookingSchema.pre('save', async function(next) {
  try {
    // Check if a booking already exists for this psychologist, date, and time
    const existingBooking = await this.constructor.findOne({
      psychologist: this.psychologist,
      date: {
        $gte: new Date(this.date.toISOString().split('T')[0] + 'T00:00:00.000Z'),
        $lt: new Date(this.date.toISOString().split('T')[0] + 'T23:59:59.999Z')
      },
      time: this.time,
      _id: { $ne: this._id } // Exclude current document if updating
    });

    if (existingBooking) {
      const error = new Error(`Booking already exists for this psychologist on ${this.date.toISOString().split('T')[0]} at ${this.time}`);
      error.name = 'DuplicateBookingError';
      return next(error);
    }

    next();
  } catch (error) {
    next(error);
  }
});

// 🛡️ UNIQUE COMPOUND INDEX: Prevent ANY duplicate bookings for same psychologist, date, and time
bookingSchema.index(
  { 
    psychologist: 1, 
    date: 1, 
    time: 1
  }, 
  { 
    unique: true,
    name: 'unique_booking_slot'
  }
);

// 🛡️ ADDITIONAL INDEX: For efficient querying of active bookings
bookingSchema.index(
  { 
    psychologist: 1, 
    date: 1, 
    time: 1, 
    status: 1 
  }, 
  { 
    partialFilterExpression: { 
      status: { $in: ['pending', 'confirmed'] } 
    },
    name: 'active_booking_index'
  }
);

// 🛡️ ADDITIONAL INDEX: For efficient querying of user bookings
bookingSchema.index({ user: 1, date: -1 });

// 🛡️ ADDITIONAL INDEX: For efficient querying of psychologist bookings
bookingSchema.index({ psychologist: 1, date: -1 });

const BookingModel = mongoose.model('Booking', bookingSchema);
module.exports = BookingModel;

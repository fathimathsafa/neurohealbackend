const mongoose = require('mongoose');

const PsychologistSchema = new mongoose.Schema({
  name: { type: String, },
  username: { type: String, },
  password: { type: String, },
  gender: { type: String, },
  email: { type: String, },
  phone: { type: String, },
  specialization: { 
    type: String, 
    enum: ['Counseling', 'Child Psychology', 'Couples Therapy', 'Family Therapy'],
    required: true
  },
  experienceYears: { type: Number, },
  qualifications: { type: String, },
  hourlyRate: { type: Number, },
  rating: { type: Number, },
  available: { type: Boolean, },
  image: { type: String, },
  clinicName: { type: String, },
  state: { type: String, },
  // New fields for time slot management
  workingDays: {
    type: [String],
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday','Saturday']
  },
  workingHours: {
    start: { type: String, default: '09:00' }, // 9 AM
    end: { type: String, default: '18:00' }    // 6 PM
  },
  sessionDuration: { type: Number, default: 60 }, // in minutes
  breakTime: { type: Number, default: 15 }, // break between sessions in minutes
  // Logout tracking fields
  lastLogoutAt: {
    type: Date,
    default: null
  },
  lastLoginAt: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Psychologist', PsychologistSchema, 'psychologist_list');

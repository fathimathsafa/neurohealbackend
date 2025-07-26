const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  state: { type: String, required: false }, // Optional since it comes from user profile
  bookingFor: { type: String },
  followUpAnswers: { type: mongoose.Schema.Types.Mixed }
});

module.exports = mongoose.model('UserResponse', responseSchema);

const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  state: { type: String },
  bookingFor: { type: String },
  followUpAnswers: { type: mongoose.Schema.Types.Mixed }
});

module.exports = mongoose.model('UserResponse', responseSchema);

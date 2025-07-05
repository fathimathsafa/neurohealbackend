const mongoose = require('mongoose');
require('dotenv').config();
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log("✅ MongoDB connected!");
})
.catch((err) => {
  console.error("❌ MongoDB connection error:");
  console.error(err); // log full error
});

module.exports = mongoose;
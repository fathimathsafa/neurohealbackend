// index.js
const express = require('express');
require('dotenv').config();

const app = require('./app');
const PORT = process.env.PORT || 3001;

// Start server on all network interfaces (0.0.0.0) to allow external access
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});

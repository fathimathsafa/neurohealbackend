// index.js
const express = require('express');
require('dotenv').config();

const app = require('./app');
const socketService = require('./services/socket.service');
const PORT = process.env.PORT || 3001;

// Create HTTP server
const server = require('http').createServer(app);

// Initialize Socket.IO
socketService.initialize(server);

// Start server on all network interfaces (0.0.0.0) to allow external access
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO is ready for real-time communication`);
});

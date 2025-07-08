const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('../model/message.model');
const Call = require('../model/call.model');
const User = require('../model/user.model');
const Psychologist = require('../admin_module/psychologist_adding/psychologist_adding_model');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socket
    this.userRooms = new Map(); // userId -> roomId
    this.activeCalls = new Map(); // roomId -> callData
  }

  initialize(server) {
    this.io = socketIO(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    
    console.log('✅ Socket.IO service initialized');
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Remove 'Bearer ' prefix if present
        const cleanToken = token.replace('Bearer ', '');
        
        const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        socket.userType = decoded.role === 'psychologist' ? 'Psychologist' : 'User';
        
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Invalid authentication token'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 User connected: ${socket.userId} (${socket.userType})`);
      
      // Store connected user
      this.connectedUsers.set(socket.userId, socket);

      // Join user's personal room
      socket.join(`user_${socket.userId}`);

      // Handle user disconnection
      socket.on('disconnect', () => {
        console.log(`🔌 User disconnected: ${socket.userId}`);
        this.handleUserDisconnect(socket);
      });

      // Handle joining a booking room
      socket.on('join_booking_room', (bookingId) => {
        this.handleJoinBookingRoom(socket, bookingId);
      });

      // Handle leaving a booking room
      socket.on('leave_booking_room', (bookingId) => {
        this.handleLeaveBookingRoom(socket, bookingId);
      });

      // Handle sending messages
      socket.on('send_message', async (data) => {
        await this.handleSendMessage(socket, data);
      });

      // Handle typing indicators
      socket.on('typing_start', (data) => {
        this.handleTypingStart(socket, data);
      });

      socket.on('typing_stop', (data) => {
        this.handleTypingStop(socket, data);
      });

      // Handle call signaling
      socket.on('call_signal', (data) => {
        this.handleCallSignal(socket, data);
      });

      // Handle joining video call room
      socket.on('join_call_room', (roomId) => {
        this.handleJoinCallRoom(socket, roomId);
      });

      // Handle leaving video call room
      socket.on('leave_call_room', (roomId) => {
        this.handleLeaveCallRoom(socket, roomId);
      });

      // Handle call status updates
      socket.on('call_status_update', async (data) => {
        await this.handleCallStatusUpdate(socket, data);
      });

      // Handle connection quality report
      socket.on('connection_quality_report', (data) => {
        this.handleConnectionQualityReport(socket, data);
      });
    });
  }

  handleUserDisconnect(socket) {
    // Remove from connected users
    this.connectedUsers.delete(socket.userId);

    // Remove from user rooms
    this.userRooms.delete(socket.userId);

    // Notify other users in booking rooms
    socket.rooms.forEach(room => {
      if (room.startsWith('booking_')) {
        socket.to(room).emit('user_offline', {
          userId: socket.userId,
          userType: socket.userType
        });
      }
    });
  }

  handleJoinBookingRoom(socket, bookingId) {
    socket.join(`booking_${bookingId}`);
    this.userRooms.set(socket.userId, `booking_${bookingId}`);
    
    console.log(`📱 User ${socket.userId} joined booking room ${bookingId}`);
    
    // Notify other users in the room
    socket.to(`booking_${bookingId}`).emit('user_joined_room', {
      userId: socket.userId,
      userType: socket.userType,
      bookingId
    });
  }

  handleLeaveBookingRoom(socket, bookingId) {
    socket.leave(`booking_${bookingId}`);
    this.userRooms.delete(socket.userId);
    
    console.log(`📱 User ${socket.userId} left booking room ${bookingId}`);
    
    // Notify other users in the room
    socket.to(`booking_${bookingId}`).emit('user_left_room', {
      userId: socket.userId,
      userType: socket.userType,
      bookingId
    });
  }

  async handleSendMessage(socket, data) {
    try {
      const { receiverId, receiverType, content, messageType = 'text', bookingId } = data;

      // Validate required fields
      if (!receiverId || !receiverType || !content || !bookingId) {
        socket.emit('message_error', {
          error: 'Missing required fields'
        });
        return;
      }

      // Create message in database
      const messageData = {
        sender: socket.userId,
        senderModel: socket.userType,
        receiver: receiverId,
        receiverModel: receiverType,
        content,
        messageType,
        bookingId
      };

      const message = new Message(messageData);
      const savedMessage = await message.save();

      // Populate sender and receiver details
      await savedMessage.populate('sender', 'fullName name email image');
      await savedMessage.populate('receiver', 'fullName name email image');

      // Emit to booking room
      this.io.to(`booking_${bookingId}`).emit('new_message', {
        message: savedMessage,
        bookingId
      });

      // Emit to receiver's personal room if online
      const receiverSocket = this.connectedUsers.get(receiverId);
      if (receiverSocket) {
        receiverSocket.emit('new_message_notification', {
          message: savedMessage,
          sender: {
            id: socket.userId,
            type: socket.userType
          }
        });
      }

      console.log(`💬 Message sent: ${socket.userId} to ${receiverId} in booking ${bookingId}`);

    } catch (error) {
      console.error('Error handling message:', error);
      socket.emit('message_error', {
        error: 'Failed to send message'
      });
    }
  }

  handleTypingStart(socket, data) {
    const { bookingId } = data;
    socket.to(`booking_${bookingId}`).emit('user_typing_start', {
      userId: socket.userId,
      userType: socket.userType,
      bookingId
    });
  }

  handleTypingStop(socket, data) {
    const { bookingId } = data;
    socket.to(`booking_${bookingId}`).emit('user_typing_stop', {
      userId: socket.userId,
      userType: socket.userType,
      bookingId
    });
  }

  handleCallSignal(socket, data) {
    const { roomId, signal, targetUserId } = data;
    
    // Forward signal to target user
    const targetSocket = this.connectedUsers.get(targetUserId);
    if (targetSocket) {
      targetSocket.emit('call_signal', {
        roomId,
        signal,
        fromUserId: socket.userId
      });
    }
  }

  handleJoinCallRoom(socket, roomId) {
    socket.join(`call_${roomId}`);
    
    // Get number of users in the room
    const room = this.io.sockets.adapter.rooms.get(`call_${roomId}`);
    const userCount = room ? room.size : 0;
    
    console.log(`📞 User ${socket.userId} joined call room ${roomId} (${userCount} users)`);
    
    // Notify other users in the call room
    socket.to(`call_${roomId}`).emit('user_joined_call', {
      userId: socket.userId,
      userType: socket.userType,
      roomId
    });

    // Notify the joining user about other participants
    const participants = [];
    room?.forEach(socketId => {
      const participantSocket = this.io.sockets.sockets.get(socketId);
      if (participantSocket && participantSocket.userId !== socket.userId) {
        participants.push({
          userId: participantSocket.userId,
          userType: participantSocket.userType
        });
      }
    });

    socket.emit('call_participants', {
      roomId,
      participants
    });
  }

  handleLeaveCallRoom(socket, roomId) {
    socket.leave(`call_${roomId}`);
    
    console.log(`📞 User ${socket.userId} left call room ${roomId}`);
    
    // Notify other users in the call room
    socket.to(`call_${roomId}`).emit('user_left_call', {
      userId: socket.userId,
      userType: socket.userType,
      roomId
    });
  }

  async handleCallStatusUpdate(socket, data) {
    try {
      const { callId, status, roomId } = data;

      // Update call in database
      const call = await Call.findById(callId);
      if (!call) {
        socket.emit('call_error', {
          error: 'Call not found'
        });
        return;
      }

      // Update call status
      call.status = status;
      
      if (status === 'answered') {
        call.startTime = new Date();
      } else if (['ended', 'declined', 'missed'].includes(status)) {
        call.endTime = new Date();
      }

      await call.save();

      // Emit to call room
      this.io.to(`call_${roomId}`).emit('call_status_updated', {
        callId,
        status,
        roomId,
        updatedBy: socket.userId
      });

      // Emit to booking room
      this.io.to(`booking_${call.bookingId}`).emit('call_status_updated', {
        callId,
        status,
        bookingId: call.bookingId,
        updatedBy: socket.userId
      });

      console.log(`📞 Call ${callId} status updated to ${status} by ${socket.userId}`);

    } catch (error) {
      console.error('Error updating call status:', error);
      socket.emit('call_error', {
        error: 'Failed to update call status'
      });
    }
  }

  handleConnectionQualityReport(socket, data) {
    const { roomId, quality, issues } = data;
    
    // Emit to other users in the call room
    socket.to(`call_${roomId}`).emit('connection_quality_report', {
      userId: socket.userId,
      userType: socket.userType,
      quality,
      issues,
      roomId
    });
  }

  // Public methods for external use
  sendNotificationToUser(userId, event, data) {
    const userSocket = this.connectedUsers.get(userId);
    if (userSocket) {
      userSocket.emit(event, data);
    }
  }

  sendNotificationToBooking(bookingId, event, data) {
    this.io.to(`booking_${bookingId}`).emit(event, data);
  }

  sendNotificationToCall(roomId, event, data) {
    this.io.to(`call_${roomId}`).emit(event, data);
  }

  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  getOnlineUsers() {
    return Array.from(this.connectedUsers.keys());
  }

  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }
}

module.exports = new SocketService(); 
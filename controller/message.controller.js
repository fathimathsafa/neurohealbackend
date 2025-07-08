const mongoose = require('mongoose');
const Message = require('../model/message.model');
const Booking = require('../user_module/psychologist_booking/psychologist_booking_model');
const User = require('../model/user.model');
const Psychologist = require('../admin_module/psychologist_adding/psychologist_adding_model');

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, receiverType, content, messageType = 'text', bookingId } = req.body;
    const senderId = req.user.id;
    const senderType = req.user.role === 'psychologist' ? 'Psychologist' : 'User';

    // Validate required fields
    if (!receiverId || !receiverType || !content || !bookingId) {
      return res.status(400).json({
        status: false,
        message: "Missing required fields: receiverId, receiverType, content, bookingId"
      });
    }

    // Validate receiver type
    if (!['User', 'Psychologist'].includes(receiverType)) {
      return res.status(400).json({
        status: false,
        message: "Invalid receiver type. Must be 'User' or 'Psychologist'"
      });
    }

    // Validate message type
    if (!['text', 'image', 'file', 'system'].includes(messageType)) {
      return res.status(400).json({
        status: false,
        message: "Invalid message type"
      });
    }

    // Verify booking exists and user has access
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        status: false,
        message: "Booking not found"
      });
    }

    // Check if user is part of this booking
    const isUserInBooking = booking.user.toString() === senderId || 
                           booking.psychologist.toString() === senderId;
    if (!isUserInBooking) {
      return res.status(403).json({
        status: false,
        message: "You don't have access to this booking"
      });
    }

    // Verify receiver exists
    const receiverModel = receiverType === 'User' ? User : Psychologist;
    const receiver = await receiverModel.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        status: false,
        message: "Receiver not found"
      });
    }

    // Create message
    const messageData = {
      sender: senderId,
      senderModel: senderType,
      receiver: receiverId,
      receiverModel: receiverType,
      content,
      messageType,
      bookingId
    };

    // Add attachment info if provided
    if (req.file) {
      const baseUrl = req.protocol + "://" + req.get("host");
      messageData.attachment = {
        url: `${baseUrl}/uploads/messages/${req.file.filename}`,
        filename: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size
      };
    }

    const message = new Message(messageData);
    const savedMessage = await message.save();

    // Populate sender and receiver details
    await savedMessage.populate('sender', 'fullName name email');
    await savedMessage.populate('receiver', 'fullName name email');

    console.log(`✅ Message sent: ${senderType} ${senderId} to ${receiverType} ${receiverId}`);

    res.status(201).json({
      status: true,
      message: "Message sent successfully",
      data: savedMessage
    });

  } catch (error) {
    console.error("❌ Error sending message:", error);
    res.status(500).json({
      status: false,
      message: "Failed to send message",
      error: error.message
    });
  }
};

// Get conversation messages for a booking
exports.getConversation = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user.id;

    // Validate booking exists and user has access
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        status: false,
        message: "Booking not found"
      });
    }

    // Check if user is part of this booking
    const isUserInBooking = booking.user.toString() === userId || 
                           booking.psychologist.toString() === userId;
    if (!isUserInBooking) {
      return res.status(403).json({
        status: false,
        message: "You don't have access to this booking"
      });
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get messages with pagination
    const messages = await Message.find({ bookingId })
      .populate('sender', 'fullName name email image')
      .populate('receiver', 'fullName name email image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const totalMessages = await Message.countDocuments({ bookingId });

    // Mark messages as read for the current user
    await Message.updateMany(
      { 
        bookingId, 
        receiver: userId, 
        isRead: false 
      },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );

    // Add image URLs
    const baseUrl = req.protocol + "://" + req.get("host");
    const formattedMessages = messages.map(msg => ({
      ...msg._doc,
      sender: {
        ...msg.sender._doc,
        image: msg.sender.image ? `${baseUrl}/uploads/${msg.senderModel.toLowerCase()}/${msg.sender.image}` : null
      },
      receiver: {
        ...msg.receiver._doc,
        image: msg.receiver.image ? `${baseUrl}/uploads/${msg.receiverModel.toLowerCase()}/${msg.receiver.image}` : null
      }
    }));

    console.log(`✅ Retrieved ${messages.length} messages for booking ${bookingId}`);

    res.status(200).json({
      status: true,
      message: "Conversation retrieved successfully",
      data: {
        messages: formattedMessages.reverse(), // Show oldest first
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalMessages / parseInt(limit)),
          totalMessages,
          hasNext: skip + messages.length < totalMessages,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error("❌ Error getting conversation:", error);
    res.status(500).json({
      status: false,
      message: "Failed to retrieve conversation",
      error: error.message
    });
  }
};

// Get unread message count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await Message.countDocuments({
      receiver: userId,
      isRead: false
    });

    res.status(200).json({
      status: true,
      message: "Unread count retrieved successfully",
      data: {
        unreadCount
      }
    });

  } catch (error) {
    console.error("❌ Error getting unread count:", error);
    res.status(500).json({
      status: false,
      message: "Failed to get unread count",
      error: error.message
    });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { messageIds } = req.body;
    const userId = req.user.id;

    if (!messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({
        status: false,
        message: "messageIds array is required"
      });
    }

    const result = await Message.updateMany(
      {
        _id: { $in: messageIds },
        receiver: userId,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    console.log(`✅ Marked ${result.modifiedCount} messages as read`);

    res.status(200).json({
      status: true,
      message: "Messages marked as read successfully",
      data: {
        updatedCount: result.modifiedCount
      }
    });

  } catch (error) {
    console.error("❌ Error marking messages as read:", error);
    res.status(500).json({
      status: false,
      message: "Failed to mark messages as read",
      error: error.message
    });
  }
};

// Delete message
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        status: false,
        message: "Message not found"
      });
    }

    // Check if user is the sender
    if (message.sender.toString() !== userId) {
      return res.status(403).json({
        status: false,
        message: "You can only delete your own messages"
      });
    }

    // Add user to deletedBy array
    message.deletedBy.push({
      user: userId,
      deletedAt: new Date()
    });

    await message.save();

    console.log(`✅ Message ${messageId} marked as deleted by user ${userId}`);

    res.status(200).json({
      status: true,
      message: "Message deleted successfully"
    });

  } catch (error) {
    console.error("❌ Error deleting message:", error);
    res.status(500).json({
      status: false,
      message: "Failed to delete message",
      error: error.message
    });
  }
};

// Get recent conversations
exports.getRecentConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.role === 'psychologist' ? 'Psychologist' : 'User';

    // Get unique conversations (bookings) with recent messages
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: new mongoose.Types.ObjectId(userId) },
            { receiver: new mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      {
        $group: {
          _id: '$bookingId',
          lastMessage: { $first: '$$ROOT' },
          messageCount: { $sum: 1 },
          unreadCount: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $eq: ['$receiver', new mongoose.Types.ObjectId(userId)] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      },
      {
        $limit: 20
      }
    ]);

    // Populate booking and other user details
    const populatedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const booking = await Booking.findById(conv._id)
          .populate('user', 'fullName email image')
          .populate('psychologist', 'name email image specialization');

        if (!booking) return null;

        // Determine the other user in the conversation
        const otherUser = booking.user._id.toString() === userId 
          ? booking.psychologist 
          : booking.user;

        return {
          bookingId: conv._id,
          booking: {
            id: booking._id,
            date: booking.date,
            time: booking.time,
            status: booking.status
          },
          otherUser: {
            id: otherUser._id,
            name: otherUser.fullName || otherUser.name,
            email: otherUser.email,
            image: otherUser.image,
            type: booking.user._id.toString() === userId ? 'Psychologist' : 'User',
            specialization: otherUser.specialization
          },
          lastMessage: conv.lastMessage,
          messageCount: conv.messageCount,
          unreadCount: conv.unreadCount
        };
      })
    );

    // Filter out null values and add image URLs
    const baseUrl = req.protocol + "://" + req.get("host");
    const formattedConversations = populatedConversations
      .filter(conv => conv !== null)
      .map(conv => ({
        ...conv,
        otherUser: {
          ...conv.otherUser,
          image: conv.otherUser.image ? `${baseUrl}/uploads/${conv.otherUser.type.toLowerCase()}/${conv.otherUser.image}` : null
        }
      }));

    console.log(`✅ Retrieved ${formattedConversations.length} recent conversations`);

    res.status(200).json({
      status: true,
      message: "Recent conversations retrieved successfully",
      data: formattedConversations
    });

  } catch (error) {
    console.error("❌ Error getting recent conversations:", error);
    res.status(500).json({
      status: false,
      message: "Failed to retrieve recent conversations",
      error: error.message
    });
  }
}; 
const Call = require('../model/call.model');
const Booking = require('../user_module/psychologist_booking/psychologist_booking_model');
const User = require('../model/user.model');
const Psychologist = require('../admin_module/psychologist_adding/psychologist_adding_model');
const { v4: uuidv4 } = require('uuid');

// Initiate a call
exports.initiateCall = async (req, res) => {
  try {
    const { receiverId, receiverType, callType = 'video', bookingId } = req.body;
    const callerId = req.user.id;
    const callerType = req.user.role === 'psychologist' ? 'Psychologist' : 'User';

    // Validate required fields
    if (!receiverId || !receiverType || !bookingId) {
      return res.status(400).json({
        status: false,
        message: "Missing required fields: receiverId, receiverType, bookingId"
      });
    }

    // Validate receiver type
    if (!['User', 'Psychologist'].includes(receiverType)) {
      return res.status(400).json({
        status: false,
        message: "Invalid receiver type. Must be 'User' or 'Psychologist'"
      });
    }

    // Validate call type
    if (!['audio', 'video'].includes(callType)) {
      return res.status(400).json({
        status: false,
        message: "Invalid call type. Must be 'audio' or 'video'"
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
    const isUserInBooking = booking.user.toString() === callerId || 
                           booking.psychologist.toString() === callerId;
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

    // Check if there's already an active call for this booking
    const activeCall = await Call.findOne({
      bookingId,
      status: { $in: ['initiated', 'ringing', 'answered'] }
    });

    if (activeCall) {
      return res.status(409).json({
        status: false,
        message: "There's already an active call for this booking",
        data: {
          callId: activeCall._id,
          roomId: activeCall.roomId
        }
      });
    }

    // Create call record
    const callData = {
      caller: callerId,
      callerModel: callerType,
      receiver: receiverId,
      receiverModel: receiverType,
      bookingId,
      callType,
      roomId: uuidv4(),
      status: 'initiated'
    };

    const call = new Call(callData);
    const savedCall = await call.save();

    // Populate caller and receiver details
    await savedCall.populate('caller', 'fullName name email');
    await savedCall.populate('receiver', 'fullName name email');

    console.log(`✅ Call initiated: ${callerType} ${callerId} to ${receiverType} ${receiverId}`);

    res.status(201).json({
      status: true,
      message: "Call initiated successfully",
      data: {
        callId: savedCall._id,
        roomId: savedCall.roomId,
        callType: savedCall.callType,
        status: savedCall.status,
        receiver: {
          id: savedCall.receiver._id,
          name: savedCall.receiver.fullName || savedCall.receiver.name,
          email: savedCall.receiver.email
        }
      }
    });

  } catch (error) {
    console.error("❌ Error initiating call:", error);
    res.status(500).json({
      status: false,
      message: "Failed to initiate call",
      error: error.message
    });
  }
};

// Answer a call
exports.answerCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user.id;

    const call = await Call.findById(callId);
    if (!call) {
      return res.status(404).json({
        status: false,
        message: "Call not found"
      });
    }

    // Check if user is the receiver
    if (call.receiver.toString() !== userId) {
      return res.status(403).json({
        status: false,
        message: "You can only answer calls directed to you"
      });
    }

    // Check if call is in ringing state
    if (call.status !== 'ringing') {
      return res.status(400).json({
        status: false,
        message: "Call is not in ringing state"
      });
    }

    // Update call status
    call.status = 'answered';
    call.startTime = new Date();
    await call.save();

    console.log(`✅ Call ${callId} answered by user ${userId}`);

    res.status(200).json({
      status: true,
      message: "Call answered successfully",
      data: {
        callId: call._id,
        roomId: call.roomId,
        callType: call.callType,
        status: call.status,
        startTime: call.startTime
      }
    });

  } catch (error) {
    console.error("❌ Error answering call:", error);
    res.status(500).json({
      status: false,
      message: "Failed to answer call",
      error: error.message
    });
  }
};

// Decline a call
exports.declineCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const call = await Call.findById(callId);
    if (!call) {
      return res.status(404).json({
        status: false,
        message: "Call not found"
      });
    }

    // Check if user is the receiver
    if (call.receiver.toString() !== userId) {
      return res.status(403).json({
        status: false,
        message: "You can only decline calls directed to you"
      });
    }

    // Check if call is in ringing state
    if (call.status !== 'ringing') {
      return res.status(400).json({
        status: false,
        message: "Call is not in ringing state"
      });
    }

    // Update call status
    call.status = 'declined';
    call.endTime = new Date();
    if (reason) {
      call.notes = `Declined: ${reason}`;
    }
    await call.save();

    console.log(`✅ Call ${callId} declined by user ${userId}`);

    res.status(200).json({
      status: true,
      message: "Call declined successfully",
      data: {
        callId: call._id,
        status: call.status,
        notes: call.notes
      }
    });

  } catch (error) {
    console.error("❌ Error declining call:", error);
    res.status(500).json({
      status: false,
      message: "Failed to decline call",
      error: error.message
    });
  }
};

// End a call
exports.endCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const { notes, quality } = req.body;
    const userId = req.user.id;

    const call = await Call.findById(callId);
    if (!call) {
      return res.status(404).json({
        status: false,
        message: "Call not found"
      });
    }

    // Check if user is part of the call
    const isUserInCall = call.caller.toString() === userId || 
                        call.receiver.toString() === userId;
    if (!isUserInCall) {
      return res.status(403).json({
        status: false,
        message: "You can only end calls you're part of"
      });
    }

    // Check if call is active
    if (!['initiated', 'ringing', 'answered'].includes(call.status)) {
      return res.status(400).json({
        status: false,
        message: "Call is not active"
      });
    }

    // Update call status
    call.status = 'ended';
    call.endTime = new Date();
    if (notes) {
      call.notes = notes;
    }
    if (quality) {
      call.quality = quality;
    }
    await call.save();

    console.log(`✅ Call ${callId} ended by user ${userId}`);

    res.status(200).json({
      status: true,
      message: "Call ended successfully",
      data: {
        callId: call._id,
        status: call.status,
        duration: call.duration,
        durationMinutes: call.durationMinutes
      }
    });

  } catch (error) {
    console.error("❌ Error ending call:", error);
    res.status(500).json({
      status: false,
      message: "Failed to end call",
      error: error.message
    });
  }
};

// Get call history
exports.getCallHistory = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { page = 1, limit = 20 } = req.query;
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

    // Get calls with pagination
    const calls = await Call.find({ bookingId })
      .populate('caller', 'fullName name email')
      .populate('receiver', 'fullName name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const totalCalls = await Call.countDocuments({ bookingId });

    console.log(`✅ Retrieved ${calls.length} calls for booking ${bookingId}`);

    res.status(200).json({
      status: true,
      message: "Call history retrieved successfully",
      data: {
        calls: calls.map(call => ({
          id: call._id,
          callType: call.callType,
          status: call.status,
          startTime: call.startTime,
          endTime: call.endTime,
          duration: call.duration,
          durationMinutes: call.durationMinutes,
          roomId: call.roomId,
          notes: call.notes,
          quality: call.quality,
          caller: {
            id: call.caller._id,
            name: call.caller.fullName || call.caller.name,
            email: call.caller.email
          },
          receiver: {
            id: call.receiver._id,
            name: call.receiver.fullName || call.receiver.name,
            email: call.receiver.email
          },
          createdAt: call.createdAt
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCalls / parseInt(limit)),
          totalCalls,
          hasNext: skip + calls.length < totalCalls,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error("❌ Error getting call history:", error);
    res.status(500).json({
      status: false,
      message: "Failed to retrieve call history",
      error: error.message
    });
  }
};

// Get active call for a booking
exports.getActiveCall = async (req, res) => {
  try {
    const { bookingId } = req.params;
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

    // Find active call
    const activeCall = await Call.findOne({
      bookingId,
      status: { $in: ['initiated', 'ringing', 'answered'] }
    }).populate('caller', 'fullName name email')
      .populate('receiver', 'fullName name email');

    if (!activeCall) {
      return res.status(404).json({
        status: true,
        message: "No active call found",
        data: null
      });
    }

    res.status(200).json({
      status: true,
      message: "Active call retrieved successfully",
      data: {
        id: activeCall._id,
        callType: activeCall.callType,
        status: activeCall.status,
        roomId: activeCall.roomId,
        startTime: activeCall.startTime,
        caller: {
          id: activeCall.caller._id,
          name: activeCall.caller.fullName || activeCall.caller.name,
          email: activeCall.caller.email
        },
        receiver: {
          id: activeCall.receiver._id,
          name: activeCall.receiver.fullName || activeCall.receiver.name,
          email: activeCall.receiver.email
        }
      }
    });

  } catch (error) {
    console.error("❌ Error getting active call:", error);
    res.status(500).json({
      status: false,
      message: "Failed to retrieve active call",
      error: error.message
    });
  }
};

// Report connection issue
exports.reportConnectionIssue = async (req, res) => {
  try {
    const { callId } = req.params;
    const { issue } = req.body;
    const userId = req.user.id;

    if (!issue) {
      return res.status(400).json({
        status: false,
        message: "Issue description is required"
      });
    }

    const call = await Call.findById(callId);
    if (!call) {
      return res.status(404).json({
        status: false,
        message: "Call not found"
      });
    }

    // Check if user is part of the call
    const isUserInCall = call.caller.toString() === userId || 
                        call.receiver.toString() === userId;
    if (!isUserInCall) {
      return res.status(403).json({
        status: false,
        message: "You can only report issues for calls you're part of"
      });
    }

    // Add connection issue
    call.connectionIssues.push({
      issue,
      timestamp: new Date()
    });

    await call.save();

    console.log(`✅ Connection issue reported for call ${callId}`);

    res.status(200).json({
      status: true,
      message: "Connection issue reported successfully",
      data: {
        callId: call._id,
        issuesCount: call.connectionIssues.length
      }
    });

  } catch (error) {
    console.error("❌ Error reporting connection issue:", error);
    res.status(500).json({
      status: false,
      message: "Failed to report connection issue",
      error: error.message
    });
  }
}; 
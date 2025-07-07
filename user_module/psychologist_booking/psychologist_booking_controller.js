const Booking = require('./psychologist_booking_model');
const Psychologist = require('../../admin_module/psychologist_adding/psychologist_adding_model');
const TimeSlotService = require('../../services/time_slot_service');

exports.createBooking = async (req, res) => {
  try {
    const { psychologistId, date, time } = req.body;
    const userId = req.user.id; // Extracted from JWT middleware

    // Validate fields
    if (!psychologistId || !date || !time) {
      return res.status(400).json({
        status: false,
        message: "All fields (psychologistId, date, time) are required"
      });
    }

    // Create booking
    const newBooking = new Booking({
      user: userId,
      psychologist: psychologistId,
      date,
      time,
      bookingMethod: 'manual' // Mark as manual booking
    });

    const savedBooking = await newBooking.save();

    res.status(201).json({
      status: true,
      message: 'Booking created successfully',
      booking: savedBooking
    });

  } catch (err) {
    console.error("Booking error:", err);
    res.status(500).json({ status: false, message: err.message });
  }
  
};

// Get user's booking details
exports.getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id; // Extracted from JWT middleware
    console.log(`📋 Getting bookings for user: ${userId}`);

    const bookings = await Booking.find({ user: userId })
      .populate('psychologist', 'name specialization clinicName state image rating experienceYears hourlyRate email phone')
      .sort({ createdAt: -1 }); // Most recent first

    console.log(`✅ Found ${bookings.length} bookings for user`);

    // Add image URL to each booking
    const baseUrl = req.protocol + "://" + req.get("host");
    const bookingsWithImages = bookings.map(booking => ({
      ...booking._doc,
      psychologist: {
        ...booking.psychologist._doc,
        image: `${baseUrl}/uploads/psychologist/${booking.psychologist.image}`
      }
    }));

    res.status(200).json({
      status: true,
      message: "Bookings retrieved successfully",
      bookings: bookingsWithImages,
      totalBookings: bookings.length
    });

  } catch (err) {
    console.error("❌ Error fetching user bookings:", err);
    res.status(500).json({
      status: false,
      message: "Error retrieving bookings",
      error: err.message
    });
  }
};

// Get specific booking by ID
exports.getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id; // Extracted from JWT middleware
    console.log(`📋 Getting booking ${bookingId} for user: ${userId}`);

    const booking = await Booking.findOne({ 
      _id: bookingId, 
      user: userId 
    }).populate('psychologist', 'name specialization clinicName state image rating experienceYears hourlyRate email phone');

    if (!booking) {
      return res.status(404).json({
        status: false,
        message: "Booking not found"
      });
    }

    // Add image URL
    const baseUrl = req.protocol + "://" + req.get("host");
    const bookingWithImage = {
      ...booking._doc,
      psychologist: {
        ...booking.psychologist._doc,
        image: `${baseUrl}/uploads/psychologist/${booking.psychologist.image}`
      }
    };

    console.log(`✅ Booking found: ${bookingId}`);

    res.status(200).json({
      status: true,
      message: "Booking retrieved successfully",
      booking: bookingWithImage
    });

  } catch (err) {
    console.error("❌ Error fetching booking:", err);
    res.status(500).json({
      status: false,
      message: "Error retrieving booking",
      error: err.message
    });
  }
};

// Get booking statistics for user
exports.getUserBookingStats = async (req, res) => {
  try {
    const userId = req.user.id; // Extracted from JWT middleware
    console.log(`📊 Getting booking stats for user: ${userId}`);

    const stats = await Booking.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert to object format
    const statsObject = stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    // Get total bookings
    const totalBookings = await Booking.countDocuments({ user: userId });

    console.log(`✅ Stats retrieved:`, statsObject);

    res.status(200).json({
      status: true,
      message: "Booking statistics retrieved successfully",
      stats: {
        ...statsObject,
        total: totalBookings
      }
    });

  } catch (err) {
    console.error("❌ Error fetching booking stats:", err);
    res.status(500).json({
      status: false,
      message: "Error retrieving booking statistics",
      error: err.message
    });
  }
};

exports.getBookingsForPsychologist = async (req, res) => {
  try {
    const psychologistId = req.psychologist.id; // Extracted from JWT by auth middleware

    const bookings = await Booking.find({ psychologist: psychologistId })
      .populate('user', 'fullName email') // Show basic user info
      .sort({ date: -1 });

    res.status(200).json({
      status: true,
      message: "Bookings retrieved successfully",
      bookings
    });
  } catch (err) {
    console.error("Error fetching bookings:", err);
    res.status(500).json({
      status: false,
      message: "Error retrieving bookings"
    });
  }
};

// Get today's bookings for psychologist
exports.getTodayBookingsForPsychologist = async (req, res) => {
  try {
    const psychologistId = req.psychologist.id;
    console.log(`📅 Getting today's bookings for psychologist: ${psychologistId}`);

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    // Get bookings for today
    const todayBookings = await Booking.find({
      psychologist: psychologistId,
      date: {
        $gte: new Date(todayString + 'T00:00:00.000Z'),
        $lt: new Date(todayString + 'T23:59:59.999Z')
      },
      status: { $in: ['pending', 'confirmed', 'rescheduled'] } // Only active bookings
    })
      .populate('user', 'fullName email phone')
      .sort({ time: 1 }); // Sort by time (earliest first)

    console.log(`✅ Found ${todayBookings.length} bookings for today`);

    // Format the response with patient details
    const formattedBookings = todayBookings.map(booking => ({
      id: booking._id,
      date: booking.date,
      time: booking.time,
      status: booking.status,
      bookingType: booking.bookingType,
      patientDetails: booking.patientDetails,
      user: booking.user,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    }));

    res.status(200).json({
      status: true,
      message: "Today's bookings retrieved successfully",
      date: todayString,
      dayName: today.toLocaleDateString('en-US', { weekday: 'long' }),
      bookings: formattedBookings,
      totalBookings: todayBookings.length
    });

  } catch (err) {
    console.error("❌ Error fetching today's bookings:", err);
    res.status(500).json({
      status: false,
      message: "Error retrieving today's bookings",
      error: err.message
    });
  }
};

// Get all bookings for psychologist with enhanced details and filtering
exports.getAllBookingsForPsychologist = async (req, res) => {
  try {
    const psychologistId = req.psychologist.id;
    const { status, date, page = 1, limit = 20 } = req.query;
    
    console.log(`📋 Getting all bookings for psychologist: ${psychologistId}`);

    // Build filter object
    const filter = { psychologist: psychologistId };
    
    // Add status filter if provided
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    // Add date filter if provided
    if (date) {
      filter.date = {
        $gte: new Date(date + 'T00:00:00.000Z'),
        $lt: new Date(date + 'T23:59:59.999Z')
      };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get bookings with pagination
    const bookings = await Booking.find(filter)
      .populate('user', 'fullName email phone')
      .sort({ date: -1, time: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalBookings = await Booking.countDocuments(filter);

    console.log(`✅ Found ${bookings.length} bookings (page ${page})`);

    // Format the response
    const formattedBookings = bookings.map(booking => ({
      id: booking._id,
      date: booking.date,
      time: booking.time,
      status: booking.status,
      bookingType: booking.bookingType,
      patientDetails: booking.patientDetails,
      user: booking.user,
      rescheduleHistory: booking.rescheduleHistory,
      cancelledAt: booking.cancelledAt,
      cancellationReason: booking.cancellationReason,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    }));

    // Get booking statistics
    const stats = await Booking.aggregate([
      { $match: { psychologist: psychologistId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statsObject = stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    res.status(200).json({
      status: true,
      message: "All bookings retrieved successfully",
      bookings: formattedBookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalBookings / parseInt(limit)),
        totalBookings: totalBookings,
        hasNextPage: skip + bookings.length < totalBookings,
        hasPrevPage: parseInt(page) > 1
      },
      stats: {
        ...statsObject,
        total: totalBookings
      },
      filters: {
        status: status || 'all',
        date: date || null
      }
    });

  } catch (err) {
    console.error("❌ Error fetching all bookings:", err);
    res.status(500).json({
      status: false,
      message: "Error retrieving all bookings",
      error: err.message
    });
  }
};

// Get bookings for a specific date for psychologist
exports.getBookingsByDateForPsychologist = async (req, res) => {
  try {
    const psychologistId = req.psychologist.id;
    const { date } = req.params;
    
    console.log(`📅 Getting bookings for psychologist ${psychologistId} on ${date}`);

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        status: false,
        message: "Invalid date format. Use YYYY-MM-DD"
      });
    }

    // Get bookings for the specific date
    const dateBookings = await Booking.find({
      psychologist: psychologistId,
      date: {
        $gte: new Date(date + 'T00:00:00.000Z'),
        $lt: new Date(date + 'T23:59:59.999Z')
      }
    })
      .populate('user', 'fullName email phone')
      .sort({ time: 1 }); // Sort by time

    console.log(`✅ Found ${dateBookings.length} bookings for ${date}`);

    // Format the response
    const formattedBookings = dateBookings.map(booking => ({
      id: booking._id,
      date: booking.date,
      time: booking.time,
      status: booking.status,
      bookingType: booking.bookingType,
      patientDetails: booking.patientDetails,
      user: booking.user,
      rescheduleHistory: booking.rescheduleHistory,
      cancelledAt: booking.cancelledAt,
      cancellationReason: booking.cancellationReason,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    }));

    // Get status breakdown for this date
    const statusBreakdown = dateBookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      status: true,
      message: "Date bookings retrieved successfully",
      date: date,
      dayName: new Date(date).toLocaleDateString('en-US', { weekday: 'long' }),
      bookings: formattedBookings,
      totalBookings: dateBookings.length,
      statusBreakdown: statusBreakdown
    });

  } catch (err) {
    console.error("❌ Error fetching date bookings:", err);
    res.status(500).json({
      status: false,
      message: "Error retrieving date bookings",
      error: err.message
    });
  }
};

// Get available slots for rescheduling a specific booking
exports.getRescheduleSlots = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    console.log(`🔄 Getting reschedule slots for booking ${bookingId}`);

    // Find the booking and verify ownership
    const booking = await Booking.findOne({ 
      _id: bookingId, 
      user: userId,
      status: { $in: ['pending', 'confirmed'] } // Only allow reschedule for active bookings
    }).populate('psychologist');

    if (!booking) {
      return res.status(404).json({
        status: false,
        message: "Booking not found or cannot be rescheduled"
      });
    }

    // Get available slots for the next 7 days
    const availableSlots = await TimeSlotService.getAvailableSlotsForWeek(booking.psychologist._id);

    // Filter out the current booking's slot
    const currentDate = booking.date.toISOString().split('T')[0];
    const currentTime = booking.time;

    if (availableSlots[currentDate]) {
      availableSlots[currentDate] = availableSlots[currentDate].filter(
        slot => slot.startTime !== currentTime
      );
      
      // Remove the date if no slots remain
      if (availableSlots[currentDate].length === 0) {
        delete availableSlots[currentDate];
      }
    }

    console.log(`✅ Found reschedule slots for ${Object.keys(availableSlots).length} days`);

    res.status(200).json({
      status: true,
      message: "Available reschedule slots retrieved successfully",
      currentBooking: {
        id: booking._id,
        date: booking.date,
        time: booking.time,
        psychologist: booking.psychologist.name
      },
      availableSlots
    });

  } catch (err) {
    console.error("❌ Error getting reschedule slots:", err);
    res.status(500).json({
      status: false,
      message: "Error retrieving reschedule slots",
      error: err.message
    });
  }
};

// Reschedule a booking
exports.rescheduleBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { newDate, newTime, reason } = req.body;
    const userId = req.user.id;

    console.log(`🔄 Rescheduling booking ${bookingId} to ${newDate} at ${newTime}`);

    // Validate required fields
    if (!newDate || !newTime) {
      return res.status(400).json({
        status: false,
        message: "New date and time are required"
      });
    }

    // Find the booking and verify ownership
    const booking = await Booking.findOne({ 
      _id: bookingId, 
      user: userId,
      status: { $in: ['pending', 'confirmed'] }
    }).populate('psychologist');

    if (!booking) {
      return res.status(404).json({
        status: false,
        message: "Booking not found or cannot be rescheduled"
      });
    }

    // Check if the new slot is available
    const isAvailable = await TimeSlotService.isSlotAvailable(
      booking.psychologist._id, 
      newDate, 
      newTime
    );

    if (!isAvailable) {
      return res.status(400).json({
        status: false,
        message: "Selected time slot is not available"
      });
    }

    // Store the previous booking details in reschedule history
    const rescheduleEntry = {
      previousDate: booking.date,
      previousTime: booking.time,
      reason: reason || 'User requested reschedule'
    };

    // Update the booking
    booking.date = new Date(newDate);
    booking.time = newTime;
    booking.status = 'rescheduled';
    booking.rescheduleHistory.push(rescheduleEntry);

    const updatedBooking = await booking.save();

    console.log(`✅ Booking rescheduled successfully`);

    res.status(200).json({
      status: true,
      message: "Booking rescheduled successfully",
      booking: {
        id: updatedBooking._id,
        date: updatedBooking.date,
        time: updatedBooking.time,
        status: updatedBooking.status,
        psychologist: booking.psychologist.name
      }
    });

  } catch (err) {
    console.error("❌ Error rescheduling booking:", err);
    res.status(500).json({
      status: false,
      message: "Error rescheduling booking",
      error: err.message
    });
  }
};

// Cancel a booking
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    console.log(`❌ Cancelling booking ${bookingId}`);

    // Find the booking and verify ownership
    const booking = await Booking.findOne({ 
      _id: bookingId, 
      user: userId,
      status: { $in: ['pending', 'confirmed', 'rescheduled'] } // Allow cancellation of active bookings
    }).populate('psychologist');

    if (!booking) {
      return res.status(404).json({
        status: false,
        message: "Booking not found or cannot be cancelled"
      });
    }

    // Update the booking status
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancellationReason = reason || 'User requested cancellation';

    const updatedBooking = await booking.save();

    console.log(`✅ Booking cancelled successfully`);

    res.status(200).json({
      status: true,
      message: "Booking cancelled successfully",
      booking: {
        id: updatedBooking._id,
        status: updatedBooking.status,
        cancelledAt: updatedBooking.cancelledAt,
        cancellationReason: updatedBooking.cancellationReason,
        psychologist: booking.psychologist.name
      }
    });

  } catch (err) {
    console.error("❌ Error cancelling booking:", err);
    res.status(500).json({
      status: false,
      message: "Error cancelling booking",
      error: err.message
    });
  }
};

// Get booking history with reschedule and cancellation details
exports.getBookingHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📋 Getting booking history for user: ${userId}`);

    const allBookings = await Booking.find({ user: userId })
      .populate('psychologist', 'name specialization clinicName state image rating experienceYears hourlyRate email phone')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${allBookings.length} total bookings`);

    // Add image URL and format the response
    const baseUrl = req.protocol + "://" + req.get("host");
    const formattedBookings = allBookings.map(booking => ({
      id: booking._id,
      date: booking.date,
      time: booking.time,
      status: booking.status,
      bookingType: booking.bookingType,
      patientDetails: booking.patientDetails,
      psychologist: {
        ...booking.psychologist._doc,
        image: `${baseUrl}/uploads/psychologist/${booking.psychologist.image}`
      },
      rescheduleHistory: booking.rescheduleHistory,
      cancelledAt: booking.cancelledAt,
      cancellationReason: booking.cancellationReason,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    }));

    // Group bookings by status
    const groupedBookings = {
      pending: formattedBookings.filter(b => b.status === 'pending'),
      confirmed: formattedBookings.filter(b => b.status === 'confirmed'),
      completed: formattedBookings.filter(b => b.status === 'completed'),
      cancelled: formattedBookings.filter(b => b.status === 'cancelled'),
      rescheduled: formattedBookings.filter(b => b.status === 'rescheduled')
    };

    res.status(200).json({
      status: true,
      message: "Booking history retrieved successfully",
      bookings: formattedBookings,
      groupedBookings: groupedBookings,
      totalBookings: allBookings.length,
      stats: {
        pending: groupedBookings.pending.length,
        confirmed: groupedBookings.confirmed.length,
        completed: groupedBookings.completed.length,
        cancelled: groupedBookings.cancelled.length,
        rescheduled: groupedBookings.rescheduled.length
      }
    });

  } catch (err) {
    console.error("❌ Error fetching booking history:", err);
    res.status(500).json({
      status: false,
      message: "Error retrieving booking history",
      error: err.message
    });
  }
};

// Get pending bookings only
exports.getPendingBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📋 Getting pending bookings for user: ${userId}`);

    const pendingBookings = await Booking.find({ 
      user: userId,
      status: 'pending'
    })
      .populate('psychologist', 'name specialization clinicName state image rating experienceYears hourlyRate email phone')
      .sort({ date: 1 }); // Earliest date first

    console.log(`✅ Found ${pendingBookings.length} pending bookings`);

    // Add image URL and format the response
    const baseUrl = req.protocol + "://" + req.get("host");
    const formattedBookings = pendingBookings.map(booking => ({
      id: booking._id,
      date: booking.date,
      time: booking.time,
      status: booking.status,
      bookingType: booking.bookingType,
      patientDetails: booking.patientDetails,
      psychologist: {
        ...booking.psychologist._doc,
        image: `${baseUrl}/uploads/psychologist/${booking.psychologist.image}`
      },
      rescheduleHistory: booking.rescheduleHistory,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    }));

    res.status(200).json({
      status: true,
      message: "Pending bookings retrieved successfully",
      bookings: formattedBookings,
      totalPending: pendingBookings.length
    });

  } catch (err) {
    console.error("❌ Error fetching pending bookings:", err);
    res.status(500).json({
      status: false,
      message: "Error retrieving pending bookings",
      error: err.message
    });
  }
};

// Get cancelled bookings
exports.getCancelledBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📋 Getting cancelled bookings for user: ${userId}`);

    const cancelledBookings = await Booking.find({ 
      user: userId,
      status: 'cancelled'
    })
      .populate('psychologist', 'name specialization clinicName state image rating experienceYears hourlyRate email phone')
      .sort({ cancelledAt: -1 }); // Most recently cancelled first

    console.log(`✅ Found ${cancelledBookings.length} cancelled bookings`);

    // Add image URL and format the response
    const baseUrl = req.protocol + "://" + req.get("host");
    const formattedBookings = cancelledBookings.map(booking => ({
      id: booking._id,
      date: booking.date,
      time: booking.time,
      status: booking.status,
      bookingType: booking.bookingType,
      patientDetails: booking.patientDetails,
      psychologist: {
        ...booking.psychologist._doc,
        image: `${baseUrl}/uploads/psychologist/${booking.psychologist.image}`
      },
      cancelledAt: booking.cancelledAt,
      cancellationReason: booking.cancellationReason,
      rescheduleHistory: booking.rescheduleHistory,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    }));

    res.status(200).json({
      status: true,
      message: "Cancelled bookings retrieved successfully",
      bookings: formattedBookings,
      totalCancelled: cancelledBookings.length
    });

  } catch (err) {
    console.error("❌ Error fetching cancelled bookings:", err);
    res.status(500).json({
      status: false,
      message: "Error retrieving cancelled bookings",
      error: err.message
    });
  }
};

// Get rescheduled bookings
exports.getRescheduledBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📋 Getting rescheduled bookings for user: ${userId}`);

    const rescheduledBookings = await Booking.find({ 
      user: userId,
      status: 'rescheduled'
    })
      .populate('psychologist', 'name specialization clinicName state image rating experienceYears hourlyRate email phone')
      .sort({ updatedAt: -1 }); // Most recently rescheduled first

    console.log(`✅ Found ${rescheduledBookings.length} rescheduled bookings`);

    // Add image URL and format the response
    const baseUrl = req.protocol + "://" + req.get("host");
    const formattedBookings = rescheduledBookings.map(booking => ({
      id: booking._id,
      date: booking.date,
      time: booking.time,
      status: booking.status,
      bookingType: booking.bookingType,
      patientDetails: booking.patientDetails,
      psychologist: {
        ...booking.psychologist._doc,
        image: `${baseUrl}/uploads/psychologist/${booking.psychologist.image}`
      },
      rescheduleHistory: booking.rescheduleHistory,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    }));

    res.status(200).json({
      status: true,
      message: "Rescheduled bookings retrieved successfully",
      bookings: formattedBookings,
      totalRescheduled: rescheduledBookings.length
    });

  } catch (err) {
    console.error("❌ Error fetching rescheduled bookings:", err);
    res.status(500).json({
      status: false,
      message: "Error retrieving rescheduled bookings",
      error: err.message
    });
  }
};

// Get active bookings (pending, confirmed, rescheduled)
exports.getActiveBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📋 Getting active bookings for user: ${userId}`);

    const activeBookings = await Booking.find({ 
      user: userId,
      status: { $in: ['pending', 'confirmed', 'rescheduled'] }
    })
      .populate('psychologist', 'name specialization clinicName state image rating experienceYears hourlyRate email phone')
      .sort({ date: 1 }); // Earliest date first

    console.log(`✅ Found ${activeBookings.length} active bookings`);

    // Add image URL and format the response
    const baseUrl = req.protocol + "://" + req.get("host");
    const formattedBookings = activeBookings.map(booking => ({
      id: booking._id,
      date: booking.date,
      time: booking.time,
      status: booking.status,
      bookingType: booking.bookingType,
      psychologist: {
        ...booking.psychologist._doc,
        image: `${baseUrl}/uploads/psychologist/${booking.psychologist.image}`
      },
      rescheduleHistory: booking.rescheduleHistory,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    }));

    res.status(200).json({
      status: true,
      message: "Active bookings retrieved successfully",
      bookings: formattedBookings,
      totalActive: activeBookings.length
    });

  } catch (err) {
    console.error("❌ Error fetching active bookings:", err);
    res.status(500).json({
      status: false,
      message: "Error retrieving active bookings",
      error: err.message
    });
  }
};

// Get completed bookings
exports.getCompletedBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📋 Getting completed bookings for user: ${userId}`);

    const completedBookings = await Booking.find({ 
      user: userId,
      status: 'completed'
    })
      .populate('psychologist', 'name specialization clinicName state image rating experienceYears hourlyRate email phone')
      .sort({ date: -1 }); // Most recent first

    console.log(`✅ Found ${completedBookings.length} completed bookings`);

    // Add image URL and format the response
    const baseUrl = req.protocol + "://" + req.get("host");
    const formattedBookings = completedBookings.map(booking => ({
      id: booking._id,
      date: booking.date,
      time: booking.time,
      status: booking.status,
      bookingType: booking.bookingType,
      psychologist: {
        ...booking.psychologist._doc,
        image: `${baseUrl}/uploads/psychologist/${booking.psychologist.image}`
      },
      rescheduleHistory: booking.rescheduleHistory,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    }));

    res.status(200).json({
      status: true,
      message: "Completed bookings retrieved successfully",
      bookings: formattedBookings,
      totalCompleted: completedBookings.length
    });

  } catch (err) {
    console.error("❌ Error fetching completed bookings:", err);
    res.status(500).json({
      status: false,
      message: "Error retrieving completed bookings",
      error: err.message
    });
  }
};

// Get available dates for a psychologist (next 14 days)
exports.getAvailableDates = async (req, res) => {
  try {
    const { psychologistId } = req.params;
    console.log(`📅 Getting available dates for psychologist: ${psychologistId}`);

    // Validate psychologist exists
    const psychologist = await Psychologist.findById(psychologistId);
    if (!psychologist) {
      return res.status(404).json({
        status: false,
        message: "Psychologist not found"
      });
    }

    const availableDates = [];
    
    // Check next 14 days
    for (let i = 0; i < 14; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      
      // Check if psychologist works on this day
      if (psychologist.workingDays.includes(dayName)) {
        // Check if there are any available slots on this date
        try {
          const availableSlots = await TimeSlotService.getAvailableSlots(psychologistId, dateString);
          if (availableSlots.length > 0) {
            availableDates.push({
              date: dateString,
              dayName: dayName,
              availableSlots: availableSlots.length
            });
          }
        } catch (error) {
          console.log(`⚠️ No slots available for ${dateString}`);
        }
      }
    }

    console.log(`✅ Found ${availableDates.length} available dates`);

    res.status(200).json({
      status: true,
      message: "Available dates retrieved successfully",
      psychologist: {
        id: psychologist._id,
        name: psychologist.name,
        specialization: psychologist.specialization,
        clinicName: psychologist.clinicName
      },
      availableDates: availableDates
    });

  } catch (err) {
    console.error("❌ Error getting available dates:", err);
    res.status(500).json({
      status: false,
      message: "Error retrieving available dates",
      error: err.message
    });
  }
};

// Get available time slots for a specific date
exports.getAvailableTimes = async (req, res) => {
  try {
    const { psychologistId, date } = req.params;
    console.log(`🕐 Getting available times for psychologist ${psychologistId} on ${date}`);

    // Validate psychologist exists
    const psychologist = await Psychologist.findById(psychologistId);
    if (!psychologist) {
      return res.status(404).json({
        status: false,
        message: "Psychologist not found"
      });
    }

    // Get available slots for the date
    const availableSlots = await TimeSlotService.getAvailableSlots(psychologistId, date);

    console.log(`✅ Found ${availableSlots.length} available time slots`);

    res.status(200).json({
      status: true,
      message: "Available time slots retrieved successfully",
      date: date,
      dayName: new Date(date).toLocaleDateString('en-US', { weekday: 'long' }),
      psychologist: {
        id: psychologist._id,
        name: psychologist.name,
        specialization: psychologist.specialization,
        clinicName: psychologist.clinicName
      },
      availableSlots: availableSlots
    });

  } catch (err) {
    console.error("❌ Error getting available times:", err);
    res.status(500).json({
      status: false,
      message: "Error retrieving available time slots",
      error: err.message
    });
  }
};

// Create booking with patient details
exports.createBookingWithDetails = async (req, res) => {
  try {
    const { 
      psychologistId, 
      date, 
      time,
      patientDetails 
    } = req.body;
    
    const userId = req.user.id; // Extracted from JWT middleware

    console.log(`📝 Creating booking with patient details for user: ${userId}`);

    // Validate required fields
    if (!psychologistId || !date || !time || !patientDetails) {
      return res.status(400).json({
        status: false,
        message: "All fields are required: psychologistId, date, time, and patientDetails"
      });
    }

    // Validate patient details
    const { patientName, contactNumber, relationWithPatient, age } = patientDetails;
    
    if (!patientName || !contactNumber || !relationWithPatient || !age) {
      return res.status(400).json({
        status: false,
        message: "Patient details incomplete: name, contact, relation, and age are required"
      });
    }

    // Validate age
    if (age < 1 || age > 120) {
      return res.status(400).json({
        status: false,
        message: "Age must be between 1 and 120"
      });
    }

    // Check if slot is still available
    const isAvailable = await TimeSlotService.isSlotAvailable(psychologistId, date, time);
    if (!isAvailable) {
      return res.status(400).json({
        status: false,
        message: "Selected time slot is no longer available"
      });
    }

    // Create booking with patient details
    const newBooking = new Booking({
      user: userId,
      psychologist: psychologistId,
      date: new Date(date),
      time: time,
      patientDetails: {
        patientName: patientName.trim(),
        contactNumber: contactNumber.trim(),
        relationWithPatient: relationWithPatient,
        age: parseInt(age)
      },
      bookingMethod: 'manual' // Mark as manual booking
    });

    const savedBooking = await newBooking.save();

    // Get psychologist details for response
    const psychologist = await Psychologist.findById(psychologistId)
      .select('name specialization clinicName state image rating experienceYears hourlyRate');

    // Add image URL
    const baseUrl = req.protocol + "://" + req.get("host");
    const psychologistWithImage = {
      ...psychologist._doc,
      image: `${baseUrl}/uploads/psychologist/${psychologist.image}`
    };

    console.log(`✅ Booking created successfully with patient details`);

    res.status(201).json({
      status: true,
      message: 'Booking created successfully with patient details',
      booking: {
        id: savedBooking._id,
        date: savedBooking.date,
        time: savedBooking.time,
        status: savedBooking.status,
        patientDetails: savedBooking.patientDetails,
        createdAt: savedBooking.createdAt
      },
      psychologist: psychologistWithImage
    });

  } catch (err) {
    console.error("❌ Booking error:", err);
    res.status(500).json({ 
      status: false, 
      message: "Error creating booking",
      error: err.message 
    });
  }
};

// Get psychologist's patient count statistics
exports.getPsychologistPatientCount = async (req, res) => {
  try {
    const psychologistId = req.psychologist.id; // Extracted from JWT by auth middleware
    console.log(`👥 Getting patient count for psychologist: ${psychologistId}`);

    // Get total unique patients
    const totalUniquePatients = await Booking.aggregate([
      { $match: { psychologist: psychologistId } },
      { $group: { _id: '$user' } },
      { $count: 'totalPatients' }
    ]);

    // Get patients by booking status
    const patientsByStatus = await Booking.aggregate([
      { $match: { psychologist: psychologistId } },
      {
        $group: {
          _id: {
            user: '$user',
            status: '$status'
          }
        }
      },
      {
        $group: {
          _id: '$_id.status',
          patientCount: { $sum: 1 }
        }
      }
    ]);

    // Get patients by booking method (automatic vs manual)
    const patientsByMethod = await Booking.aggregate([
      { $match: { psychologist: psychologistId } },
      {
        $group: {
          _id: {
            user: '$user',
            bookingMethod: '$bookingMethod'
          }
        }
      },
      {
        $group: {
          _id: '$_id.bookingMethod',
          patientCount: { $sum: 1 }
        }
      }
    ]);

    // Get recent patients (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentPatients = await Booking.aggregate([
      { 
        $match: { 
          psychologist: psychologistId,
          createdAt: { $gte: thirtyDaysAgo }
        } 
      },
      { $group: { _id: '$user' } },
      { $count: 'recentPatients' }
    ]);

    // Convert arrays to objects for easier consumption
    const statusStats = patientsByStatus.reduce((acc, stat) => {
      acc[stat._id] = stat.patientCount;
      return acc;
    }, {});

    const methodStats = patientsByMethod.reduce((acc, stat) => {
      acc[stat._id] = stat.patientCount;
      return acc;
    }, {});

    const result = {
      totalUniquePatients: totalUniquePatients[0]?.totalPatients || 0,
      recentPatients: recentPatients[0]?.recentPatients || 0,
      patientsByStatus: statusStats,
      patientsByBookingMethod: methodStats
    };

    console.log(`✅ Patient count stats retrieved:`, result);

    res.status(200).json({
      status: true,
      message: "Patient count statistics retrieved successfully",
      data: result
    });

  } catch (err) {
    console.error("❌ Error fetching patient count:", err);
    res.status(500).json({
      status: false,
      message: "Error retrieving patient count statistics",
      error: err.message
    });
  }
};

// Get detailed patient list for psychologist
exports.getPsychologistPatientList = async (req, res) => {
  try {
    const psychologistId = req.psychologist.id;
    const { status, bookingMethod, limit = 50, page = 1 } = req.query;
    console.log(`📋 Getting patient list for psychologist: ${psychologistId}`);

    // Build match conditions
    const matchConditions = { psychologist: psychologistId };
    if (status) matchConditions.status = status;
    if (bookingMethod) matchConditions.bookingMethod = bookingMethod;

    // Get unique patients with their latest booking info
    const patients = await Booking.aggregate([
      { $match: matchConditions },
      {
        $sort: { createdAt: -1 } // Most recent first
      },
      {
        $group: {
          _id: '$user',
          latestBooking: { $first: '$$ROOT' },
          totalBookings: { $sum: 1 },
          firstBookingDate: { $min: '$createdAt' },
          lastBookingDate: { $max: '$createdAt' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      },
      {
        $project: {
          userId: '$_id',
          patientName: {
            $cond: {
              if: { $eq: ['$latestBooking.bookingMethod', 'manual'] },
              then: '$latestBooking.patientDetails.patientName',
              else: '$userInfo.fullName'
            }
          },
          contactNumber: {
            $cond: {
              if: { $eq: ['$latestBooking.bookingMethod', 'manual'] },
              then: '$latestBooking.patientDetails.contactNumber',
              else: '$userInfo.email'
            }
          },
          totalBookings: 1,
          firstBookingDate: 1,
          lastBookingDate: 1,
          latestBookingStatus: '$latestBooking.status',
          latestBookingMethod: '$latestBooking.bookingMethod',
          latestBookingDate: '$latestBooking.date'
        }
      },
      {
        $sort: { lastBookingDate: -1 }
      },
      {
        $skip: (parseInt(page) - 1) * parseInt(limit)
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    // Get total count for pagination
    const totalPatients = await Booking.aggregate([
      { $match: matchConditions },
      { $group: { _id: '$user' } },
      { $count: 'total' }
    ]);

    console.log(`✅ Found ${patients.length} patients for psychologist`);

    res.status(200).json({
      status: true,
      message: "Patient list retrieved successfully",
      data: {
        patients,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil((totalPatients[0]?.total || 0) / parseInt(limit)),
          totalPatients: totalPatients[0]?.total || 0,
          limit: parseInt(limit)
        }
      }
    });

  } catch (err) {
    console.error("❌ Error fetching patient list:", err);
    res.status(500).json({
      status: false,
      message: "Error retrieving patient list",
      error: err.message
    });
  }
};

// Get psychologist's total booking count
exports.getPsychologistBookingCount = async (req, res) => {
  try {
    const psychologistId = req.psychologist.id; // Extracted from JWT by auth middleware
    console.log(`📊 Getting booking count for psychologist: ${psychologistId}`);

    // Get total bookings count
    const totalBookings = await Booking.countDocuments({ psychologist: psychologistId });

    // Get bookings by status
    const bookingsByStatus = await Booking.aggregate([
      { $match: { psychologist: psychologistId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get bookings by booking method
    const bookingsByMethod = await Booking.aggregate([
      { $match: { psychologist: psychologistId } },
      {
        $group: {
          _id: '$bookingMethod',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent bookings (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentBookings = await Booking.countDocuments({
      psychologist: psychologistId,
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Get today's bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayBookings = await Booking.countDocuments({
      psychologist: psychologistId,
      date: { $gte: today, $lt: tomorrow }
    });

    // Get this week's bookings
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const thisWeekBookings = await Booking.countDocuments({
      psychologist: psychologistId,
      date: { $gte: startOfWeek }
    });

    // Get this month's bookings
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const thisMonthBookings = await Booking.countDocuments({
      psychologist: psychologistId,
      date: { $gte: startOfMonth }
    });

    // Convert arrays to objects for easier consumption
    const statusStats = bookingsByStatus.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    const methodStats = bookingsByMethod.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    const result = {
      totalBookings,
      recentBookings,
      todayBookings,
      thisWeekBookings,
      thisMonthBookings,
      bookingsByStatus: statusStats,
      bookingsByBookingMethod: methodStats
    };

    console.log(`✅ Booking count stats retrieved:`, result);

    res.status(200).json({
      status: true,
      message: "Booking count statistics retrieved successfully",
      data: result
    });

  } catch (err) {
    console.error("❌ Error fetching booking count:", err);
    res.status(500).json({
      status: false,
      message: "Error retrieving booking count statistics",
      error: err.message
    });
  }
};

// Get booking counts for all psychologists (Admin only)
exports.getAllPsychologistsBookingCount = async (req, res) => {
  try {
    console.log(`📊 Admin: Getting booking counts for all psychologists`);

    // Get all psychologists with their booking counts
    const psychologistsWithBookings = await Booking.aggregate([
      {
        $group: {
          _id: '$psychologist',
          totalBookings: { $sum: 1 },
          pendingBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          confirmedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
          },
          completedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          rescheduledBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'rescheduled'] }, 1, 0] }
          },
          automaticBookings: {
            $sum: { $cond: [{ $eq: ['$bookingMethod', 'automatic'] }, 1, 0] }
          },
          manualBookings: {
            $sum: { $cond: [{ $eq: ['$bookingMethod', 'manual'] }, 1, 0] }
          },
          recentBookings: {
            $sum: {
              $cond: [
                { $gte: ['$createdAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
                1,
                0
              ]
            }
          },
          todayBookings: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ['$date', new Date(new Date().setHours(0, 0, 0, 0))] },
                    { $lt: ['$date', new Date(new Date().setHours(23, 59, 59, 999))] }
                  ]
                },
                1,
                0
              ]
            }
          },
          thisWeekBookings: {
            $sum: {
              $cond: [
                { $gte: ['$date', new Date(new Date().setDate(new Date().getDate() - new Date().getDay()))] },
                1,
                0
              ]
            }
          },
          thisMonthBookings: {
            $sum: {
              $cond: [
                { $gte: ['$date', new Date(new Date().getFullYear(), new Date().getMonth(), 1)] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'psychologists',
          localField: '_id',
          foreignField: '_id',
          as: 'psychologistInfo'
        }
      },
      {
        $unwind: '$psychologistInfo'
      },
      {
        $project: {
          psychologistId: '$_id',
          psychologistName: '$psychologistInfo.name',
          specialization: '$psychologistInfo.specialization',
          state: '$psychologistInfo.state',
          clinicName: '$psychologistInfo.clinicName',
          rating: '$psychologistInfo.rating',
          experienceYears: '$psychologistInfo.experienceYears',
          available: '$psychologistInfo.available',
          totalBookings: 1,
          pendingBookings: 1,
          confirmedBookings: 1,
          completedBookings: 1,
          cancelledBookings: 1,
          rescheduledBookings: 1,
          automaticBookings: 1,
          manualBookings: 1,
          recentBookings: 1,
          todayBookings: 1,
          thisWeekBookings: 1,
          thisMonthBookings: 1
        }
      },
      {
        $sort: { totalBookings: -1 } // Sort by total bookings (highest first)
      }
    ]);

    // Get overall statistics
    const overallStats = await Booking.aggregate([
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalPsychologists: { $addToSet: '$psychologist' }
        }
      },
      {
        $project: {
          _id: 0,
          totalBookings: 1,
          totalPsychologists: { $size: '$totalPsychologists' }
        }
      }
    ]);

    // Get bookings by status across all psychologists
    const overallStatusStats = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get bookings by method across all psychologists
    const overallMethodStats = await Booking.aggregate([
      {
        $group: {
          _id: '$bookingMethod',
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert arrays to objects
    const statusStats = overallStatusStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    const methodStats = overallMethodStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    const result = {
      psychologists: psychologistsWithBookings,
      overallStats: {
        ...overallStats[0],
        bookingsByStatus: statusStats,
        bookingsByMethod: methodStats
      },
      summary: {
        totalPsychologists: psychologistsWithBookings.length,
        totalBookings: overallStats[0]?.totalBookings || 0,
        averageBookingsPerPsychologist: overallStats[0]?.totalBookings 
          ? Math.round((overallStats[0].totalBookings / psychologistsWithBookings.length) * 100) / 100 
          : 0
      }
    };

    console.log(`✅ Admin: Retrieved booking counts for ${psychologistsWithBookings.length} psychologists`);

    res.status(200).json({
      status: true,
      message: "All psychologists booking counts retrieved successfully",
      data: result
    });

  } catch (err) {
    console.error("❌ Error fetching all psychologists booking counts:", err);
    res.status(500).json({
      status: false,
      message: "Error retrieving all psychologists booking counts",
      error: err.message
    });
  }
};

// Get booking count for a specific psychologist (Admin only)
exports.getSpecificPsychologistBookingCount = async (req, res) => {
  try {
    const { psychologistId } = req.params;
    console.log(`📊 Admin: Getting booking count for psychologist: ${psychologistId}`);

    // Validate psychologist ID
    if (!psychologistId) {
      return res.status(400).json({
        status: false,
        message: "Psychologist ID is required"
      });
    }

    // Check if psychologist exists
    const psychologist = await Psychologist.findById(psychologistId);
    if (!psychologist) {
      return res.status(404).json({
        status: false,
        message: "Psychologist not found"
      });
    }

    // Get total bookings count
    const totalBookings = await Booking.countDocuments({ psychologist: psychologistId });

    // Get bookings by status
    const bookingsByStatus = await Booking.aggregate([
      { $match: { psychologist: psychologistId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get bookings by booking method
    const bookingsByMethod = await Booking.aggregate([
      { $match: { psychologist: psychologistId } },
      {
        $group: {
          _id: '$bookingMethod',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent bookings (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentBookings = await Booking.countDocuments({
      psychologist: psychologistId,
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Get today's bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayBookings = await Booking.countDocuments({
      psychologist: psychologistId,
      date: { $gte: today, $lt: tomorrow }
    });

    // Get this week's bookings
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const thisWeekBookings = await Booking.countDocuments({
      psychologist: psychologistId,
      date: { $gte: startOfWeek }
    });

    // Get this month's bookings
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const thisMonthBookings = await Booking.countDocuments({
      psychologist: psychologistId,
      date: { $gte: startOfMonth }
    });

    // Convert arrays to objects for easier consumption
    const statusStats = bookingsByStatus.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    const methodStats = bookingsByMethod.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    const result = {
      psychologist: {
        id: psychologist._id,
        name: psychologist.name,
        specialization: psychologist.specialization,
        state: psychologist.state,
        clinicName: psychologist.clinicName,
        rating: psychologist.rating,
        experienceYears: psychologist.experienceYears,
        available: psychologist.available
      },
      bookingStats: {
        totalBookings,
        recentBookings,
        todayBookings,
        thisWeekBookings,
        thisMonthBookings,
        bookingsByStatus: statusStats,
        bookingsByBookingMethod: methodStats
      }
    };

    console.log(`✅ Admin: Booking count stats retrieved for psychologist: ${psychologist.name}`);

    res.status(200).json({
      status: true,
      message: "Psychologist booking count statistics retrieved successfully",
      data: result
    });

  } catch (err) {
    console.error("❌ Error fetching specific psychologist booking count:", err);
    res.status(500).json({
      status: false,
      message: "Error retrieving psychologist booking count statistics",
      error: err.message
    });
  }
};

// Get all bookings with details for admin (Admin only)
exports.getAllBookingsForAdmin = async (req, res) => {
  try {
    const { 
      status, 
      date, 
      psychologistId, 
      userId, 
      bookingMethod,
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = req.query;
    
    console.log(`📊 Admin: Getting all bookings with filters:`, req.query);

    // Build filter object
    const filter = {};
    
    // Add status filter if provided
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    // Add date filter if provided
    if (date) {
      filter.date = {
        $gte: new Date(date + 'T00:00:00.000Z'),
        $lt: new Date(date + 'T23:59:59.999Z')
      };
    }

    // Add psychologist filter if provided
    if (psychologistId) {
      filter.psychologist = psychologistId;
    }

    // Add user filter if provided
    if (userId) {
      filter.user = userId;
    }

    // Add booking method filter if provided
    if (bookingMethod && bookingMethod !== 'all') {
      filter.bookingMethod = bookingMethod;
    }

    // Add search filter if provided
    if (search) {
      // Search in user name, psychologist name, or booking ID
      filter.$or = [
        { _id: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sortObject = {};
    sortObject[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get bookings with pagination and population
    const bookings = await Booking.find(filter)
      .populate('user', 'fullName email phone')
      .populate('psychologist', 'name specialization clinicName state image rating experienceYears hourlyRate email phone')
      .sort(sortObject)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalBookings = await Booking.countDocuments(filter);

    console.log(`✅ Admin: Found ${bookings.length} bookings (page ${page})`);

    // Add image URL and format the response
    const baseUrl = req.protocol + "://" + req.get("host");
    const formattedBookings = bookings.map(booking => ({
      id: booking._id,
      date: booking.date,
      time: booking.time,
      status: booking.status,
      bookingType: booking.bookingType,
      bookingMethod: booking.bookingMethod,
      patientDetails: booking.patientDetails,
      user: booking.user,
      psychologist: booking.psychologist ? {
        ...booking.psychologist._doc,
        image: booking.psychologist.image ? `${baseUrl}/uploads/psychologist/${booking.psychologist.image}` : null
      } : null,
      rescheduleHistory: booking.rescheduleHistory,
      cancelledAt: booking.cancelledAt,
      cancellationReason: booking.cancellationReason,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    }));

    // Get comprehensive statistics
    const stats = await Booking.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get booking method statistics
    const methodStats = await Booking.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$bookingMethod',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent bookings (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentBookings = await Booking.countDocuments({
      ...filter,
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Get today's bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayBookings = await Booking.countDocuments({
      ...filter,
      date: { $gte: today, $lt: tomorrow }
    });

    // Get this week's bookings
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const thisWeekBookings = await Booking.countDocuments({
      ...filter,
      date: { $gte: startOfWeek }
    });

    // Get this month's bookings
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const thisMonthBookings = await Booking.countDocuments({
      ...filter,
      date: { $gte: startOfMonth }
    });

    // Convert arrays to objects
    const statusStats = stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    const bookingMethodStats = methodStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    // Get unique users and psychologists count
    const uniqueCounts = await Booking.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          uniqueUsers: { $addToSet: '$user' },
          uniquePsychologists: { $addToSet: '$psychologist' }
        }
      },
      {
        $project: {
          _id: 0,
          uniqueUsers: { $size: '$uniqueUsers' },
          uniquePsychologists: { $size: '$uniquePsychologists' }
        }
      }
    ]);

    const result = {
      bookings: formattedBookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalBookings / parseInt(limit)),
        totalBookings: totalBookings,
        hasNextPage: skip + bookings.length < totalBookings,
        hasPrevPage: parseInt(page) > 1,
        limit: parseInt(limit)
      },
      statistics: {
        totalBookings: totalBookings,
        recentBookings: recentBookings,
        todayBookings: todayBookings,
        thisWeekBookings: thisWeekBookings,
        thisMonthBookings: thisMonthBookings,
        uniqueUsers: uniqueCounts[0]?.uniqueUsers || 0,
        uniquePsychologists: uniqueCounts[0]?.uniquePsychologists || 0,
        bookingsByStatus: statusStats,
        bookingsByMethod: bookingMethodStats
      },
      filters: {
        status: status || 'all',
        date: date || null,
        psychologistId: psychologistId || null,
        userId: userId || null,
        bookingMethod: bookingMethod || 'all',
        search: search || null
      },
      sorting: {
        sortBy: sortBy,
        sortOrder: sortOrder
      }
    };

    console.log(`✅ Admin: Retrieved ${formattedBookings.length} bookings with comprehensive statistics`);

    res.status(200).json({
      status: true,
      message: "All bookings retrieved successfully for admin",
      data: result
    });

  } catch (err) {
    console.error("❌ Error fetching all bookings for admin:", err);
    res.status(500).json({
      status: false,
      message: "Error retrieving all bookings",
      error: err.message
    });
  }
};

// Get booking count summary for admin (Admin only)
exports.getBookingCountSummaryForAdmin = async (req, res) => {
  try {
    console.log(`📊 Admin: Getting booking count summary`);

    // Get total bookings count
    const totalBookings = await Booking.countDocuments();

    // Get bookings by status
    const bookingsByStatus = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get bookings by booking method
    const bookingsByMethod = await Booking.aggregate([
      {
        $group: {
          _id: '$bookingMethod',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent bookings (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentBookings = await Booking.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Get today's bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayBookings = await Booking.countDocuments({
      date: { $gte: today, $lt: tomorrow }
    });

    // Get this week's bookings
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const thisWeekBookings = await Booking.countDocuments({
      date: { $gte: startOfWeek }
    });

    // Get this month's bookings
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const thisMonthBookings = await Booking.countDocuments({
      date: { $gte: startOfMonth }
    });

    // Get unique users and psychologists count
    const uniqueCounts = await Booking.aggregate([
      {
        $group: {
          _id: null,
          uniqueUsers: { $addToSet: '$user' },
          uniquePsychologists: { $addToSet: '$psychologist' }
        }
      },
      {
        $project: {
          _id: 0,
          uniqueUsers: { $size: '$uniqueUsers' },
          uniquePsychologists: { $size: '$uniquePsychologists' }
        }
      }
    ]);

    // Get bookings by date (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const dailyBookings = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Convert arrays to objects
    const statusStats = bookingsByStatus.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    const methodStats = bookingsByMethod.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    const result = {
      summary: {
        totalBookings: totalBookings,
        uniqueUsers: uniqueCounts[0]?.uniqueUsers || 0,
        uniquePsychologists: uniqueCounts[0]?.uniquePsychologists || 0,
        averageBookingsPerUser: uniqueCounts[0]?.uniqueUsers 
          ? Math.round((totalBookings / uniqueCounts[0].uniqueUsers) * 100) / 100 
          : 0,
        averageBookingsPerPsychologist: uniqueCounts[0]?.uniquePsychologists 
          ? Math.round((totalBookings / uniqueCounts[0].uniquePsychologists) * 100) / 100 
          : 0
      },
      recentActivity: {
        recentBookings: recentBookings,
        todayBookings: todayBookings,
        thisWeekBookings: thisWeekBookings,
        thisMonthBookings: thisMonthBookings
      },
      breakdown: {
        bookingsByStatus: statusStats,
        bookingsByMethod: methodStats
      },
      dailyTrend: dailyBookings
    };

    console.log(`✅ Admin: Retrieved booking count summary`);

    res.status(200).json({
      status: true,
      message: "Booking count summary retrieved successfully for admin",
      data: result
    });

  } catch (err) {
    console.error("❌ Error fetching booking count summary for admin:", err);
    res.status(500).json({
      status: false,
      message: "Error retrieving booking count summary",
      error: err.message
    });
  }
};

// Get all booking details for a specific psychologist (Admin only)
exports.getSpecificPsychologistBookings = async (req, res) => {
  try {
    const { psychologistId } = req.params;
    const { 
      status, 
      date, 
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = req.query;
    
    console.log(`📊 Admin: Getting all booking details for psychologist: ${psychologistId}`);

    // Validate psychologist ID
    if (!psychologistId) {
      return res.status(400).json({
        status: false,
        message: "Psychologist ID is required"
      });
    }

    // Check if psychologist exists
    const psychologist = await Psychologist.findById(psychologistId);
    if (!psychologist) {
      return res.status(404).json({
        status: false,
        message: "Psychologist not found"
      });
    }

    // Build filter object
    const filter = { psychologist: psychologistId };
    
    // Add status filter if provided
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    // Add date filter if provided
    if (date) {
      filter.date = {
        $gte: new Date(date + 'T00:00:00.000Z'),
        $lt: new Date(date + 'T23:59:59.999Z')
      };
    }

    // Add search filter if provided
    if (search) {
      // Search in user name, booking ID, or patient details
      filter.$or = [
        { _id: { $regex: search, $options: 'i' } },
        { 'patientDetails.patientName': { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sortObject = {};
    sortObject[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get bookings with pagination and population
    const bookings = await Booking.find(filter)
      .populate('user', 'fullName email phone')
      .sort(sortObject)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalBookings = await Booking.countDocuments(filter);

    console.log(`✅ Admin: Found ${bookings.length} bookings for psychologist: ${psychologist.name}`);

    // Format the response
    const formattedBookings = bookings.map(booking => ({
      id: booking._id,
      date: booking.date,
      time: booking.time,
      status: booking.status,
      bookingType: booking.bookingType,
      bookingMethod: booking.bookingMethod,
      patientDetails: booking.patientDetails,
      user: booking.user,
      rescheduleHistory: booking.rescheduleHistory,
      cancelledAt: booking.cancelledAt,
      cancellationReason: booking.cancellationReason,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    }));

    // Get comprehensive statistics for this psychologist
    const stats = await Booking.aggregate([
      { $match: { psychologist: psychologistId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get booking method statistics
    const methodStats = await Booking.aggregate([
      { $match: { psychologist: psychologistId } },
      {
        $group: {
          _id: '$bookingMethod',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent bookings (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentBookings = await Booking.countDocuments({
      psychologist: psychologistId,
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Get today's bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayBookings = await Booking.countDocuments({
      psychologist: psychologistId,
      date: { $gte: today, $lt: tomorrow }
    });

    // Get this week's bookings
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const thisWeekBookings = await Booking.countDocuments({
      psychologist: psychologistId,
      date: { $gte: startOfWeek }
    });

    // Get this month's bookings
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const thisMonthBookings = await Booking.countDocuments({
      psychologist: psychologistId,
      date: { $gte: startOfMonth }
    });

    // Get unique users count
    const uniqueUsers = await Booking.aggregate([
      { $match: { psychologist: psychologistId } },
      {
        $group: {
          _id: '$user'
        }
      },
      {
        $count: 'uniqueUsers'
      }
    ]);

    // Convert arrays to objects for easier consumption
    const statusStats = stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    const methodStatsObj = methodStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    const result = {
      psychologist: {
        id: psychologist._id,
        name: psychologist.name,
        specialization: psychologist.specialization,
        state: psychologist.state,
        clinicName: psychologist.clinicName,
        rating: psychologist.rating,
        experienceYears: psychologist.experienceYears,
        hourlyRate: psychologist.hourlyRate,
        email: psychologist.email,
        phone: psychologist.phone,
        available: psychologist.available
      },
      bookings: formattedBookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalBookings / parseInt(limit)),
        totalBookings: totalBookings,
        hasNextPage: skip + bookings.length < totalBookings,
        hasPrevPage: parseInt(page) > 1,
        limit: parseInt(limit)
      },
      statistics: {
        totalBookings: totalBookings,
        recentBookings: recentBookings,
        todayBookings: todayBookings,
        thisWeekBookings: thisWeekBookings,
        thisMonthBookings: thisMonthBookings,
        uniqueUsers: uniqueUsers[0]?.uniqueUsers || 0,
        bookingsByStatus: statusStats,
        bookingsByMethod: methodStatsObj
      },
      filters: {
        status: status || 'all',
        date: date || null,
        search: search || null
      },
      sorting: {
        sortBy: sortBy,
        sortOrder: sortOrder
      }
    };

    console.log(`✅ Admin: Retrieved ${formattedBookings.length} bookings for psychologist: ${psychologist.name}`);

    res.status(200).json({
      status: true,
      message: "Psychologist booking details retrieved successfully",
      data: result
    });

  } catch (err) {
    console.error("❌ Error fetching psychologist booking details:", err);
    res.status(500).json({
      status: false,
      message: "Error retrieving psychologist booking details",
      error: err.message
    });
  }
};
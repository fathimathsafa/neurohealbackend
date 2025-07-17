const Booking = require('../user_module/psychologist_booking/psychologist_booking_model');

class BookingStatusService {
  /**
   * Update booking status based on current date and time
   * - If date is past: mark as 'completed'
   * - If date is tomorrow: mark as 'upcoming'
   * - If date is today and time hasn't passed: mark as 'pending'
   * - If date is today and time has passed: mark as 'completed'
   */
  static async updateBookingStatuses() {
    try {
      console.log('🔄 Starting automatic booking status update...');
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Get current time in HH:MM format
      const currentTime = now.toTimeString().slice(0, 5);
      
      console.log(`📅 Current date: ${today.toISOString().split('T')[0]}`);
      console.log(`⏰ Current time: ${currentTime}`);
      
      // Update past bookings to completed
      const pastBookings = await Booking.updateMany(
        {
          date: { $lt: today },
          status: { $in: ['pending', 'confirmed', 'rescheduled'] }
        },
        {
          $set: { status: 'completed' }
        }
      );
      
      // Update tomorrow's bookings to upcoming
      const upcomingBookings = await Booking.updateMany(
        {
          date: {
            $gte: tomorrow,
            $lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
          },
          status: { $in: ['pending', 'confirmed', 'rescheduled'] }
        },
        {
          $set: { status: 'upcoming' }
        }
      );
      
      // Update today's bookings based on time
      const todayBookingsPastTime = await Booking.updateMany(
        {
          date: {
            $gte: today,
            $lt: tomorrow
          },
          time: { $lt: currentTime },
          status: { $in: ['pending', 'confirmed', 'rescheduled'] }
        },
        {
          $set: { status: 'completed' }
        }
      );
      
      const todayBookingsFutureTime = await Booking.updateMany(
        {
          date: {
            $gte: today,
            $lt: tomorrow
          },
          time: { $gte: currentTime },
          status: { $in: ['upcoming', 'confirmed', 'rescheduled'] }
        },
        {
          $set: { status: 'pending' }
        }
      );
      
      console.log(`✅ Status updates completed:`);
      console.log(`   - Past bookings marked as completed: ${pastBookings.modifiedCount}`);
      console.log(`   - Tomorrow's bookings marked as upcoming: ${upcomingBookings.modifiedCount}`);
      console.log(`   - Today's past time bookings marked as completed: ${todayBookingsPastTime.modifiedCount}`);
      console.log(`   - Today's future time bookings marked as pending: ${todayBookingsFutureTime.modifiedCount}`);
      
      return {
        pastBookings: pastBookings.modifiedCount,
        upcomingBookings: upcomingBookings.modifiedCount,
        todayCompleted: todayBookingsPastTime.modifiedCount,
        todayPending: todayBookingsFutureTime.modifiedCount
      };
      
    } catch (error) {
      console.error('❌ Error updating booking statuses:', error);
      throw error;
    }
  }
  
  /**
   * Get booking status based on current date and time (without updating database)
   */
  static getBookingStatus(bookingDate, bookingTime) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const bookingDateOnly = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate());
    const currentTime = now.toTimeString().slice(0, 5);
    
    // If booking date is in the past
    if (bookingDateOnly < today) {
      return 'completed';
    }
    
    // If booking date is tomorrow
    if (bookingDateOnly.getTime() === tomorrow.getTime()) {
      return 'upcoming';
    }
    
    // If booking date is today
    if (bookingDateOnly.getTime() === today.getTime()) {
      // If current time has passed the booking time
      if (currentTime > bookingTime) {
        return 'completed';
      } else {
        return 'pending';
      }
    }
    
    return 'upcoming';
  }
  
  /**
   * Update status for a specific booking
   */
  static async updateSingleBookingStatus(bookingId) {
    try {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }
      
      const newStatus = this.getBookingStatus(booking.date, booking.time);
      
      if (newStatus !== booking.status) {
        await Booking.findByIdAndUpdate(bookingId, { status: newStatus });
        console.log(`✅ Updated booking ${bookingId} status from ${booking.status} to ${newStatus}`);
        return { oldStatus: booking.status, newStatus };
      }
      
      return { oldStatus: booking.status, newStatus: booking.status };
      
    } catch (error) {
      console.error('❌ Error updating single booking status:', error);
      throw error;
    }
  }
  
  /**
   * Get bookings with calculated status (without updating database)
   */
  static async getBookingsWithCalculatedStatus(userId = null, psychologistId = null) {
    try {
      let query = {};
      if (userId) query.user = userId;
      if (psychologistId) query.psychologist = psychologistId;
      
      const bookings = await Booking.find(query)
        .populate('psychologist', 'name specialization clinicName state image rating experienceYears hourlyRate email phone')
        .populate('user', 'fullName email phone')
        .sort({ date: 1, time: 1 });
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const currentTime = now.toTimeString().slice(0, 5);
      
      const bookingsWithCalculatedStatus = bookings.map(booking => {
        const bookingDateOnly = new Date(booking.date.getFullYear(), booking.date.getMonth(), booking.date.getDate());
        let calculatedStatus = booking.status;
        
        // Calculate status based on current date/time
        if (bookingDateOnly < today) {
          calculatedStatus = 'completed';
        } else if (bookingDateOnly.getTime() === tomorrow.getTime()) {
          calculatedStatus = 'upcoming';
        } else if (bookingDateOnly.getTime() === today.getTime()) {
          if (currentTime > booking.time) {
            calculatedStatus = 'completed';
          } else {
            calculatedStatus = 'pending';
          }
        } else if (bookingDateOnly > tomorrow) {
          calculatedStatus = 'upcoming';
        }
        
        // Return the booking object with calculated status, preserving populated fields
        return {
          ...booking.toObject(), // Use toObject() instead of _doc to preserve populated fields
          calculatedStatus,
          originalStatus: booking.status
        };
      });
      
      return bookingsWithCalculatedStatus;
      
    } catch (error) {
      console.error('❌ Error getting bookings with calculated status:', error);
      throw error;
    }
  }
}

module.exports = BookingStatusService; 
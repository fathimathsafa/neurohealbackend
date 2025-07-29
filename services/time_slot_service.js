const Booking = require('../user_module/psychologist_booking/psychologist_booking_model');

class TimeSlotService {
  
  /**
   * Generate available time slots for a psychologist on a specific date
   */
  static generateTimeSlots(psychologist, date) {
    try {
      console.log(`🕐 Generating time slots for ${psychologist.name} on ${date}`);
      
      const targetDate = new Date(date);
      const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
      
      // Check if psychologist works on this day
      if (!psychologist.workingDays.includes(dayName)) {
        console.log(`❌ ${psychologist.name} doesn't work on ${dayName}`);
        return [];
      }
      
      const slots = [];
      const startTime = new Date(targetDate);
      const [startHour, startMinute] = psychologist.workingHours.start.split(':');
      startTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);
      
      const endTime = new Date(targetDate);
      const [endHour, endMinute] = psychologist.workingHours.end.split(':');
      endTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);
      
      const sessionDuration = psychologist.sessionDuration || 60; // minutes
      const breakTime = psychologist.breakTime || 15; // minutes
      const totalSlotDuration = sessionDuration + breakTime; // minutes
      
      let currentSlot = new Date(startTime);
      
      while (currentSlot < endTime) {
        const slotEnd = new Date(currentSlot.getTime() + sessionDuration * 60000);
        
        if (slotEnd <= endTime) {
          slots.push({
            startTime: currentSlot.toTimeString().slice(0, 5), // HH:MM format
            endTime: slotEnd.toTimeString().slice(0, 5),
            date: targetDate.toISOString().split('T')[0],
            dayName: dayName
          });
        }
        
        // Move to next slot
        currentSlot = new Date(currentSlot.getTime() + totalSlotDuration * 60000);
      }
      
      console.log(`✅ Generated ${slots.length} time slots`);
      return slots;
      
    } catch (error) {
      console.error('❌ Error generating time slots:', error);
      return [];
    }
  }
  
  /**
   * Get available time slots for a psychologist on a specific date
   */
  static async getAvailableSlots(psychologistId, date) {
    try {
      console.log(`🔍 Getting available slots for psychologist ${psychologistId} on ${date}`);
      
      // Get psychologist details
      const Psychologist = require('../admin_module/psychologist_adding/psychologist_adding_model');
      const psychologist = await Psychologist.findById(psychologistId);
      
      if (!psychologist) {
        throw new Error('Psychologist not found');
      }
      
      // Generate all possible slots
      const allSlots = this.generateTimeSlots(psychologist, date);
      
      // Get booked slots for this date
      const bookedSlots = await Booking.find({
        psychologist: psychologistId,
        date: {
          $gte: new Date(date + 'T00:00:00.000Z'),
          $lt: new Date(date + 'T23:59:59.999Z')
        },
        status: { $in: ['pending', 'confirmed'] }
      }).select('time');
      
      console.log(`📅 Found ${bookedSlots.length} booked slots`);
      
      // Filter out booked slots
      const bookedTimes = bookedSlots.map(booking => booking.time);
      const availableSlots = allSlots.filter(slot => 
        !bookedTimes.includes(slot.startTime)
      );
      
      console.log(`✅ Found ${availableSlots.length} available slots`);
      return availableSlots;
      
    } catch (error) {
      console.error('❌ Error getting available slots:', error);
      throw error;
    }
  }
  
  /**
   * Get available slots for next 7 days
   */
  static async getAvailableSlotsForWeek(psychologistId) {
    try {
      const slots = {};
      
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        
        try {
          const daySlots = await this.getAvailableSlots(psychologistId, dateString);
          if (daySlots.length > 0) {
            slots[dateString] = daySlots;
          }
        } catch (error) {
          console.log(`⚠️ No slots available for ${dateString}`);
        }
      }
      
      return slots;
      
    } catch (error) {
      console.error('❌ Error getting weekly slots:', error);
      throw error;
    }
  }
  
  /**
   * Check if a specific time slot is available
   */
  static async isSlotAvailable(psychologistId, date, time) {
    try {
      const availableSlots = await this.getAvailableSlots(psychologistId, date);
      return availableSlots.some(slot => slot.startTime === time);
      
    } catch (error) {
      console.error('❌ Error checking slot availability:', error);
      return false;
    }
  }
  
  /**
   * Debug function to show all available slots for next few days
   */
  static async debugAvailableSlots(psychologistId) {
    try {
      console.log(`🔍 Debug: Checking available slots for psychologist ${psychologistId}`);
      
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      const today = now.toISOString().split('T')[0];
      
      console.log(`🕐 Current time: ${currentTime}, Today: ${today}`);
      
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        
        const availableSlots = await this.getAvailableSlots(psychologistId, dateString);
        
        if (availableSlots.length > 0) {
          console.log(`📅 ${dateString} (${i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : `Day ${i+1}`}): ${availableSlots.length} slots available`);
          console.log(`   Times: ${availableSlots.map(s => s.startTime).join(', ')}`);
          
          if (dateString === today) {
            const bufferTime = new Date(now.getTime() + (2 * 60 * 60 * 1000));
            const bufferTimeString = bufferTime.toTimeString().slice(0, 5);
            const futureSlots = availableSlots.filter(slot => slot.startTime > bufferTimeString);
            console.log(`   After ${bufferTimeString} buffer: ${futureSlots.length} slots`);
            console.log(`   Future times: ${futureSlots.map(s => s.startTime).join(', ')}`);
          }
        } else {
          console.log(`📅 ${dateString} (${i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : `Day ${i+1}`}): No slots available`);
        }
      }
      
    } catch (error) {
      console.error('❌ Error in debug function:', error);
    }
  }

  /**
   * Get next available slot for a psychologist
   */
  static async getNextAvailableSlot(psychologistId) {
    try {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      const today = now.toISOString().split('T')[0];
      
      console.log(`🕐 Current time: ${currentTime}, Today: ${today}`);
      
      for (let i = 0; i < 14; i++) { // Check next 14 days
        const date = new Date();
        date.setDate(date.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        
        const availableSlots = await this.getAvailableSlots(psychologistId, dateString);
        
        if (availableSlots.length > 0) {
          // If it's today, filter out past time slots and add buffer time
          if (dateString === today) {
            // Add 2 hours buffer to current time to avoid booking too soon
            const bufferTime = new Date(now.getTime() + (2 * 60 * 60 * 1000)); // 2 hours from now
            const bufferTimeString = bufferTime.toTimeString().slice(0, 5);
            
            const futureSlots = availableSlots.filter(slot => slot.startTime > bufferTimeString);
            if (futureSlots.length > 0) {
              console.log(`✅ Found ${futureSlots.length} future slots today (after ${bufferTimeString}) at: ${futureSlots[0].startTime}`);
              return {
                date: dateString,
                slots: futureSlots
              };
            }
          } else {
            // For future dates, return all available slots
            console.log(`✅ Found ${availableSlots.length} slots for ${dateString} at: ${availableSlots[0].startTime}`);
            return {
              date: dateString,
              slots: availableSlots
            };
          }
        }
      }
      
      console.log(`❌ No available slots found in next 14 days`);
      return null; // No available slots in next 14 days
      
    } catch (error) {
      console.error('❌ Error getting next available slot:', error);
      throw error;
    }
  }
}

module.exports = TimeSlotService; 
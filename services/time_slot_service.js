const Booking = require('../user_module/psychologist_booking/psychologist_booking_model');

class TimeSlotService {
  
  /**
   * Convert 24-hour time to 12-hour format with AM/PM
   */
  static formatTime12Hour(time24) {
    try {
      const [hours, minutes] = time24.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch (error) {
      console.error('❌ Error formatting time:', error);
      return time24; // Return original if formatting fails
    }
  }

  /**
   * Convert 12-hour time back to 24-hour format for database storage
   */
  static formatTime24Hour(time12) {
    try {
      const [time, ampm] = time12.split(' ');
      const [hours, minutes] = time.split(':');
      let hour = parseInt(hours);
      
      if (ampm === 'PM' && hour !== 12) {
        hour += 12;
      } else if (ampm === 'AM' && hour === 12) {
        hour = 0;
      }
      
      return `${hour.toString().padStart(2, '0')}:${minutes}`;
    } catch (error) {
      console.error('❌ Error converting time:', error);
      return time12; // Return original if conversion fails
    }
  }

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
          const startTime24 = currentSlot.toTimeString().slice(0, 5); // HH:MM format
          const endTime24 = slotEnd.toTimeString().slice(0, 5);
          
          slots.push({
            startTime: startTime24, // Keep 24-hour format for database operations
            endTime: endTime24,
            startTimeDisplay: this.formatTime12Hour(startTime24), // 12-hour format for display
            endTimeDisplay: this.formatTime12Hour(endTime24),
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
      let availableSlots = allSlots.filter(slot => 
        !bookedTimes.includes(slot.startTime)
      );
      
      // If it's today, filter out past time slots and add buffer time
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      if (date === today) {
        const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
        // Add 2 hours buffer to current time to avoid booking too soon
        const bufferTime = new Date(now.getTime() + (2 * 60 * 60 * 1000)); // 2 hours from now
        const bufferTimeString = bufferTime.toTimeString().slice(0, 5);
        
        console.log(`🕐 Current time: ${currentTime}, Buffer time: ${bufferTimeString}`);
        console.log(`📅 Before filtering: ${availableSlots.length} slots`);
        console.log(`🕐 All slot times: ${availableSlots.map(s => s.startTime).join(', ')}`);
        
        // Filter out slots that are in the past (including buffer time)
        availableSlots = availableSlots.filter(slot => {
          // Convert slot time to minutes for proper comparison
          const [slotHour, slotMinute] = slot.startTime.split(':').map(Number);
          const slotMinutes = slotHour * 60 + slotMinute;
          
          // Convert buffer time to minutes
          const [bufferHour, bufferMinute] = bufferTimeString.split(':').map(Number);
          const bufferMinutes = bufferHour * 60 + bufferMinute;
          
          const isFuture = slotMinutes > bufferMinutes;
          
          if (!isFuture) {
            console.log(`❌ Filtering out past slot: ${slot.startTime} (${slotMinutes} min) vs buffer: ${bufferTimeString} (${bufferMinutes} min)`);
          } else {
            console.log(`✅ Keeping future slot: ${slot.startTime} (${slotMinutes} min) vs buffer: ${bufferTimeString} (${bufferMinutes} min)`);
          }
          
          return isFuture;
        });
        
        console.log(`📅 After filtering past slots: ${availableSlots.length} slots available`);
        if (availableSlots.length > 0) {
          console.log(`🕐 Remaining slot times: ${availableSlots.map(s => s.startTime).join(', ')}`);
        }
      }
      
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
      const bufferTime = new Date(now.getTime() + (2 * 60 * 60 * 1000));
      const bufferTimeString = bufferTime.toTimeString().slice(0, 5);
      
      console.log(`🕐 Current time: ${currentTime}, Today: ${today}`);
      console.log(`🕐 Buffer time (2 hours from now): ${bufferTimeString}`);
      
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        
        const availableSlots = await this.getAvailableSlots(psychologistId, dateString);
        
        if (availableSlots.length > 0) {
          console.log(`📅 ${dateString} (${i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : `Day ${i+1}`}): ${availableSlots.length} slots available`);
          console.log(`   Times (24h): ${availableSlots.map(s => s.startTime).join(', ')}`);
          console.log(`   Times (12h): ${availableSlots.map(s => s.startTimeDisplay).join(', ')}`);
          
          if (dateString === today) {
            // Use proper time comparison for debug output
            const futureSlots = availableSlots.filter(slot => {
              const [slotHour, slotMinute] = slot.startTime.split(':').map(Number);
              const slotMinutes = slotHour * 60 + slotMinute;
              
              const [bufferHour, bufferMinute] = bufferTimeString.split(':').map(Number);
              const bufferMinutes = bufferHour * 60 + bufferMinute;
              
              return slotMinutes > bufferMinutes;
            });
            console.log(`   ✅ After ${bufferTimeString} buffer: ${futureSlots.length} future slots`);
            if (futureSlots.length > 0) {
              console.log(`   Future times (24h): ${futureSlots.map(s => s.startTime).join(', ')}`);
              console.log(`   Future times (12h): ${futureSlots.map(s => s.startTimeDisplay).join(', ')}`);
            }
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
      const today = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().slice(0, 5);
      
      console.log(`🕐 Current time: ${currentTime}, Today: ${today}`);
      
      for (let i = 0; i < 14; i++) { // Check next 14 days
        const date = new Date();
        date.setDate(date.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        
        const availableSlots = await this.getAvailableSlots(psychologistId, dateString);
        
        if (availableSlots.length > 0) {
          // Double-check: ensure we're not returning past slots
          const validSlots = availableSlots.filter(slot => {
            if (dateString === today) {
              const bufferTime = new Date(now.getTime() + (2 * 60 * 60 * 1000));
              const bufferTimeString = bufferTime.toTimeString().slice(0, 5);
              
              // Convert slot time to minutes for proper comparison
              const [slotHour, slotMinute] = slot.startTime.split(':').map(Number);
              const slotMinutes = slotHour * 60 + slotMinute;
              
              // Convert buffer time to minutes
              const [bufferHour, bufferMinute] = bufferTimeString.split(':').map(Number);
              const bufferMinutes = bufferHour * 60 + bufferMinute;
              
              const isValid = slotMinutes > bufferMinutes;
              
              if (!isValid) {
                console.log(`⚠️ Double-check: Filtering out past slot ${slot.startTime} (${slotMinutes} min) vs buffer: ${bufferTimeString} (${bufferMinutes} min)`);
              } else {
                console.log(`✅ Double-check: Valid future slot ${slot.startTime} (${slotMinutes} min) vs buffer: ${bufferTimeString} (${bufferMinutes} min)`);
              }
              
              return isValid;
            }
            return true; // For future dates, all slots are valid
          });
          
          if (validSlots.length > 0) {
            console.log(`✅ Found ${validSlots.length} valid slots for ${dateString}`);
            console.log(`🕐 First slot: ${validSlots[0].startTimeDisplay} (${validSlots[0].startTime})`);
            return {
              date: dateString,
              slots: validSlots
            };
          } else {
            console.log(`⚠️ All slots for ${dateString} were filtered out as past slots`);
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
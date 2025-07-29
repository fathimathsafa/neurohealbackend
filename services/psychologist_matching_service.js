const Psychologist = require('../admin_module/psychologist_adding/psychologist_adding_model');
const Booking = require('../user_module/psychologist_booking/psychologist_booking_model');
const TimeSlotService = require('./time_slot_service');

// Mapping from booking options to psychologist specializations
const bookingToSpecializationMap = {
  "Myself": "Counseling",
  "My child": "Child Psychology", 
  "Couples": "Couples Therapy",
  "My loved ones": "Family Therapy"
};

// Reverse mapping for getting specialization from booking type
const specializationToBookingMap = {
  "Counseling": "Myself",
  "Child Psychology": "My child",
  "Couples Therapy": "Couples",
  "Family Therapy": "My loved ones"
};

// Helper function to normalize state names
const normalizeState = (state) => {
  return state.trim().toLowerCase();
};

class PsychologistMatchingService {
  
  /**
   * Find the best available psychologist for a user based on their questionnaire responses
   */
  static async findBestPsychologist(userState, bookingFor, userId) {
    try {
      console.log(`🔍 Finding psychologist for: State=${userState}, Booking=${bookingFor}`);
      
      // Get the required specialization
      const requiredSpecialization = bookingToSpecializationMap[bookingFor];
      if (!requiredSpecialization) {
        throw new Error(`Invalid booking type: ${bookingFor}`);
      }

      // Normalize state name for case-insensitive matching
      const normalizedUserState = normalizeState(userState);

      // Find available psychologists in the user's state with matching specialization
      const availablePsychologists = await Psychologist.find({
        state: { $regex: new RegExp(`^${normalizedUserState}$`, 'i') },
        specialization: requiredSpecialization,
        available: true
      }).sort({ rating: -1, experienceYears: -1 }); // Sort by rating and experience

      if (availablePsychologists.length === 0) {
        console.log(`❌ No psychologists found for ${requiredSpecialization} in ${userState}`);
        
        // Try to find psychologists in nearby states or with similar specializations
        const fallbackPsychologists = await Psychologist.find({
          specialization: requiredSpecialization,
          available: true
        }).sort({ rating: -1, experienceYears: -1 }).limit(3);
        
        if (fallbackPsychologists.length === 0) {
          throw new Error(`No available psychologists found for ${requiredSpecialization}`);
        }
        
        console.log(`⚠️ Using fallback psychologist from different state`);
        return fallbackPsychologists[0];
      }

      console.log(`✅ Found ${availablePsychologists.length} available psychologists`);
      return availablePsychologists[0]; // Return the highest rated one
      
    } catch (error) {
      console.error('❌ Error finding psychologist:', error);
      throw error;
    }
  }

  /**
   * Create an automatic booking for the user with next available slot
   */
  static async createAutomaticBooking(userId, psychologistId, questionnaireData) {
    try {
      console.log(`📅 Creating automatic booking for user ${userId} with psychologist ${psychologistId}`);
      
      // Try to find and book a slot with retry logic
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        attempts++;
        console.log(`🔄 Attempt ${attempts}/${maxAttempts} to create automatic booking`);
        
        try {
          // Get fresh available slots for each attempt
          const nextSlot = await TimeSlotService.getNextAvailableSlot(psychologistId);
          
          if (!nextSlot) {
            throw new Error('No available slots found for this psychologist in the next 14 days');
          }
          
          console.log(`📅 Found ${nextSlot.slots.length} available slots for ${nextSlot.date}`);
          console.log(`🕐 Available times (12h): ${nextSlot.slots.map(s => s.startTimeDisplay).join(', ')}`);
          
          // Try each available slot until one works
          for (let i = 0; i < nextSlot.slots.length; i++) {
            const selectedSlot = nextSlot.slots[i];
            const bookingDate = new Date(nextSlot.date + 'T' + selectedSlot.startTime + ':00');
            
            console.log(`🎯 Trying slot ${i + 1}/${nextSlot.slots.length}: ${nextSlot.date} at ${selectedSlot.startTimeDisplay}`);
            
            // Quick check if slot is still available
            const existingBooking = await Booking.findOne({
              psychologist: psychologistId,
              date: {
                $gte: new Date(nextSlot.date + 'T00:00:00.000Z'),
                $lt: new Date(nextSlot.date + 'T23:59:59.999Z')
              },
              time: selectedSlot.startTime,
              status: { $in: ['pending', 'confirmed'] }
            });

            if (existingBooking) {
              console.log(`⚠️ Slot ${selectedSlot.startTimeDisplay} is taken, trying next slot...`);
              continue; // Try next slot
            }

            // Try to create the booking
            const newBooking = new Booking({
              user: userId,
              psychologist: psychologistId,
              date: bookingDate,
              time: selectedSlot.startTime,
              status: 'pending',
              questionnaireData: questionnaireData,
              bookingType: questionnaireData.bookingFor,
              bookingMethod: 'automatic'
            });

            const savedBooking = await newBooking.save();
            console.log(`✅ Automatic booking created successfully: ${savedBooking._id} for ${nextSlot.date} at ${selectedSlot.startTimeDisplay}`);
            return savedBooking;
            
          } // End of slot loop
          
          // If we get here, all slots for this date were taken
          console.log(`⚠️ All slots for ${nextSlot.date} were taken, will retry...`);
          
        } catch (error) {
          // Handle specific booking errors
          if (error.name === 'DuplicateBookingError' || error.code === 11000) {
            console.log(`⚠️ Duplicate booking error on attempt ${attempts}, retrying...`);
            continue; // Try again
          }
          
          // For other errors, throw immediately
          throw error;
        }
        
        // Small delay before retry to avoid overwhelming the database
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        }
      }
      
      // If we get here, all attempts failed
      throw new Error('Unable to find an available slot after multiple attempts. Please try again later.');
      
    } catch (error) {
      console.error('❌ Error creating automatic booking:', error);
      console.error('❌ Error creating automatic booking:', error);
      
      // Handle duplicate booking error from pre-save hook
      if (error.name === 'DuplicateBookingError') {
        throw new Error('This time slot is no longer available. Please try again.');
      }
      
      // Handle MongoDB duplicate key error
      if (error.code === 11000) {
        throw new Error('This time slot is no longer available. Please try again.');
      }
      
      throw error;
    }
  }

  /**
   * Get available time slots for a psychologist
   */
  static async getPsychologistSlots(psychologistId, date) {
    try {
      return await TimeSlotService.getAvailableSlots(psychologistId, date);
    } catch (error) {
      console.error('❌ Error getting psychologist slots:', error);
      throw error;
    }
  }

  /**
   * Get available slots for next week
   */
  static async getPsychologistWeeklySlots(psychologistId) {
    try {
      return await TimeSlotService.getAvailableSlotsForWeek(psychologistId);
    } catch (error) {
      console.error('❌ Error getting weekly slots:', error);
      throw error;
    }
  }

  /**
   * Get psychologist details with image URL
   */
  static async getPsychologistWithImage(psychologistId, req) {
    try {
      const psychologist = await Psychologist.findById(psychologistId);
      if (!psychologist) {
        throw new Error('Psychologist not found');
      }

      const baseUrl = req.protocol + "://" + req.get("host");
      return {
        ...psychologist._doc,
        image: `${baseUrl}/uploads/psychologist/${psychologist.image}`
      };
      
    } catch (error) {
      console.error('❌ Error getting psychologist details:', error);
      throw error;
    }
  }

  /**
   * Get all psychologists by specialization
   */
  static async getPsychologistsBySpecialization(specialization, req) {
    try {
      const psychologists = await Psychologist.find({ 
        specialization: specialization,
        available: true 
      }).sort({ rating: -1, experienceYears: -1 });

      const baseUrl = req.protocol + "://" + req.get("host");
      
      return psychologists.map(psychologist => ({
        ...psychologist._doc,
        image: `${baseUrl}/uploads/psychologist/${psychologist.image}`
      }));
      
    } catch (error) {
      console.error('❌ Error getting psychologists by specialization:', error);
      throw error;
    }
  }

  /**
   * Get booking statistics
   */
  static async getBookingStats() {
    try {
      const stats = await Booking.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      return stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {});
      
    } catch (error) {
      console.error('❌ Error getting booking stats:', error);
      throw error;
    }
  }

  /**
   * Get specialization from booking type
   */
  static getSpecializationFromBooking(bookingFor) {
    return bookingToSpecializationMap[bookingFor];
  }

  /**
   * Get booking type from specialization
   */
  static getBookingFromSpecialization(specialization) {
    return specializationToBookingMap[specialization];
  }

  /**
   * Enhanced psychologist matching with better state logic
   */
  static async findBestPsychologistEnhanced(userState, bookingFor, userId) {
    try {
      console.log(`🔍 Enhanced matching for: State=${userState}, Booking=${bookingFor}`);
      
      const requiredSpecialization = bookingToSpecializationMap[bookingFor];
      if (!requiredSpecialization) {
        throw new Error(`Invalid booking type: ${bookingFor}`);
      }

      // Normalize state name for case-insensitive matching
      const normalizedUserState = normalizeState(userState);
      console.log(`🔍 Normalized state: ${normalizedUserState}`);

      // Special logic for Kerala users - only book Kerala psychologists
      if (normalizedUserState === 'kerala') {
        console.log(`🔍 Kerala user detected - searching only Kerala psychologists`);
        
        // Step 1: Try to find in Kerala with exact specialization
        let psychologists = await Psychologist.find({
          state: { $regex: new RegExp(`^kerala$`, 'i') },
          specialization: requiredSpecialization,
          available: true
        }).sort({ rating: -1, experienceYears: -1 });

        if (psychologists.length > 0) {
          console.log(`✅ Found ${psychologists.length} Kerala psychologists with ${requiredSpecialization}`);
          return {
            psychologist: psychologists[0],
            matchType: 'kerala_exact',
            message: `Found ${requiredSpecialization} psychologist in Kerala`,
            shouldBook: true
          };
        }

        // Step 2: Try to find in Kerala with any specialization
        psychologists = await Psychologist.find({
          state: { $regex: new RegExp(`^kerala$`, 'i') },
          available: true
        }).sort({ rating: -1, experienceYears: -1 });

        if (psychologists.length > 0) {
          console.log(`⚠️ Found ${psychologists.length} Kerala psychologists (different specialization)`);
          return {
            psychologist: psychologists[0],
            matchType: 'kerala_state_only',
            message: `No ${requiredSpecialization} psychologists in Kerala. Found ${psychologists[0].specialization} psychologist instead.`,
            shouldBook: true
          };
        }

        // No Kerala psychologists available
        console.log(`❌ No psychologists found in Kerala`);
        return {
          psychologist: null,
          matchType: 'no_kerala_match',
          message: `No psychologists available in Kerala at the moment. Your questionnaire has been saved.`,
          shouldBook: false
        };
      }

      // For all other states - book any available psychologist
      console.log(`🔍 Non-Kerala user - searching all available psychologists`);
      
      // Step 1: Try to find any psychologist with exact specialization (any state)
      let psychologists = await Psychologist.find({
        specialization: requiredSpecialization,
        available: true
      }).sort({ rating: -1, experienceYears: -1 });

      if (psychologists.length > 0) {
        console.log(`✅ Found ${psychologists.length} psychologists with ${requiredSpecialization} (any state)`);
        return {
          psychologist: psychologists[0],
          matchType: 'any_state_exact',
          message: `Found ${requiredSpecialization} psychologist (${psychologists[0].state})`,
          shouldBook: true
        };
      }

      // Step 2: Try to find any available psychologist (any state, any specialization)
      psychologists = await Psychologist.find({
        available: true
      }).sort({ rating: -1, experienceYears: -1 });

      if (psychologists.length > 0) {
        console.log(`⚠️ Found ${psychologists.length} available psychologists (any state, any specialization)`);
        return {
          psychologist: psychologists[0],
          matchType: 'any_state_any_specialization',
          message: `No ${requiredSpecialization} psychologists available. Found ${psychologists[0].specialization} psychologist in ${psychologists[0].state}.`,
          shouldBook: true
        };
      }

      // No psychologists available anywhere
      console.log(`❌ No psychologists available anywhere`);
      return {
        psychologist: null,
        matchType: 'no_match_anywhere',
        message: `No psychologists available at the moment. Your questionnaire has been saved.`,
        shouldBook: false
      };
      
    } catch (error) {
      console.error('❌ Error in enhanced psychologist matching:', error);
      throw error;
    }
  }

  /**
   * Get all available psychologists for returning users
   */
  static async getAllAvailablePsychologists(req) {
    try {
      const psychologists = await Psychologist.find({ available: true })
        .sort({ rating: -1, experienceYears: -1 });

      const baseUrl = req.protocol + "://" + req.get("host");
      
      return psychologists.map(psychologist => ({
        ...psychologist._doc,
        image: `${baseUrl}/uploads/psychologist/${psychologist.image}`,
        bookingType: specializationToBookingMap[psychologist.specialization]
      }));
      
    } catch (error) {
      console.error('❌ Error getting all psychologists:', error);
      throw error;
    }
  }

  /**
   * Get psychologists by state
   */
  static async getPsychologistsByState(state, req) {
    try {
      // Normalize state name for case-insensitive matching
      const normalizedState = normalizeState(state);
      
      const psychologists = await Psychologist.find({ 
        state: { $regex: new RegExp(`^${normalizedState}$`, 'i') },
        available: true 
      }).sort({ rating: -1, experienceYears: -1 });

      const baseUrl = req.protocol + "://" + req.get("host");
      
      return psychologists.map(psychologist => ({
        ...psychologist._doc,
        image: `${baseUrl}/uploads/psychologist/${psychologist.image}`,
        bookingType: specializationToBookingMap[psychologist.specialization]
      }));
      
    } catch (error) {
      console.error('❌ Error getting psychologists by state:', error);
      throw error;
    }
  }
}

module.exports = PsychologistMatchingService; 
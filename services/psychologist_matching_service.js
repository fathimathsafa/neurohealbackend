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
      
      // Get next available slot for the psychologist
      const nextSlot = await TimeSlotService.getNextAvailableSlot(psychologistId);
      
      if (!nextSlot) {
        throw new Error('No available slots found for this psychologist in the next 14 days');
      }
      
      // Use the first available slot
      const selectedSlot = nextSlot.slots[0];
      const bookingDate = new Date(nextSlot.date + 'T' + selectedSlot.startTime + ':00');
      
      console.log(`📅 Selected slot: ${nextSlot.date} at ${selectedSlot.startTime}`);
      console.log(`🕐 Booking date/time: ${bookingDate.toISOString()}`);
      console.log(`📋 Total available slots: ${nextSlot.slots.length}`);
      
      const newBooking = new Booking({
        user: userId,
        psychologist: psychologistId,
        date: bookingDate,
        time: selectedSlot.startTime,
        status: 'pending',
        questionnaireData: questionnaireData,
        bookingType: questionnaireData.bookingFor,
        bookingMethod: 'automatic' // Mark as automatic booking
      });

      const savedBooking = await newBooking.save();
      console.log(`✅ Automatic booking created: ${savedBooking._id}`);
      
      return savedBooking;
      
    } catch (error) {
      console.error('❌ Error creating automatic booking:', error);
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

      // Step 1: Try to find in user's state with exact specialization (case-insensitive)
      let psychologists = await Psychologist.find({
        state: { $regex: new RegExp(`^${normalizedUserState}$`, 'i') },
        specialization: requiredSpecialization,
        available: true
      }).sort({ rating: -1, experienceYears: -1 });

      if (psychologists.length > 0) {
        console.log(`✅ Found ${psychologists.length} psychologists in ${userState} with ${requiredSpecialization}`);
        return {
          psychologist: psychologists[0],
          matchType: 'exact',
          message: `Found ${requiredSpecialization} psychologist in ${userState}`,
          shouldBook: true
        };
      }

      // Step 2: Try to find in user's state with any specialization (case-insensitive)
      psychologists = await Psychologist.find({
        state: { $regex: new RegExp(`^${normalizedUserState}$`, 'i') },
        available: true
      }).sort({ rating: -1, experienceYears: -1 });

      if (psychologists.length > 0) {
        console.log(`⚠️ Found ${psychologists.length} psychologists in ${userState} (different specialization)`);
        return {
          psychologist: psychologists[0],
          matchType: 'state_only',
          message: `No ${requiredSpecialization} psychologists in ${userState}. Found ${psychologists[0].specialization} psychologist instead.`,
          shouldBook: true
        };
      }

      // No psychologists found in user's state - don't book
      console.log(`❌ No psychologists found in ${userState}`);
      return {
        psychologist: null,
        matchType: 'no_match',
        message: `No psychologists available in ${userState}. Your questionnaire has been saved.`,
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
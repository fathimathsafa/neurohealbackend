const UserResponse = require('../questions/questions_model');
const PsychologistMatchingService = require('../../services/psychologist_matching_service');
const User = require('../../model/user.model');

// 28 Indian states
const states = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

// Booking options
const bookingOptions = ["Myself", "My child", "Couples", "My loved ones"];

// Follow-up questions with 4 options each
const followUpQuestions = {
  "Myself": [
     {
      question: "What is your age ?",
      options: ["18 to 30", "30 to 45", "45 to 60", "60 and above"]
    },
    {
      question: "what is your gender?",
      options: ["Male", "Female", "Transgender", "Not prefer to say"]
    },
    {
      question: "What is the main reason you are seeking support ?",
      options: ["Stress", "Anxiety", "Sleep issues", "None"]
    },
    {
      question: "What is your relationship status ?",
      options: ["Married", "Unmarried", "Living together", "None"]
    },
    {
      question: "What kind of therapy are you often to?",
      options: ["Talk Therapy ", "CBT", "Mindfulness Based", "Not sure"]
    }, 
  ],
  "My child": [
    {
      question: "What is your child's age range?",
      options: ["0-5", "6-10", "11-15", "16-18"]
    },
    {
      question: "What concerns do you have about your child ?",
      options: ["Behavioral", "Academic", "Emotional", "Other"]
    },{
      question: "what is your child's gender?",
      options: ["Male", "Female", "Transgender", "Not prefer to say"]
    },
  ],
  "Couples": [
    {
      question: "What is the main challenge?",
      options: ["Communication", "Trust", "Parenting", "Other"]
    },
    {
      question: "Are you attending the session together?",
      options: ["Yes", "No", "Not Sure", "Sometimes"]
    }
  ],
  "My loved ones": [
    {
      question: "What is your relation to the person?",
      options: ["Spouse", "Parent", "Sibling", "Friend"]
    },
    {
      question: "Are they aware of this consultation?",
      options: ["Yes", "No", "Not Sure", "Prefer not to say"]
    }, {
      question: "What concer are they facing?",
      options: ["Anxiety", "Brhavioural", "Depression", "Prefer not to say"]
    },{
      question: "Would you like to join the session?",
      options: ["Yes", "No", "Not Sure", "Prefer not to say"]
    },
  ]
};

// GET /api/questions/specializations
exports.getSpecializations = (req, res) => {
  const specializations = ['Counseling', 'Child Psychology', 'Couples Therapy', 'Family Therapy'];
  res.json(specializations);
};

// GET /api/questions/states
exports.getStates = (req, res) => {
  res.json(states);
};

// GET /api/questions/booking-options
exports.getBookingOptions = (req, res) => {
  res.json(bookingOptions);
};

// GET /api/questions/follow-up/:selectedOption
exports.getFollowUpQuestions = (req, res) => {
  const selectedOption = req.params.selectedOption;
  const questions = followUpQuestions[selectedOption];

  if (!questions) {
    return res.status(404).json({ error: "Invalid booking option" });
  }

  res.json(questions);
};

// GET /api/questions/user-status - Check if user is first-time
exports.getUserStatus = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Invalid authentication token" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      isFirstTimeUser: user.isFirstTimeUser,
      hasCompletedQuestionnaire: user.hasCompletedQuestionnaire,
      preferredState: user.preferredState,
      preferredSpecialization: user.preferredSpecialization
    });

  } catch (error) {
    console.error("❌ Error getting user status:", error);
    res.status(500).json({ error: "Failed to get user status", details: error.message });
  }
};

// POST /api/questions/submit - WITH AUTHENTICATION AND AUTOMATIC BOOKING
exports.saveResponses = async (req, res) => {
  try {
    console.log("📥 Received submission request");
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    console.log("User from token:", req.user);

    // Extract userId from authenticated user
    const userId = req.user?.id || req.user?._id || req.user?.userId;
    
    if (!userId) {
      console.log("❌ No userId found in token");
      return res.status(401).json({ error: "Invalid authentication token" });
    }

    const { state, bookingFor, followUpAnswers } = req.body;

    console.log("💾 Saving response for user:", userId);

    // Save questionnaire response
    const savedResponse = await UserResponse.create({
      userId,
      state,
      bookingFor,
      followUpAnswers
    });

    console.log("✅ Response saved successfully:", savedResponse);

    // 🎯 AUTOMATIC PSYCHOLOGIST MATCHING AND BOOKING (FIRST-TIME USERS ONLY)
    try {
      console.log("🔍 Starting automatic psychologist matching...");
      
      // Find the best psychologist for the user using enhanced matching
      const matchResult = await PsychologistMatchingService.findBestPsychologistEnhanced(
        state, 
        bookingFor, 
        userId
      );

      console.log("📋 Match type:", matchResult.matchType);
      console.log("💬 Message:", matchResult.message);
      console.log("🔐 Should book:", matchResult.shouldBook);

      // Update user status to mark as not first-time and save preferences
      await User.findByIdAndUpdate(userId, {
        isFirstTimeUser: false,
        hasCompletedQuestionnaire: true,
        preferredState: state,
        preferredSpecialization: PsychologistMatchingService.getSpecializationFromBooking(bookingFor)
      });

      // Only create booking if psychologist is found in user's state
      if (matchResult.shouldBook && matchResult.psychologist) {
        const matchedPsychologist = matchResult.psychologist;
        console.log("✅ Psychologist matched:", matchedPsychologist.name);

        // Create automatic booking
        const automaticBooking = await PsychologistMatchingService.createAutomaticBooking(
          userId,
          matchedPsychologist._id,
          {
            state,
            bookingFor,
            followUpAnswers
          }
        );

        // Get psychologist details with image URL
        const psychologistDetails = await PsychologistMatchingService.getPsychologistWithImage(
          matchedPsychologist._id,
          req
        );

        console.log("✅ Automatic booking completed successfully");

        // Return success response with booking details
        res.status(201).json({
          success: true,
          message: matchResult.message,
          isFirstTimeUser: false,
          matchType: matchResult.matchType,
          questionnaireResponse: savedResponse,
          booking: {
            id: automaticBooking._id,
            date: automaticBooking.date,
            time: automaticBooking.time,
            status: automaticBooking.status
          },
          psychologist: {
            id: psychologistDetails._id,
            name: psychologistDetails.name,
            specialization: psychologistDetails.specialization,
            clinicName: psychologistDetails.clinicName,
            state: psychologistDetails.state,
            image: psychologistDetails.image,
            rating: psychologistDetails.rating,
            experienceYears: psychologistDetails.experienceYears,
            hourlyRate: psychologistDetails.hourlyRate
          }
        });
      } else {
        // No psychologist in state - just save questionnaire
        console.log("✅ Questionnaire saved, no booking created");

        res.status(201).json({
          success: true,
          message: matchResult.message,
          isFirstTimeUser: false,
          matchType: matchResult.matchType,
          questionnaireResponse: savedResponse,
          booking: null,
          psychologist: null
        });
      }

    } catch (matchingError) {
      console.error("❌ Psychologist matching failed:", matchingError);
      
      // Still return success for questionnaire submission, but with error for booking
      res.status(201).json({
        success: true,
        message: "Questionnaire submitted successfully, but automatic booking failed",
        questionnaireResponse: savedResponse,
        bookingError: matchingError.message,
        suggestion: "Please contact support for manual booking assistance"
      });
    }
    
  } catch (error) {
    console.error("❌ Save Error:", error);
    res.status(500).json({ error: "Failed to save responses", details: error.message });
  }
};

// POST /api/questions/submit - WITHOUT AUTHENTICATION (for testing)
exports.saveResponsesNoAuth = async (req, res) => {
  try {
    console.log("📥 Received submission request (no auth)");
    console.log("Body:", req.body);

    const { state, bookingFor, followUpAnswers } = req.body;
    
    // Use a default userId for testing
    const userId = "test-user-id";

    console.log("💾 Saving response for test user:", userId);

    const savedResponse = await UserResponse.create({
      userId,
      state,
      bookingFor,
      followUpAnswers
    });

    console.log("✅ Response saved successfully:", savedResponse);
    res.status(201).json(savedResponse);
    
  } catch (error) {
    console.error("❌ Save Error:", error);
    res.status(500).json({ error: "Failed to save responses", details: error.message });
  }
};
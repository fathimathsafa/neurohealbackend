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

// Follow-up questions with expanded options
const followUpQuestions = {
  "Myself": [
    {
      question: "Have you ever been in therapy or counselling before?",
      options: ["Yes", "No"]
    },
    {
      question: "What made you consider Therapy today?",
      options: [
        "I have been going through tough times emotionally",
        "I am navigating challenges related to addiction and substance abuse",
        "I feel depressed",
        "I have been  trouble sleeping",
        "My low mood is interfering with my daily life",
        "I have been feeling anxious or overwhelmed",
        "I feel my life  empty and directionless",
        "I want to talk about specific challenges",
        "I want to heal from my trauma",
        "I want to gain self-confidence",
        "I want to improve myself but i need a supportive hand along the way",
        "I am going through a period of deep sadness",
        "Other"
      ],
      allowMultiple: true
    },
    {
      question: "How would you describe your sleep pattern?",
      type: "text",
      placeholder: "Please describe your sleep pattern in your own words..."
    },
    {
      question: "What traits are most important to you in a therapist?",
      options: [
        "Listens with patience and understanding",
        "Explores my past",
        "Proactively follows up to support my progress",
        "Helps me clarify and set meaningful goals",
        "Understands trauma and provides safe supportive environment",
        "Helps me manage stress and return to a peaceful state after emotional release",
        "Others"
      ],
      allowMultiple: true
    },
    {
      question: "Are you currently experiencing anxiety, panic attacks, or any phobia?",
      options: ["Yes", "No"]
    },
    {
      question: "Do you have any particular preferences regarding your therapist?",
      options: [
        "Male therapist",
        "Female therapist", 
        "LGBTQ+ therapist",
        "Non-religious therapist",
        "Older therapist (45+)",
        "No preference"
      ],
      allowMultiple: true
    },
    // {
    //   question: "What is the main reason you are seeking support?",
    //   options: ["Stress", "Anxiety", "Sleep issues", "Depression", "Relationship issues", "Other"]
    // },
    // {
    //   question: "What is your relationship status?",
    //   options: ["Married", "Unmarried", "Living together", "Divorced", "Widowed", "Prefer not to say"]
    // },
    // {
    //   question: "What kind of therapy are you open to?",
    //   options: ["Talk Therapy", "CBT", "Mindfulness Based", "EMDR", "Not sure", "Open to recommendations"]
    // }
  ],
  "My child": [
    {
      question: "What concerns do you have about your child?",
      options: ["Behavioral", "Academic", "Emotional", "Social", "Developmental", "Other"]
    },
    {
      question: "Has your child been in therapy before?",
      options: ["Yes", "No", "Not sure"]
    },
    {
      question: "What specific behaviors or symptoms are you concerned about?",
      type: "text",
      placeholder: "Please describe the specific concerns you have about your child..."
    }
  ],
  "Couples": [
    {
      question: "What is the main challenge in your relationship?",
      options: ["Communication", "Trust", "Parenting", "Intimacy", "Financial stress", "Other"]
    },
    {
      question: "Are you attending the session together?",
      options: ["Yes", "No", "Not Sure", "Sometimes"]
    },
    {
      question: "How long have you been together?",
      options: ["Less than 1 year", "1-3 years", "3-5 years", "5-10 years", "More than 10 years"]
    },
    {
      question: "Have you tried couples therapy before?",
      options: ["Yes", "No"]
    },
    {
      question: "What specific issues would you like to address?",
      type: "text",
      placeholder: "Please describe the specific issues you'd like to work on..."
    }
  ],
  "My loved ones": [
    {
      question: "What is your relation to the person?",
      options: ["Spouse", "Parent", "Sibling", "Friend", "Child", "Other family member"]
    },
    {
      question: "Are they aware of this consultation?",
      options: ["Yes", "No", "Not Sure", "Prefer not to say"]
    },
    {
      question: "What concerns are they facing?",
      options: ["Anxiety", "Behavioral", "Depression", "Addiction", "Trauma", "Other"]
    },
    {
      question: "Would you like to join the session?",
      options: ["Yes", "No", "Not Sure", "Prefer not to say"]
    },
    {
      question: "How urgent is this situation?",
      options: ["Very urgent", "Moderately urgent", "Not urgent", "Just want to be proactive"]
    },
    {
      question: "What specific behaviors or symptoms are you concerned about?",
      type: "text",
      placeholder: "Please describe the specific concerns you have..."
    }
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

    const { bookingFor, followUpAnswers } = req.body;

    console.log("💾 Saving response for user:", userId);

    // Get user's profile data (state, age, gender) from their profile
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Use user's profile state instead of asking in questionnaire
    const userState = user.state;
    if (!userState) {
      return res.status(400).json({ 
        error: "Please complete your profile first. State is required for booking.",
        message: "Please go to your profile and add your state before proceeding with the questionnaire."
      });
    }

    // Save questionnaire response
    const savedResponse = await UserResponse.create({
      userId,
      state: userState, // Use user's profile state
      bookingFor,
      followUpAnswers
    });

    console.log("✅ Response saved successfully:", savedResponse);

    // 🎯 AUTOMATIC PSYCHOLOGIST MATCHING AND BOOKING (FIRST-TIME USERS ONLY)
    try {
      console.log("🔍 Starting automatic psychologist matching...");
      
      // Check if user has already had an automatic booking
      if (user.hasHadAutomaticBooking) {
        console.log("⚠️ User has already had an automatic booking, skipping automatic booking creation");
        
        // Update user status to mark as not first-time and save preferences
        await User.findByIdAndUpdate(userId, {
          isFirstTimeUser: false,
          hasCompletedQuestionnaire: true,
          preferredState: userState, // Use user's profile state
          preferredSpecialization: PsychologistMatchingService.getSpecializationFromBooking(bookingFor)
        });

        // Return success without creating booking
        res.status(201).json({
          success: true,
          message: "Questionnaire submitted successfully. You have already had an automatic booking.",
          isFirstTimeUser: false,
          questionnaireResponse: savedResponse,
          booking: null,
          psychologist: null
        });
        return;
      }
      
      // Find the best psychologist for the user using enhanced matching
      const matchResult = await PsychologistMatchingService.findBestPsychologistEnhanced(
        userState, // Use user's profile state
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
        preferredState: userState, // Use user's profile state
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
            state: userState, // Use user's profile state
            bookingFor,
            followUpAnswers
          }
        );

        // Mark user as having had an automatic booking
        await User.findByIdAndUpdate(userId, {
          hasHadAutomaticBooking: true
        });

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
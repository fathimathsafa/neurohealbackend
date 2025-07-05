const Psychologist = require('./psychologist_adding_model'); // ✅ Import model

exports.addPsychologist = async (req, res) => {
  try {
    console.log('📥 Received psychologist addition request');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('File:', req.file);
    console.log('Files:', req.files);
    console.log('Content-Type:', req.headers['content-type']);
    
    // Debug: Log all form fields
    console.log('🔍 All form fields received:');
    Object.keys(req.body).forEach(key => {
      console.log(`  ${key}: ${req.body[key]}`);
    });

    const {
      name,
      username,
      password,
      gender,
      email,
      phone,
      specialization,
      qualifications,
      clinicName,
      state,
      experienceYears,
      hourlyRate,
      rating,
      available,
      workingDays,
      workingHoursStart,
      workingHoursEnd,
      sessionDuration,
      breakTime
    } = req.body;

    const image = req.file ? req.file.filename : null;

    console.log('🔍 Validating fields...');
    console.log('Image file:', req.file);
    console.log('Image filename:', image);

    // ✅ Manual field check
    if (
      !name || !username || !password || !gender || !email || !phone ||
      !specialization || !qualifications || !clinicName || !state ||
      !experienceYears || !hourlyRate || !rating || !available || !req.file
    ) {
      console.log('❌ Missing required fields');
      console.log('Missing fields:', {
        name: !name,
        username: !username,
        password: !password,
        gender: !gender,
        email: !email,
        phone: !phone,
        specialization: !specialization,
        qualifications: !qualifications,
        clinicName: !clinicName,
        state: !state,
        experienceYears: !experienceYears,
        hourlyRate: !hourlyRate,
        rating: !rating,
        available: !available,
        image: !req.file
      });
      
      return res.status(400).json({ 
        message: "All fields are required.",
        missingFields: {
          name: !name,
          username: !username,
          password: !password,
          gender: !gender,
          email: !email,
          phone: !phone,
          specialization: !specialization,
          qualifications: !qualifications,
          clinicName: !clinicName,
          state: !state,
          experienceYears: !experienceYears,
          hourlyRate: !hourlyRate,
          rating: !rating,
          available: !available,
          image: !req.file
        },
        receivedData: {
          body: req.body,
          file: req.file,
          contentType: req.headers['content-type']
        }
      });
    }

    // ✅ Validate specialization
    const validSpecializations = ['Counseling', 'Child Psychology', 'Couples Therapy', 'Family Therapy'];
    if (!validSpecializations.includes(specialization)) {
      return res.status(400).json({ 
        message: "Invalid specialization. Must be one of: Counseling, Child Psychology, Couples Therapy, Family Therapy",
        receivedSpecialization: specialization,
        validSpecializations: validSpecializations
      });
    }

    console.log('✅ All validations passed, creating psychologist...');

    // Parse working days
    let parsedWorkingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    if (workingDays) {
      try {
        parsedWorkingDays = JSON.parse(workingDays);
      } catch (e) {
        console.log('⚠️ Invalid working days format, using default');
      }
    }

    const newP = new Psychologist({
      name,
      username,
      password,
      gender,
      email,
      phone,
      specialization,
      experienceYears: Number(experienceYears),
      qualifications,
      hourlyRate: Number(hourlyRate),
      rating: Number(rating),
      available: available === 'true' || available === true,
      image,
      clinicName,
      state,
      workingDays: parsedWorkingDays,
      workingHours: {
        start: workingHoursStart || '09:00',
        end: workingHoursEnd || '18:00'
      },
      sessionDuration: Number(sessionDuration) || 60,
      breakTime: Number(breakTime) || 15
    });

    await newP.save();

    console.log('✅ Psychologist saved successfully');

    res.status(201).json({
      message: "Psychologist added successfully",
      psychologist: {
        name,
        email,
        specialization,
        state,
        workingDays: parsedWorkingDays,
        workingHours: {
          start: workingHoursStart || '09:00',
          end: workingHoursEnd || '18:00'
        },
        sessionDuration: Number(sessionDuration) || 60,
        breakTime: Number(breakTime) || 15,
        imageUrl: `${req.protocol}://${req.get('host')}/uploads/psychologist/${image}`,
      }
    });
  } catch (err) {
    console.error('❌ Add Psychologist Error:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      body: req.body,
      file: req.file,
      headers: req.headers
    });
    res.status(500).json({
      message: "Error adding psychologist",
      error: err.message,
      details: {
        body: req.body,
        file: req.file ? 'File received' : 'No file',
        contentType: req.headers['content-type']
      }
    });
  }
};
const Psychologist = require('./psychologist_adding_model'); // ✅ Import model
const fs = require('fs');

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

// ✅ Edit Psychologist by Admin
exports.editPsychologist = async (req, res) => {
  try {
    console.log('📝 Admin: Received psychologist edit request');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('File:', req.file);
    console.log('Psychologist ID:', req.params.id);

    const psychologistId = req.params.id;
    
    // Check if psychologist exists
    const existingPsychologist = await Psychologist.findById(psychologistId);
    if (!existingPsychologist) {
      return res.status(404).json({
        status: false,
        message: "Psychologist not found"
      });
    }

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

    // Validate that at least one field is provided for update
    const hasUpdateData = name || username || password || gender || email || phone ||
        specialization || qualifications || clinicName || state ||
        experienceYears || hourlyRate || rating || available !== undefined ||
        workingDays || workingHoursStart || workingHoursEnd || 
        sessionDuration || breakTime || req.file;

    if (!hasUpdateData) {
      return res.status(400).json({
        status: false,
        message: "At least one field must be provided for update"
      });
    }

    // Validate specialization (only if specialization is being updated)
    if (specialization) {
      const validSpecializations = ['Counseling', 'Child Psychology', 'Couples Therapy', 'Family Therapy'];
      if (!validSpecializations.includes(specialization)) {
        return res.status(400).json({
          status: false,
          message: "Invalid specialization. Must be one of: Counseling, Child Psychology, Couples Therapy, Family Therapy"
        });
      }
    }

    // Check if username is already taken by another psychologist (only if username is being updated)
    if (username) {
      const usernameExists = await Psychologist.findOne({
        username: username,
        _id: { $ne: psychologistId }
      });
      if (usernameExists) {
        return res.status(400).json({
          status: false,
          message: "Username is already taken by another psychologist"
        });
      }
    }

    // Check if email is already taken by another psychologist (only if email is being updated)
    if (email) {
      const emailExists = await Psychologist.findOne({
        email: email,
        _id: { $ne: psychologistId }
      });
      if (emailExists) {
        return res.status(400).json({
          status: false,
          message: "Email is already taken by another psychologist"
        });
      }
    }

    // Prepare update data - only include fields that are provided
    const updateData = {};
    
    if (name) updateData.name = name;
    if (username) updateData.username = username;
    if (gender) updateData.gender = gender;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (specialization) updateData.specialization = specialization;
    if (qualifications) updateData.qualifications = qualifications;
    if (clinicName) updateData.clinicName = clinicName;
    if (state) updateData.state = state;
    if (experienceYears) updateData.experienceYears = Number(experienceYears);
    if (hourlyRate) updateData.hourlyRate = Number(hourlyRate);
    if (rating) updateData.rating = Number(rating);
    if (available !== undefined) updateData.available = available === 'true' || available === true;
    if (sessionDuration) updateData.sessionDuration = Number(sessionDuration);
    if (breakTime) updateData.breakTime = Number(breakTime);
    
    // Handle working days
    if (workingDays) {
      try {
        updateData.workingDays = JSON.parse(workingDays);
      } catch (e) {
        return res.status(400).json({
          status: false,
          message: "Invalid workingDays format. Must be a valid JSON array."
        });
      }
    }
    
    // Handle working hours
    if (workingHoursStart || workingHoursEnd) {
      updateData.workingHours = {
        start: workingHoursStart || existingPsychologist.workingHours?.start || '09:00',
        end: workingHoursEnd || existingPsychologist.workingHours?.end || '18:00'
      };
    }

    // Add password only if provided
    if (password && password.trim() !== '') {
      updateData.password = password;
    }

    // Add image only if new file is uploaded
    if (req.file) {
      updateData.image = req.file.filename;
      
      // Delete old image if exists
      if (existingPsychologist.image) {
        const oldImagePath = `uploads/psychologist/${existingPsychologist.image}`;
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    }

    // Update psychologist
    const updatedPsychologist = await Psychologist.findByIdAndUpdate(
      psychologistId,
      updateData,
      { new: true, runValidators: true }
    );

    console.log('✅ Psychologist updated successfully');

    // Prepare response with image URL
    const baseUrl = req.protocol + "://" + req.get("host");
    const responseData = {
      ...updatedPsychologist._doc,
      image: `${baseUrl}/uploads/psychologist/${updatedPsychologist.image}`
    };

    res.status(200).json({
      status: true,
      message: "Psychologist updated successfully",
      psychologist: responseData
    });

  } catch (err) {
    console.error('❌ Edit Psychologist Error:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      body: req.body,
      file: req.file,
      headers: req.headers
    });
    res.status(500).json({
      status: false,
      message: "Error updating psychologist",
      error: err.message
    });
  }
};

// ✅ Get Psychologist by ID (for editing)
exports.getPsychologistById = async (req, res) => {
  try {
    console.log('📋 Admin: Getting psychologist details for editing');
    console.log('Psychologist ID:', req.params.id);

    const psychologistId = req.params.id;
    
    // Check if psychologist exists
    const psychologist = await Psychologist.findById(psychologistId);
    if (!psychologist) {
      return res.status(404).json({
        status: false,
        message: "Psychologist not found"
      });
    }

    // Prepare response with image URL
    const baseUrl = req.protocol + "://" + req.get("host");
    const responseData = {
      ...psychologist._doc,
      image: `${baseUrl}/uploads/psychologist/${psychologist.image}`
    };

    console.log('✅ Psychologist details retrieved successfully');

    res.status(200).json({
      status: true,
      message: "Psychologist details retrieved successfully",
      psychologist: responseData
    });

  } catch (err) {
    console.error('❌ Get Psychologist Error:', err);
    res.status(500).json({
      status: false,
      message: "Error retrieving psychologist details",
      error: err.message
    });
  }
};

// ✅ Delete Psychologist by Admin
exports.deletePsychologist = async (req, res) => {
  try {
    console.log('🗑️ Admin: Received psychologist delete request');
    console.log('Psychologist ID:', req.params.id);

    const psychologistId = req.params.id;
    
    // Check if psychologist exists
    const existingPsychologist = await Psychologist.findById(psychologistId);
    if (!existingPsychologist) {
      return res.status(404).json({
        status: false,
        message: "Psychologist not found"
      });
    }

    // Check if psychologist has any active bookings
    const Booking = require('../../user_module/psychologist_booking/psychologist_booking_model');
    const activeBookings = await Booking.find({
      psychologist: psychologistId,
      status: { $in: ['pending', 'confirmed', 'rescheduled'] }
    });

    if (activeBookings.length > 0) {
      return res.status(400).json({
        status: false,
        message: "Cannot delete psychologist with active bookings",
        activeBookingsCount: activeBookings.length,
        suggestion: "Please cancel or complete all active bookings before deleting the psychologist"
      });
    }

    // Get total bookings count for information
    const totalBookings = await Booking.countDocuments({ psychologist: psychologistId });

    // Delete psychologist's image file if exists
    if (existingPsychologist.image) {
      const fs = require('fs');
      const oldImagePath = `uploads/psychologist/${existingPsychologist.image}`;
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
        console.log('🗑️ Deleted psychologist image file:', oldImagePath);
      }
    }

    // Delete the psychologist
    const deletedPsychologist = await Psychologist.findByIdAndDelete(psychologistId);

    console.log('✅ Psychologist deleted successfully');

    res.status(200).json({
      status: true,
      message: "Psychologist deleted successfully",
      deletedPsychologist: {
        id: deletedPsychologist._id,
        name: deletedPsychologist.name,
        email: deletedPsychologist.email,
        specialization: deletedPsychologist.specialization,
        clinicName: deletedPsychologist.clinicName,
        state: deletedPsychologist.state
      },
      summary: {
        totalBookings: totalBookings,
        activeBookings: activeBookings.length,
        imageDeleted: existingPsychologist.image ? true : false
      }
    });

  } catch (err) {
    console.error('❌ Delete Psychologist Error:', err);
    res.status(500).json({
      status: false,
      message: "Error deleting psychologist",
      error: err.message
    });
  }
};

// ✅ Force Delete Psychologist by Admin (deletes all related bookings)
exports.forceDeletePsychologist = async (req, res) => {
  try {
    console.log('💥 Admin: Received force delete psychologist request');
    console.log('Psychologist ID:', req.params.id);

    const psychologistId = req.params.id;
    
    // Check if psychologist exists
    const existingPsychologist = await Psychologist.findById(psychologistId);
    if (!existingPsychologist) {
      return res.status(404).json({
        status: false,
        message: "Psychologist not found"
      });
    }

    // Get all bookings for this psychologist
    const Booking = require('../../user_module/psychologist_booking/psychologist_booking_model');
    const allBookings = await Booking.find({ psychologist: psychologistId });
    const activeBookings = allBookings.filter(booking => 
      ['pending', 'confirmed', 'rescheduled'].includes(booking.status)
    );

    // Delete psychologist's image file if exists
    if (existingPsychologist.image) {
      const fs = require('fs');
      const oldImagePath = `uploads/psychologist/${existingPsychologist.image}`;
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
        console.log('🗑️ Deleted psychologist image file:', oldImagePath);
      }
    }

    // Delete all bookings for this psychologist
    const deletedBookings = await Booking.deleteMany({ psychologist: psychologistId });

    // Delete the psychologist
    const deletedPsychologist = await Psychologist.findByIdAndDelete(psychologistId);

    console.log('💥 Psychologist and all related data deleted successfully');

    res.status(200).json({
      status: true,
      message: "Psychologist and all related data deleted successfully",
      deletedPsychologist: {
        id: deletedPsychologist._id,
        name: deletedPsychologist.name,
        email: deletedPsychologist.email,
        specialization: deletedPsychologist.specialization,
        clinicName: deletedPsychologist.clinicName,
        state: deletedPsychologist.state
      },
      summary: {
        totalBookingsDeleted: deletedBookings.deletedCount,
        activeBookingsDeleted: activeBookings.length,
        imageDeleted: existingPsychologist.image ? true : false,
        warning: "All bookings associated with this psychologist have been permanently deleted"
      }
    });

  } catch (err) {
    console.error('❌ Force Delete Psychologist Error:', err);
    res.status(500).json({
      status: false,
      message: "Error force deleting psychologist",
      error: err.message
    });
  }
};
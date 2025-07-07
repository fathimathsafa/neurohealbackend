const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Configuration
const BASE_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@neuroheal.com';
const ADMIN_PASSWORD = 'admin123';

// Test data
const testPsychologistId = '64f8a1b2c3d4e5f6a7b8c9d0'; // Replace with actual psychologist ID
const testImagePath = './test-image.jpg'; // Replace with actual image path

let adminToken = '';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 1. Admin Login
async function adminLogin() {
  try {
    log('\n🔐 Step 1: Admin Login', 'blue');
    
    const response = await axios.post(`${BASE_URL}/admin/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    if (response.data.status) {
      adminToken = response.data.token;
      log('✅ Admin login successful', 'green');
      log(`Token: ${adminToken.substring(0, 50)}...`, 'yellow');
      return true;
    } else {
      log('❌ Admin login failed', 'red');
      return false;
    }
  } catch (error) {
    log('❌ Admin login error:', 'red');
    log(error.response?.data?.message || error.message, 'red');
    return false;
  }
}

// 2. Get Psychologist Details
async function getPsychologistDetails() {
  try {
    log('\n📋 Step 2: Get Psychologist Details', 'blue');
    
    const response = await axios.get(`${BASE_URL}/admin/psychologist/${testPsychologistId}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.status) {
      log('✅ Psychologist details retrieved successfully', 'green');
      log('Psychologist Info:', 'yellow');
      log(`  Name: ${response.data.psychologist.name}`, 'yellow');
      log(`  Email: ${response.data.psychologist.email}`, 'yellow');
      log(`  Specialization: ${response.data.psychologist.specialization}`, 'yellow');
      log(`  Hourly Rate: $${response.data.psychologist.hourlyRate}`, 'yellow');
      return response.data.psychologist;
    } else {
      log('❌ Failed to get psychologist details', 'red');
      return null;
    }
  } catch (error) {
    log('❌ Get psychologist details error:', 'red');
    log(error.response?.data?.message || error.message, 'red');
    return null;
  }
}

// 3. Edit Psychologist Details
async function editPsychologistDetails() {
  try {
    log('\n✏️ Step 3: Edit Psychologist Details', 'blue');
    
    const formData = new FormData();
    
    // Add all form fields
    formData.append('name', 'Dr. Sarah Johnson Updated');
    formData.append('username', 'sarah.johnson.psy.updated');
    formData.append('password', 'newpassword123');
    formData.append('gender', 'Female');
    formData.append('email', 'sarah.johnson.updated@clinic.com');
    formData.append('phone', '+1 (555) 987-6543');
    formData.append('specialization', 'Clinical Psychology');
    formData.append('qualifications', 'Ph.D. Clinical Psychology, Licensed Psychologist');
    formData.append('clinicName', 'Mind Wellness Clinic Updated');
    formData.append('state', 'California');
    formData.append('experienceYears', '10');
    formData.append('hourlyRate', '175');
    formData.append('rating', '4.9');
    formData.append('available', 'true');
    formData.append('workingDays', JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']));
    formData.append('workingHoursStart', '08:00');
    formData.append('workingHoursEnd', '19:00');
    formData.append('sessionDuration', '90');
    formData.append('breakTime', '20');
    
    // Add image if file exists
    if (fs.existsSync(testImagePath)) {
      formData.append('image', fs.createReadStream(testImagePath));
      log('📷 Image file added to form data', 'yellow');
    } else {
      log('⚠️ Image file not found, skipping image upload', 'yellow');
    }

    const response = await axios.put(`${BASE_URL}/admin/psychologist/${testPsychologistId}`, formData, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        ...formData.getHeaders()
      }
    });

    if (response.data.status) {
      log('✅ Psychologist updated successfully', 'green');
      log('Updated Psychologist Info:', 'yellow');
      log(`  Name: ${response.data.psychologist.name}`, 'yellow');
      log(`  Email: ${response.data.psychologist.email}`, 'yellow');
      log(`  Hourly Rate: $${response.data.psychologist.hourlyRate}`, 'yellow');
      log(`  Experience: ${response.data.psychologist.experienceYears} years`, 'yellow');
      log(`  Rating: ${response.data.psychologist.rating}`, 'yellow');
      log(`  Working Days: ${response.data.psychologist.workingDays.join(', ')}`, 'yellow');
      log(`  Working Hours: ${response.data.psychologist.workingHours.start} - ${response.data.psychologist.workingHours.end}`, 'yellow');
      return response.data.psychologist;
    } else {
      log('❌ Failed to update psychologist', 'red');
      return null;
    }
  } catch (error) {
    log('❌ Edit psychologist error:', 'red');
    if (error.response?.data) {
      log(`Status: ${error.response.status}`, 'red');
      log(`Message: ${error.response.data.message}`, 'red');
      if (error.response.data.error) {
        log(`Error: ${error.response.data.error}`, 'red');
      }
    } else {
      log(error.message, 'red');
    }
    return null;
  }
}

// 4. Verify Update
async function verifyUpdate() {
  try {
    log('\n🔍 Step 4: Verify Update', 'blue');
    
    const response = await axios.get(`${BASE_URL}/admin/psychologist/${testPsychologistId}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.status) {
      const psychologist = response.data.psychologist;
      log('✅ Verification successful', 'green');
      log('Final Psychologist Details:', 'yellow');
      log(`  Name: ${psychologist.name}`, 'yellow');
      log(`  Username: ${psychologist.username}`, 'yellow');
      log(`  Email: ${psychologist.email}`, 'yellow');
      log(`  Phone: ${psychologist.phone}`, 'yellow');
      log(`  Specialization: ${psychologist.specialization}`, 'yellow');
      log(`  Qualifications: ${psychologist.qualifications}`, 'yellow');
      log(`  Clinic: ${psychologist.clinicName}`, 'yellow');
      log(`  State: ${psychologist.state}`, 'yellow');
      log(`  Experience: ${psychologist.experienceYears} years`, 'yellow');
      log(`  Hourly Rate: $${psychologist.hourlyRate}`, 'yellow');
      log(`  Rating: ${psychologist.rating}`, 'yellow');
      log(`  Available: ${psychologist.available}`, 'yellow');
      log(`  Working Days: ${psychologist.workingDays.join(', ')}`, 'yellow');
      log(`  Working Hours: ${psychologist.workingHours.start} - ${psychologist.workingHours.end}`, 'yellow');
      log(`  Session Duration: ${psychologist.sessionDuration} minutes`, 'yellow');
      log(`  Break Time: ${psychologist.breakTime} minutes`, 'yellow');
      log(`  Image: ${psychologist.image}`, 'yellow');
      log(`  Updated At: ${psychologist.updatedAt}`, 'yellow');
      return true;
    } else {
      log('❌ Verification failed', 'red');
      return false;
    }
  } catch (error) {
    log('❌ Verification error:', 'red');
    log(error.response?.data?.message || error.message, 'red');
    return false;
  }
}

// 5. Test Error Cases
async function testErrorCases() {
  try {
    log('\n🚨 Step 5: Testing Error Cases', 'blue');
    
    // Test 1: Invalid psychologist ID
    log('\nTest 1: Invalid psychologist ID', 'yellow');
    try {
      await axios.get(`${BASE_URL}/admin/psychologist/invalid-id`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      if (error.response?.status === 404) {
        log('✅ Correctly returned 404 for invalid ID', 'green');
      } else {
        log('❌ Unexpected error for invalid ID', 'red');
      }
    }
    
    // Test 2: Missing required fields
    log('\nTest 2: Missing required fields', 'yellow');
    try {
      const formData = new FormData();
      formData.append('name', 'Test Name');
      // Missing other required fields
      
      await axios.put(`${BASE_URL}/admin/psychologist/${testPsychologistId}`, formData, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          ...formData.getHeaders()
        }
      });
    } catch (error) {
      if (error.response?.status === 400) {
        log('✅ Correctly returned 400 for missing fields', 'green');
      } else {
        log('❌ Unexpected error for missing fields', 'red');
      }
    }
    
    // Test 3: Invalid specialization
    log('\nTest 3: Invalid specialization', 'yellow');
    try {
      const formData = new FormData();
      formData.append('name', 'Dr. Test');
      formData.append('username', 'test.user');
      formData.append('gender', 'Male');
      formData.append('email', 'test@example.com');
      formData.append('phone', '+1234567890');
      formData.append('specialization', 'Invalid Specialization');
      formData.append('qualifications', 'Test Qualifications');
      formData.append('clinicName', 'Test Clinic');
      formData.append('state', 'Test State');
      formData.append('experienceYears', '5');
      formData.append('hourlyRate', '100');
      formData.append('rating', '4.5');
      formData.append('available', 'true');
      
      await axios.put(`${BASE_URL}/admin/psychologist/${testPsychologistId}`, formData, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          ...formData.getHeaders()
        }
      });
    } catch (error) {
      if (error.response?.status === 400) {
        log('✅ Correctly returned 400 for invalid specialization', 'green');
      } else {
        log('❌ Unexpected error for invalid specialization', 'red');
      }
    }
    
  } catch (error) {
    log('❌ Error case testing failed:', 'red');
    log(error.message, 'red');
  }
}

// Main test function
async function runTests() {
  log('🧪 Starting Admin Edit Psychologist Tests', 'blue');
  log('==========================================', 'blue');
  
  // Check if psychologist ID is provided
  if (testPsychologistId === '64f8a1b2c3d4e5f6a7b8c9d0') {
    log('⚠️ Please update testPsychologistId with a real psychologist ID', 'yellow');
    log('You can get a psychologist ID from the /allpsychologist endpoint', 'yellow');
    return;
  }
  
  // Run tests
  const loginSuccess = await adminLogin();
  if (!loginSuccess) {
    log('❌ Cannot proceed without admin login', 'red');
    return;
  }
  
  const originalDetails = await getPsychologistDetails();
  if (!originalDetails) {
    log('❌ Cannot proceed without getting psychologist details', 'red');
    return;
  }
  
  const updatedDetails = await editPsychologistDetails();
  if (!updatedDetails) {
    log('❌ Cannot proceed without updating psychologist', 'red');
    return;
  }
  
  const verificationSuccess = await verifyUpdate();
  if (!verificationSuccess) {
    log('❌ Verification failed', 'red');
    return;
  }
  
  await testErrorCases();
  
  log('\n🎉 All tests completed!', 'green');
  log('==========================================', 'blue');
}

// Run the tests
runTests().catch(error => {
  log('❌ Test execution failed:', 'red');
  log(error.message, 'red');
});

module.exports = {
  adminLogin,
  getPsychologistDetails,
  editPsychologistDetails,
  verifyUpdate,
  testErrorCases
}; 
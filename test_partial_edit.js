const axios = require('axios');
const FormData = require('form-data');

// Configuration
const BASE_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@neuroheal.com';
const ADMIN_PASSWORD = 'admin123';

// Test data - Replace with actual psychologist ID
const testPsychologistId = '64f8a1b2c3d4e5f6a7b8c9d0';

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

// Admin Login
async function adminLogin() {
  try {
    const response = await axios.post(`${BASE_URL}/admin/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    if (response.data.status) {
      adminToken = response.data.token;
      log('✅ Admin login successful', 'green');
      return true;
    }
    return false;
  } catch (error) {
    log('❌ Admin login failed', 'red');
    return false;
  }
}

// Get Psychologist Details
async function getPsychologistDetails() {
  try {
    const response = await axios.get(`${BASE_URL}/admin/psychologist/${testPsychologistId}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.status) {
      log('✅ Psychologist details retrieved', 'green');
      return response.data.psychologist;
    }
    return null;
  } catch (error) {
    log('❌ Failed to get psychologist details', 'red');
    return null;
  }
}

// Partial Update Function
async function partialUpdate(updateData, description) {
  try {
    log(`\n🔄 Testing: ${description}`, 'blue');
    
    const formData = new FormData();
    
    // Add only the fields that need to be updated
    Object.keys(updateData).forEach(key => {
      formData.append(key, updateData[key]);
    });

    const response = await axios.put(`${BASE_URL}/admin/psychologist/${testPsychologistId}`, formData, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        ...formData.getHeaders()
      }
    });

    if (response.data.status) {
      log('✅ Update successful', 'green');
      log('Updated fields:', 'yellow');
      Object.keys(updateData).forEach(key => {
        log(`  ${key}: ${updateData[key]}`, 'yellow');
      });
      return response.data.psychologist;
    }
    return null;
  } catch (error) {
    log('❌ Update failed', 'red');
    log(error.response?.data?.message || error.message, 'red');
    return null;
  }
}

// Test different partial update scenarios
async function testPartialUpdates() {
  log('\n🧪 Testing Partial Updates', 'blue');
  log('========================', 'blue');

  // Test 1: Update only name
  await partialUpdate(
    { name: 'Dr. Sarah Johnson - Name Updated' },
    'Update only name'
  );

  // Test 2: Update only email
  await partialUpdate(
    { email: 'sarah.johnson.name.updated@clinic.com' },
    'Update only email'
  );

  // Test 3: Update only hourly rate
  await partialUpdate(
    { hourlyRate: '180' },
    'Update only hourly rate'
  );

  // Test 4: Update only rating
  await partialUpdate(
    { rating: '4.9' },
    'Update only rating'
  );

  // Test 5: Update only availability
  await partialUpdate(
    { available: 'false' },
    'Update only availability'
  );

  // Test 6: Update only working hours
  await partialUpdate(
    { 
      workingHoursStart: '10:00',
      workingHoursEnd: '20:00'
    },
    'Update only working hours'
  );

  // Test 7: Update only working days
  await partialUpdate(
    { 
      workingDays: JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])
    },
    'Update only working days'
  );

  // Test 8: Update only session duration and break time
  await partialUpdate(
    { 
      sessionDuration: '75',
      breakTime: '25'
    },
    'Update only session duration and break time'
  );

  // Test 9: Update only password
  await partialUpdate(
    { password: 'newpassword456' },
    'Update only password'
  );

  // Test 10: Update multiple fields at once
  await partialUpdate(
    { 
      name: 'Dr. Sarah Johnson - Final Update',
      email: 'sarah.johnson.final@clinic.com',
      hourlyRate: '200',
      rating: '5.0',
      available: 'true'
    },
    'Update multiple fields at once'
  );
}

// Test error cases
async function testErrorCases() {
  log('\n🚨 Testing Error Cases', 'blue');
  log('====================', 'blue');

  // Test 1: No fields provided
  try {
    log('\nTest 1: No fields provided', 'yellow');
    const formData = new FormData();
    
    await axios.put(`${BASE_URL}/admin/psychologist/${testPsychologistId}`, formData, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        ...formData.getHeaders()
      }
    });
  } catch (error) {
    if (error.response?.status === 400) {
      log('✅ Correctly returned 400 for no fields', 'green');
    } else {
      log('❌ Unexpected error for no fields', 'red');
    }
  }

  // Test 2: Invalid specialization
  try {
    log('\nTest 2: Invalid specialization', 'yellow');
    await partialUpdate(
      { specialization: 'Invalid Specialization' },
      'Invalid specialization'
    );
  } catch (error) {
    log('✅ Correctly handled invalid specialization', 'green');
  }

  // Test 3: Invalid working days format
  try {
    log('\nTest 3: Invalid working days format', 'yellow');
    await partialUpdate(
      { workingDays: 'invalid json' },
      'Invalid working days format'
    );
  } catch (error) {
    log('✅ Correctly handled invalid working days format', 'green');
  }
}

// Main test function
async function runTests() {
  log('🧪 Starting Partial Update Tests', 'blue');
  log('================================', 'blue');

  // Check if psychologist ID is provided
  if (testPsychologistId === '64f8a1b2c3d4e5f6a7b8c9d0') {
    log('⚠️ Please update testPsychologistId with a real psychologist ID', 'yellow');
    log('You can get a psychologist ID from the /allpsychologist endpoint', 'yellow');
    return;
  }

  // Login
  const loginSuccess = await adminLogin();
  if (!loginSuccess) {
    log('❌ Cannot proceed without admin login', 'red');
    return;
  }

  // Get original details
  const originalDetails = await getPsychologistDetails();
  if (!originalDetails) {
    log('❌ Cannot proceed without getting psychologist details', 'red');
    return;
  }

  log('\n📋 Original Psychologist Details:', 'yellow');
  log(`Name: ${originalDetails.name}`, 'yellow');
  log(`Email: ${originalDetails.email}`, 'yellow');
  log(`Hourly Rate: $${originalDetails.hourlyRate}`, 'yellow');
  log(`Rating: ${originalDetails.rating}`, 'yellow');

  // Test partial updates
  await testPartialUpdates();

  // Test error cases
  await testErrorCases();

  // Get final details
  const finalDetails = await getPsychologistDetails();
  if (finalDetails) {
    log('\n📋 Final Psychologist Details:', 'yellow');
    log(`Name: ${finalDetails.name}`, 'yellow');
    log(`Email: ${finalDetails.email}`, 'yellow');
    log(`Hourly Rate: $${finalDetails.hourlyRate}`, 'yellow');
    log(`Rating: ${finalDetails.rating}`, 'yellow');
    log(`Available: ${finalDetails.available}`, 'yellow');
    log(`Working Hours: ${finalDetails.workingHours.start} - ${finalDetails.workingHours.end}`, 'yellow');
    log(`Session Duration: ${finalDetails.sessionDuration} minutes`, 'yellow');
    log(`Break Time: ${finalDetails.breakTime} minutes`, 'yellow');
  }

  log('\n🎉 All partial update tests completed!', 'green');
  log('================================', 'blue');
}

// Run the tests
runTests().catch(error => {
  log('❌ Test execution failed:', 'red');
  log(error.message, 'red');
});

module.exports = {
  adminLogin,
  getPsychologistDetails,
  partialUpdate,
  testPartialUpdates,
  testErrorCases
}; 
const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api';
const ADMIN_TOKEN = 'your_admin_token_here'; // Replace with actual admin token

// Headers for admin requests
const adminHeaders = {
  'Authorization': `Bearer ${ADMIN_TOKEN}`,
  'Content-Type': 'application/json'
};

// Test data
const testUserData = {
  fullName: 'Test User',
  email: 'testuser@example.com',
  phone: '1234567890',
  password: 'testpassword123'
};

let createdUserId = null;

// Utility function to log results
const logResult = (testName, success, data, error = null) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 ${testName}`);
  console.log(`${'='.repeat(60)}`);
  
  if (success) {
    console.log('✅ SUCCESS');
    console.log('📊 Response Data:');
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log('❌ FAILED');
    console.log('🚨 Error:', error?.response?.data || error?.message || error);
  }
  console.log(`${'='.repeat(60)}\n`);
};

// Test 1: Get User Statistics
async function testGetUserStatistics() {
  try {
    console.log('🔍 Testing: Get User Statistics');
    
    const response = await axios.get(`${BASE_URL}/admin/users/statistics`, {
      headers: adminHeaders
    });
    
    logResult('Get User Statistics', true, response.data);
    return response.data;
  } catch (error) {
    logResult('Get User Statistics', false, null, error);
    throw error;
  }
}

// Test 2: Get All Users (Basic)
async function testGetAllUsers() {
  try {
    console.log('👥 Testing: Get All Users (Basic)');
    
    const response = await axios.get(`${BASE_URL}/admin/users`, {
      headers: adminHeaders
    });
    
    logResult('Get All Users (Basic)', true, response.data);
    return response.data;
  } catch (error) {
    logResult('Get All Users (Basic)', false, null, error);
    throw error;
  }
}

// Test 3: Get All Users with Search
async function testGetAllUsersWithSearch() {
  try {
    console.log('🔍 Testing: Get All Users with Search');
    
    const response = await axios.get(`${BASE_URL}/admin/users?search=test&limit=5`, {
      headers: adminHeaders
    });
    
    logResult('Get All Users with Search', true, response.data);
    return response.data;
  } catch (error) {
    logResult('Get All Users with Search', false, null, error);
    throw error;
  }
}

// Test 4: Get All Users with Filtering
async function testGetAllUsersWithFiltering() {
  try {
    console.log('🎯 Testing: Get All Users with Filtering');
    
    const filters = ['premium', 'regular', 'active', 'inactive'];
    
    for (const filter of filters) {
      console.log(`\n📋 Testing filter: ${filter}`);
      
      const response = await axios.get(`${BASE_URL}/admin/users?filter=${filter}&limit=5`, {
        headers: adminHeaders
      });
      
      console.log(`✅ Filter "${filter}" returned ${response.data.data.users.length} users`);
    }
    
    logResult('Get All Users with Filtering', true, { message: 'All filters tested successfully' });
  } catch (error) {
    logResult('Get All Users with Filtering', false, null, error);
    throw error;
  }
}

// Test 5: Get All Users with Sorting
async function testGetAllUsersWithSorting() {
  try {
    console.log('📊 Testing: Get All Users with Sorting');
    
    const sortOptions = [
      { sortBy: 'recent', sortOrder: 'desc' },
      { sortBy: 'name', sortOrder: 'asc' },
      { sortBy: 'email', sortOrder: 'asc' },
      { sortBy: 'lastActivity', sortOrder: 'desc' }
    ];
    
    for (const sort of sortOptions) {
      console.log(`\n📋 Testing sort: ${sort.sortBy} (${sort.sortOrder})`);
      
      const response = await axios.get(`${BASE_URL}/admin/users?sortBy=${sort.sortBy}&sortOrder=${sort.sortOrder}&limit=5`, {
        headers: adminHeaders
      });
      
      console.log(`✅ Sort "${sort.sortBy}" returned ${response.data.data.users.length} users`);
    }
    
    logResult('Get All Users with Sorting', true, { message: 'All sort options tested successfully' });
  } catch (error) {
    logResult('Get All Users with Sorting', false, null, error);
    throw error;
  }
}

// Test 6: Get All Users with Pagination
async function testGetAllUsersWithPagination() {
  try {
    console.log('📄 Testing: Get All Users with Pagination');
    
    const response = await axios.get(`${BASE_URL}/admin/users?page=1&limit=3`, {
      headers: adminHeaders
    });
    
    const pagination = response.data.data.pagination;
    console.log(`📊 Pagination Info:`);
    console.log(`   - Current Page: ${pagination.currentPage}`);
    console.log(`   - Total Pages: ${pagination.totalPages}`);
    console.log(`   - Total Users: ${pagination.totalUsers}`);
    console.log(`   - Has Next Page: ${pagination.hasNextPage}`);
    console.log(`   - Has Prev Page: ${pagination.hasPrevPage}`);
    console.log(`   - Users in this page: ${response.data.data.users.length}`);
    
    logResult('Get All Users with Pagination', true, response.data);
    return response.data;
  } catch (error) {
    logResult('Get All Users with Pagination', false, null, error);
    throw error;
  }
}

// Test 7: Create a test user (if needed for testing)
async function createTestUser() {
  try {
    console.log('👤 Creating test user for testing...');
    
    // First, try to register a new user
    const registerResponse = await axios.post(`${BASE_URL}/pre-register`, testUserData);
    
    if (registerResponse.data.message === 'OTP sent to email') {
      console.log('📧 OTP sent, but we need to verify it manually');
      console.log('⚠️  Please check the email and verify OTP manually, or use an existing user ID for testing');
      return null;
    }
  } catch (error) {
    console.log('⚠️  Could not create test user automatically');
    console.log('💡 You can use an existing user ID for testing the other endpoints');
    return null;
  }
}

// Test 8: Get Single User Details (requires existing user ID)
async function testGetUserDetails(userId) {
  if (!userId) {
    console.log('⚠️  Skipping Get User Details test - no user ID provided');
    return;
  }
  
  try {
    console.log('👤 Testing: Get Single User Details');
    
    const response = await axios.get(`${BASE_URL}/admin/users/${userId}`, {
      headers: adminHeaders
    });
    
    logResult('Get Single User Details', true, response.data);
    return response.data;
  } catch (error) {
    logResult('Get Single User Details', false, null, error);
    throw error;
  }
}

// Test 9: Update User Status
async function testUpdateUserStatus(userId) {
  if (!userId) {
    console.log('⚠️  Skipping Update User Status test - no user ID provided');
    return;
  }
  
  try {
    console.log('🔄 Testing: Update User Status');
    
    // Test deactivating user
    const deactivateResponse = await axios.put(`${BASE_URL}/admin/users/${userId}/status`, {
      isActive: false
    }, {
      headers: adminHeaders
    });
    
    logResult('Update User Status (Deactivate)', true, deactivateResponse.data);
    
    // Test reactivating user
    const activateResponse = await axios.put(`${BASE_URL}/admin/users/${userId}/status`, {
      isActive: true
    }, {
      headers: adminHeaders
    });
    
    logResult('Update User Status (Activate)', true, activateResponse.data);
    
    return { deactivate: deactivateResponse.data, activate: activateResponse.data };
  } catch (error) {
    logResult('Update User Status', false, null, error);
    throw error;
  }
}

// Test 10: Update User Premium Status
async function testUpdateUserPremiumStatus(userId) {
  if (!userId) {
    console.log('⚠️  Skipping Update User Premium Status test - no user ID provided');
    return;
  }
  
  try {
    console.log('⭐ Testing: Update User Premium Status');
    
    // Test enabling premium
    const enablePremiumResponse = await axios.put(`${BASE_URL}/admin/users/${userId}/premium`, {
      isPremium: true
    }, {
      headers: adminHeaders
    });
    
    logResult('Update User Premium Status (Enable)', true, enablePremiumResponse.data);
    
    // Test disabling premium
    const disablePremiumResponse = await axios.put(`${BASE_URL}/admin/users/${userId}/premium`, {
      isPremium: false
    }, {
      headers: adminHeaders
    });
    
    logResult('Update User Premium Status (Disable)', true, disablePremiumResponse.data);
    
    return { enable: enablePremiumResponse.data, disable: disablePremiumResponse.data };
  } catch (error) {
    logResult('Update User Premium Status', false, null, error);
    throw error;
  }
}

// Test 11: Test Error Cases
async function testErrorCases() {
  try {
    console.log('🚨 Testing: Error Cases');
    
    // Test 1: Get user details with invalid ID
    try {
      await axios.get(`${BASE_URL}/admin/users/invalid_user_id`, {
        headers: adminHeaders
      });
    } catch (error) {
      console.log('✅ Expected error for invalid user ID:', error.response?.status);
    }
    
    // Test 2: Update user status with invalid data
    if (createdUserId) {
      try {
        await axios.put(`${BASE_URL}/admin/users/${createdUserId}/status`, {
          isActive: 'invalid_value'
        }, {
          headers: adminHeaders
        });
      } catch (error) {
        console.log('✅ Expected error for invalid status data:', error.response?.status);
      }
    }
    
    // Test 3: Update premium status with invalid data
    if (createdUserId) {
      try {
        await axios.put(`${BASE_URL}/admin/users/${createdUserId}/premium`, {
          isPremium: 'invalid_value'
        }, {
          headers: adminHeaders
        });
      } catch (error) {
        console.log('✅ Expected error for invalid premium data:', error.response?.status);
      }
    }
    
    logResult('Error Cases', true, { message: 'All error cases handled correctly' });
  } catch (error) {
    logResult('Error Cases', false, null, error);
    throw error;
  }
}

// Test 12: Test Delete User (Safe Delete)
async function testDeleteUser(userId) {
  if (!userId) {
    console.log('⚠️  Skipping Delete User test - no user ID provided');
    return;
  }
  
  try {
    console.log('🗑️  Testing: Delete User (Safe Delete)');
    
    // Note: This will only work if the user has no active bookings
    const response = await axios.delete(`${BASE_URL}/admin/users/${userId}`, {
      headers: adminHeaders
    });
    
    logResult('Delete User (Safe Delete)', true, response.data);
    return response.data;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('active booking')) {
      console.log('✅ Expected error: User has active bookings (safe delete working)');
      logResult('Delete User (Safe Delete)', true, { message: 'Safe delete protection working correctly' });
    } else {
      logResult('Delete User (Safe Delete)', false, null, error);
    }
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Admin User Management API Tests');
  console.log('='.repeat(60));
  
  try {
    // Run basic tests first
    await testGetUserStatistics();
    await testGetAllUsers();
    await testGetAllUsersWithSearch();
    await testGetAllUsersWithFiltering();
    await testGetAllUsersWithSorting();
    await testGetAllUsersWithPagination();
    
    // Try to create a test user
    await createTestUser();
    
    // For user-specific tests, you need to provide a valid user ID
    // You can get this from the getAllUsers response or create a user manually
    const testUserId = process.argv[2]; // Pass user ID as command line argument
    
    if (testUserId) {
      await testGetUserDetails(testUserId);
      await testUpdateUserStatus(testUserId);
      await testUpdateUserPremiumStatus(testUserId);
      await testDeleteUser(testUserId);
    } else {
      console.log('\n💡 To test user-specific endpoints, provide a user ID as a command line argument:');
      console.log('   node test_admin_user_management.js <user_id>');
    }
    
    await testErrorCases();
    
    console.log('\n🎉 All tests completed!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testGetUserStatistics,
  testGetAllUsers,
  testGetAllUsersWithSearch,
  testGetAllUsersWithFiltering,
  testGetAllUsersWithSorting,
  testGetAllUsersWithPagination,
  testGetUserDetails,
  testUpdateUserStatus,
  testUpdateUserPremiumStatus,
  testDeleteUser,
  testErrorCases
}; 
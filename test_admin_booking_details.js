const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
const ADMIN_TOKEN = 'YOUR_ADMIN_JWT_TOKEN'; // Replace with actual admin token

// Headers for admin requests
const adminHeaders = {
  'Authorization': `Bearer ${ADMIN_TOKEN}`,
  'Content-Type': 'application/json'
};

// Test functions
async function testGetAllBookings() {
  console.log('\n🔍 Testing: Get All Bookings with Details');
  console.log('==========================================');
  
  try {
    const response = await axios.get(`${BASE_URL}/admin/bookings/all`, {
      headers: adminHeaders
    });
    
    console.log('✅ Success!');
    console.log(`📊 Total Bookings: ${response.data.data.pagination.totalBookings}`);
    console.log(`📄 Current Page: ${response.data.data.pagination.currentPage}`);
    console.log(`📋 Bookings in this page: ${response.data.data.bookings.length}`);
    console.log(`📈 Recent Bookings (30 days): ${response.data.data.statistics.recentBookings}`);
    console.log(`📅 Today's Bookings: ${response.data.data.statistics.todayBookings}`);
    
    // Show first booking details
    if (response.data.data.bookings.length > 0) {
      const firstBooking = response.data.data.bookings[0];
      console.log('\n📋 Sample Booking:');
      console.log(`   ID: ${firstBooking.id}`);
      console.log(`   Date: ${firstBooking.date}`);
      console.log(`   Time: ${firstBooking.time}`);
      console.log(`   Status: ${firstBooking.status}`);
      console.log(`   User: ${firstBooking.user?.fullName || 'N/A'}`);
      console.log(`   Psychologist: ${firstBooking.psychologist?.name || 'N/A'}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

async function testGetBookingsWithFilters() {
  console.log('\n🔍 Testing: Get Bookings with Filters');
  console.log('=====================================');
  
  const filters = [
    { name: 'Pending Bookings', params: { status: 'pending' } },
    { name: 'Today\'s Bookings', params: { date: new Date().toISOString().split('T')[0] } },
    { name: 'Automatic Bookings', params: { bookingMethod: 'automatic' } },
    { name: 'Manual Bookings', params: { bookingMethod: 'manual' } },
    { name: 'Recent Bookings (Sorted by Date)', params: { sortBy: 'date', sortOrder: 'desc', limit: 5 } }
  ];
  
  for (const filter of filters) {
    try {
      console.log(`\n📋 Testing: ${filter.name}`);
      const response = await axios.get(`${BASE_URL}/admin/bookings/all`, {
        headers: adminHeaders,
        params: filter.params
      });
      
      console.log(`   ✅ Found ${response.data.data.bookings.length} bookings`);
      console.log(`   📊 Total matching: ${response.data.data.pagination.totalBookings}`);
      
      // Show status breakdown if available
      if (response.data.data.statistics.bookingsByStatus) {
        console.log('   📈 Status Breakdown:');
        Object.entries(response.data.data.statistics.bookingsByStatus).forEach(([status, count]) => {
          console.log(`      ${status}: ${count}`);
        });
      }
      
    } catch (error) {
      console.error(`   ❌ Error:`, error.response?.data?.message || error.message);
    }
  }
}

async function testGetBookingsWithPagination() {
  console.log('\n🔍 Testing: Get Bookings with Pagination');
  console.log('========================================');
  
  try {
    // Get first page with 5 items
    const response1 = await axios.get(`${BASE_URL}/admin/bookings/all`, {
      headers: adminHeaders,
      params: { page: 1, limit: 5 }
    });
    
    console.log('📄 Page 1 (5 items):');
    console.log(`   ✅ Found ${response1.data.data.bookings.length} bookings`);
    console.log(`   📊 Total pages: ${response1.data.data.pagination.totalPages}`);
    console.log(`   🔄 Has next page: ${response1.data.data.pagination.hasNextPage}`);
    
    // Get second page if available
    if (response1.data.data.pagination.hasNextPage) {
      const response2 = await axios.get(`${BASE_URL}/admin/bookings/all`, {
        headers: adminHeaders,
        params: { page: 2, limit: 5 }
      });
      
      console.log('\n📄 Page 2 (5 items):');
      console.log(`   ✅ Found ${response2.data.data.bookings.length} bookings`);
      console.log(`   🔄 Has previous page: ${response2.data.data.pagination.hasPrevPage}`);
      
      // Show different bookings
      if (response2.data.data.bookings.length > 0) {
        const firstBookingPage2 = response2.data.data.bookings[0];
        console.log(`   📋 First booking on page 2: ${firstBookingPage2.id}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

async function testGetBookingSummary() {
  console.log('\n🔍 Testing: Get Booking Count Summary');
  console.log('=====================================');
  
  try {
    const response = await axios.get(`${BASE_URL}/admin/bookings/summary`, {
      headers: adminHeaders
    });
    
    const data = response.data.data;
    
    console.log('✅ Success!');
    console.log('\n📊 Summary Statistics:');
    console.log(`   Total Bookings: ${data.summary.totalBookings}`);
    console.log(`   Unique Users: ${data.summary.uniqueUsers}`);
    console.log(`   Unique Psychologists: ${data.summary.uniquePsychologists}`);
    console.log(`   Avg Bookings per User: ${data.summary.averageBookingsPerUser}`);
    console.log(`   Avg Bookings per Psychologist: ${data.summary.averageBookingsPerPsychologist}`);
    
    console.log('\n📈 Recent Activity:');
    console.log(`   Recent (30 days): ${data.recentActivity.recentBookings}`);
    console.log(`   Today: ${data.recentActivity.todayBookings}`);
    console.log(`   This Week: ${data.recentActivity.thisWeekBookings}`);
    console.log(`   This Month: ${data.recentActivity.thisMonthBookings}`);
    
    console.log('\n📋 Status Breakdown:');
    Object.entries(data.breakdown.bookingsByStatus).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
    
    console.log('\n🔧 Method Breakdown:');
    Object.entries(data.breakdown.bookingsByMethod).forEach(([method, count]) => {
      console.log(`   ${method}: ${count}`);
    });
    
    console.log('\n📅 Daily Trend (Last 7 days):');
    data.dailyTrend.forEach(day => {
      console.log(`   ${day._id}: ${day.count} bookings`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

async function testSearchBookings() {
  console.log('\n🔍 Testing: Search Bookings');
  console.log('===========================');
  
  try {
    // First get a booking ID to search for
    const allBookingsResponse = await axios.get(`${BASE_URL}/admin/bookings/all`, {
      headers: adminHeaders,
      params: { limit: 1 }
    });
    
    if (allBookingsResponse.data.data.bookings.length > 0) {
      const bookingId = allBookingsResponse.data.data.bookings[0].id;
      
      console.log(`🔍 Searching for booking ID: ${bookingId}`);
      
      const searchResponse = await axios.get(`${BASE_URL}/admin/bookings/all`, {
        headers: adminHeaders,
        params: { search: bookingId }
      });
      
      console.log(`✅ Search Results: ${searchResponse.data.data.bookings.length} bookings found`);
      
      if (searchResponse.data.data.bookings.length > 0) {
        const foundBooking = searchResponse.data.data.bookings[0];
        console.log(`📋 Found Booking:`);
        console.log(`   ID: ${foundBooking.id}`);
        console.log(`   Date: ${foundBooking.date}`);
        console.log(`   Status: ${foundBooking.status}`);
        console.log(`   User: ${foundBooking.user?.fullName || 'N/A'}`);
      }
    } else {
      console.log('⚠️  No bookings available for search test');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

async function testErrorHandling() {
  console.log('\n🔍 Testing: Error Handling');
  console.log('==========================');
  
  // Test without authentication
  try {
    console.log('📋 Testing without authentication...');
    await axios.get(`${BASE_URL}/admin/bookings/all`);
    console.log('❌ Should have failed with 401');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Correctly rejected without authentication');
    } else {
      console.log('❌ Unexpected error:', error.response?.status);
    }
  }
  
  // Test with invalid parameters
  try {
    console.log('\n📋 Testing with invalid date format...');
    await axios.get(`${BASE_URL}/admin/bookings/all`, {
      headers: adminHeaders,
      params: { date: 'invalid-date' }
    });
    console.log('✅ Request processed (date validation handled)');
  } catch (error) {
    console.log('❌ Error with invalid date:', error.response?.data?.message);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Admin Booking Details API Tests');
  console.log('===========================================');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🔑 Admin Token: ${ADMIN_TOKEN ? 'Provided' : 'Missing - Please update the script'}`);
  
  if (!ADMIN_TOKEN || ADMIN_TOKEN === 'YOUR_ADMIN_JWT_TOKEN') {
    console.log('\n⚠️  Please update the ADMIN_TOKEN variable with a valid admin JWT token');
    console.log('   You can get this by logging in as an admin user');
    return;
  }
  
  try {
    await testGetAllBookings();
    await testGetBookingsWithFilters();
    await testGetBookingsWithPagination();
    await testGetBookingSummary();
    await testSearchBookings();
    await testErrorHandling();
    
    console.log('\n🎉 All tests completed!');
    console.log('========================');
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testGetAllBookings,
  testGetBookingsWithFilters,
  testGetBookingsWithPagination,
  testGetBookingSummary,
  testSearchBookings,
  testErrorHandling,
  runAllTests
}; 
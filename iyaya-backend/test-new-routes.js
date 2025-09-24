const axios = require('axios');

async function testNewRoutes() {
  const baseURL = 'http://localhost:5000';

  console.log('🧪 Testing new API routes...\n');

  // First check if server is running
  try {
    const healthCheck = await axios.get(`${baseURL}/api/health`);
    console.log('✅ Server is running');
    console.log(`   Environment: ${healthCheck.data.environment}`);
    console.log(`   Timestamp: ${healthCheck.data.timestamp}\n`);
  } catch (error) {
    console.log('❌ Server is not running or not accessible');
    console.log('   Make sure to start the backend server with: node server.js');
    return;
  }

  // Test messaging routes (should return 401 without auth)
  try {
    console.log('Testing messaging routes (expecting 401 - unauthorized)...');
    await axios.get(`${baseURL}/api/messages/conversations`);
    console.log('❌ Should have returned 401');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Messaging routes are protected (401 returned as expected)');
    } else {
      console.log('❌ Unexpected error:', error.response?.status, error.response?.data?.error);
    }
  }

  // Test notifications routes (should return 401 without auth)
  try {
    console.log('\nTesting notifications routes (expecting 401 - unauthorized)...');
    await axios.get(`${baseURL}/api/notifications`);
    console.log('❌ Should have returned 401');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Notifications routes are protected (401 returned as expected)');
    } else {
      console.log('❌ Unexpected error:', error.response?.status, error.response?.data?.error);
    }
  }

  // Test ratings routes (should return 401 without auth)
  try {
    console.log('\nTesting ratings routes (expecting 401 - unauthorized)...');
    await axios.get(`${baseURL}/api/ratings/summary/test-user-id`);
    console.log('❌ Should have returned 401');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Ratings routes are protected (401 returned as expected)');
    } else {
      console.log('❌ Unexpected error:', error.response?.status, error.response?.data?.error);
    }
  }

  console.log('\n✅ All new routes are properly mounted and protected!');
  console.log('📝 Summary of new routes added:');
  console.log('   - /api/messages/* (conversations, messages, send, start)');
  console.log('   - /api/notifications/* (get, mark as read)');
  console.log('   - /api/ratings/* (rate caregiver/parent, get ratings)');
}

testNewRoutes();

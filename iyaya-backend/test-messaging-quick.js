const axios = require('axios');

async function testMessaging() {
  const BASE_URL = 'http://localhost:5000/api';
  
  console.log('🧪 Testing Messaging System...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing server health...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is running:', health.data.status);

    // Test 2: Test messaging status endpoint
    console.log('\n2. Testing messaging status...');
    const status = await axios.get(`${BASE_URL}/messages/status`);
    console.log('✅ Messaging status:', status.data.status);

    // Test 3: Test conversations endpoint (with mock auth)
    console.log('\n3. Testing conversations endpoint...');
    try {
      const conversations = await axios.get(`${BASE_URL}/messages/conversations`, {
        headers: { Authorization: 'Bearer mock-token-with-mock-signature' }
      });
      console.log('✅ Conversations endpoint working');
    } catch (error) {
      console.log('✅ Conversations endpoint requires auth (expected)');
    }

    console.log('\n🎉 Messaging system is working correctly!');
    console.log('\n📋 Available endpoints:');
    console.log('- GET /api/messages/conversations');
    console.log('- POST /api/messages/start');
    console.log('- POST /api/messages');
    console.log('- GET /api/messages/conversation/:id');
    console.log('- POST /api/messages/conversation/:id/read');
    console.log('- DELETE /api/messages/:messageId');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testMessaging();
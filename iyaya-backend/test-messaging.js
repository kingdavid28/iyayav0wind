const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test messaging endpoints
async function testMessaging() {
  console.log('🧪 Testing Messaging System...\n');

  // Mock JWT token for testing
  const mockToken = 'Bearer mock-token-with-mock-signature';
  const headers = { Authorization: mockToken };

  try {
    // Test 1: Get conversations
    console.log('1. Testing GET /api/messages/conversations');
    try {
      const response = await axios.get(`${BASE_URL}/messages/conversations`, { headers });
      console.log('✅ Conversations endpoint working:', response.data.success);
    } catch (error) {
      console.log('❌ Conversations error:', error.response?.data?.error || error.message);
    }

    // Test 2: Start a conversation
    console.log('\n2. Testing POST /api/messages/start');
    try {
      const response = await axios.post(`${BASE_URL}/messages/start`, {
        recipientId: '507f1f77bcf86cd799439011', // Mock ObjectId
        initialMessage: 'Hello, this is a test message!'
      }, { headers });
      console.log('✅ Start conversation working:', response.data.success);
      
      if (response.data.success && response.data.data) {
        const conversationId = response.data.data._id;
        console.log('📝 Created conversation:', conversationId);
        
        // Test 3: Send a message to the conversation
        console.log('\n3. Testing POST /api/messages');
        try {
          const msgResponse = await axios.post(`${BASE_URL}/messages`, {
            conversationId: conversationId,
            text: 'This is a follow-up message!'
          }, { headers });
          console.log('✅ Send message working:', msgResponse.data.success);
        } catch (msgError) {
          console.log('❌ Send message error:', msgError.response?.data?.error || msgError.message);
        }

        // Test 4: Get conversation messages
        console.log('\n4. Testing GET /api/messages/conversation/:id');
        try {
          const msgsResponse = await axios.get(`${BASE_URL}/messages/conversation/${conversationId}`, { headers });
          console.log('✅ Get messages working:', msgsResponse.data.success);
          console.log('📨 Messages count:', msgsResponse.data.data?.messages?.length || 0);
        } catch (msgsError) {
          console.log('❌ Get messages error:', msgsError.response?.data?.error || msgsError.message);
        }
      }
    } catch (error) {
      console.log('❌ Start conversation error:', error.response?.data?.error || error.message);
    }

    // Test 5: Health check
    console.log('\n5. Testing server health');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Server health:', healthResponse.data.status);
    } catch (healthError) {
      console.log('❌ Health check error:', healthError.message);
    }

  } catch (error) {
    console.error('❌ Test setup error:', error.message);
  }
}

// Run the test
testMessaging();
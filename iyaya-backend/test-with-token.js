const axios = require('axios');

async function testWithToken() {
  try {
    console.log('🧪 Testing caregiver profile with mock token...');
    
    // Use the development bypass
    const response = await axios.get('http://192.168.1.10:5000/api/caregivers/profile', {
      headers: {
        // No Authorization header to trigger dev bypass
      }
    });
    
    console.log('✅ Success:', response.data);
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    console.log('Status:', error.response?.status);
  }
}

testWithToken();
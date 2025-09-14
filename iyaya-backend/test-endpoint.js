const axios = require('axios');

async function testEndpoint() {
  try {
    console.log('🧪 Testing caregiver test endpoint...');
    
    const response = await axios.get('http://192.168.1.10:5000/api/caregivers/test-profile/kensite24@gmail.com');
    
    console.log('✅ Success:', response.data);
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

testEndpoint();
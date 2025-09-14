const axios = require('axios');

async function testAuth() {
  try {
    console.log('🧪 Testing caregiver profile endpoint...');
    
    // Test without auth header (should use dev bypass)
    const response = await axios.get('http://192.168.1.10:5000/api/caregivers/profile', {
      headers: {
        'X-Dev-Bypass': '1',
        'X-Dev-Role': 'caregiver'
      }
    });
    
    console.log('✅ Success:', response.data);
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

testAuth();
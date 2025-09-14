const axios = require('axios');

async function testLogin() {
  try {
    console.log('🔐 Testing login...');
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'kensite24@gmail.com',
      password: 'password123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login successful!');
    console.log('📋 Response:', response.data);
    
    if (response.data.token) {
      console.log('🎫 Token received:', response.data.token.substring(0, 50) + '...');
      
      // Test caregiver profile endpoint
      console.log('\n🔍 Testing caregiver profile endpoint...');
      
      const profileResponse = await axios.get('http://localhost:5000/api/caregivers/profile', {
        headers: {
          'Authorization': `Bearer ${response.data.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Profile endpoint successful!');
      console.log('📋 Profile data:', profileResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testLogin();
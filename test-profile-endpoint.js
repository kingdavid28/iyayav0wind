const axios = require('axios');

const API_URL = 'http://192.168.1.10:5000';

async function testProfileEndpoint() {
  try {
    console.log('Testing profile endpoint...');
    
    // First, try to login to get a token
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.token;
      console.log('✅ Login successful');
      
      // Test profile endpoint
      const profileResponse = await axios.get(`${API_URL}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (profileResponse.data.success) {
        console.log('✅ Profile fetch successful');
        console.log('Profile data:', profileResponse.data.data);
      } else {
        console.log('❌ Profile fetch failed:', profileResponse.data.error);
      }
    } else {
      console.log('❌ Login failed:', loginResponse.data.error);
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Error:', error.response.status, error.response.data);
    } else {
      console.log('❌ Network error:', error.message);
    }
  }
}

testProfileEndpoint();
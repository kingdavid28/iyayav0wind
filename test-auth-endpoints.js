const axios = require('axios');

const API_BASE = 'http://192.168.1.10:5000/api';

async function testAuth() {
  console.log('🧪 Testing authentication endpoints...\n');

  try {
    // Test 1: Login with test user
    console.log('1️⃣ Testing login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'maria.santos@example.com',
      password: 'password123'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Login successful');
      const token = loginResponse.data.token;
      console.log('🔑 Token received:', token ? 'Yes' : 'No');
      
      // Test 2: Test profile endpoint
      console.log('\n2️⃣ Testing profile endpoint...');
      try {
        const profileResponse = await axios.get(`${API_BASE}/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('✅ Profile endpoint working');
        console.log('👤 Profile data:', profileResponse.data);
      } catch (profileError) {
        console.log('❌ Profile endpoint failed:', profileError.response?.status, profileError.response?.data?.error);
      }
      
      // Test 3: Test auth/profile endpoint
      console.log('\n3️⃣ Testing auth/profile endpoint...');
      try {
        const authProfileResponse = await axios.get(`${API_BASE}/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('✅ Auth profile endpoint working');
        console.log('👤 Auth profile data:', authProfileResponse.data);
      } catch (authProfileError) {
        console.log('❌ Auth profile endpoint failed:', authProfileError.response?.status, authProfileError.response?.data?.error);
      }
      
    } else {
      console.log('❌ Login failed:', loginResponse.data.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAuth();
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testAPI() {
  console.log('🧪 Testing API endpoints after fixes...\n');

  try {
    // Test 1: Check caregivers endpoint
    console.log('1️⃣ Testing caregiver search...');
    const caregiverResponse = await axios.get(`${API_BASE}/caregivers`);
    console.log('✅ Caregivers found:', caregiverResponse.data.count);
    console.log('📋 Sample caregivers:');
    caregiverResponse.data.caregivers.forEach((caregiver, index) => {
      console.log(`   ${index + 1}. ${caregiver.name} - $${caregiver.hourlyRate}/hr`);
    });

    // Test 2: Test login with test user
    console.log('\n2️⃣ Testing login...');
    try {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: 'maria.santos@example.com',
        password: 'password123'
      });
      console.log('✅ Login successful');
      console.log('🔑 Token received:', !!loginResponse.data.token);
      
      // Test 3: Test authenticated endpoint
      console.log('\n3️⃣ Testing authenticated endpoint...');
      const profileResponse = await axios.get(`${API_BASE}/profile`, {
        headers: {
          'Authorization': `Bearer ${loginResponse.data.token}`
        }
      });
      console.log('✅ Profile endpoint working');
      console.log('👤 User role:', profileResponse.data.role);
      
    } catch (loginError) {
      if (loginError.response?.status === 401 && loginError.response?.data?.requiresVerification) {
        console.log('⚠️ Login requires email verification (expected for new users)');
      } else {
        console.log('❌ Login failed:', loginError.response?.data?.error || loginError.message);
      }
    }

    console.log('\n✅ API tests completed successfully!');

  } catch (error) {
    console.error('❌ API test failed:', error.response?.data || error.message);
  }
}

// Run tests
testAPI();
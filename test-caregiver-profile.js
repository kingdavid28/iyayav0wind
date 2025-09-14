const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_EMAIL = 'kensite24@gmail.com';
const TEST_PASSWORD = 'password123';

async function testCaregiverProfile() {
  console.log('🧪 Testing Caregiver Profile Implementation...\n');

  try {
    // Step 1: Login to get token
    console.log('1️⃣ Testing login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if (!loginResponse.data.success) {
      throw new Error('Login failed: ' + loginResponse.data.error);
    }

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Step 2: Test GET caregiver profile
    console.log('\n2️⃣ Testing GET caregiver profile...');
    try {
      const profileResponse = await axios.get(`${BASE_URL}/caregivers/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ GET profile successful');
      console.log('📋 Profile data:', {
        name: profileResponse.data.caregiver?.name,
        bio: profileResponse.data.caregiver?.bio,
        skills: profileResponse.data.caregiver?.skills?.length || 0,
        hourlyRate: profileResponse.data.caregiver?.hourlyRate
      });
    } catch (error) {
      console.log('❌ GET profile failed:', error.response?.data?.error || error.message);
    }

    // Step 3: Test PUT caregiver profile
    console.log('\n3️⃣ Testing PUT caregiver profile...');
    const updateData = {
      name: 'Test Caregiver Updated',
      bio: 'This is a test bio for the caregiver profile',
      skills: ['Childcare', 'Cooking', 'First Aid'],
      hourlyRate: 25,
      experience: {
        years: 3,
        months: 6,
        description: 'Experienced with children of all ages'
      },
      ageCareRanges: ['TODDLER', 'PRESCHOOL', 'SCHOOL_AGE'],
      availability: {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        hours: { start: '08:00', end: '18:00' },
        flexible: true
      }
    };

    try {
      const updateResponse = await axios.put(`${BASE_URL}/caregivers/profile`, updateData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ PUT profile successful');
      console.log('📋 Updated profile:', {
        name: updateResponse.data.caregiver?.name,
        bio: updateResponse.data.caregiver?.bio?.substring(0, 50) + '...',
        skills: updateResponse.data.caregiver?.skills,
        hourlyRate: updateResponse.data.caregiver?.hourlyRate
      });
    } catch (error) {
      console.log('❌ PUT profile failed:', error.response?.data?.error || error.message);
      if (error.response?.data?.details) {
        console.log('📋 Error details:', error.response.data.details);
      }
    }

    // Step 4: Test frontend service methods
    console.log('\n4️⃣ Testing frontend service integration...');
    
    // Simulate frontend service call
    const frontendTest = {
      baseURL: 'http://localhost:5000/api',
      token: token
    };

    try {
      const serviceResponse = await axios.get(`${frontendTest.baseURL}/caregivers/profile`, {
        headers: {
          'Authorization': `Bearer ${frontendTest.token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Frontend service simulation successful');
      console.log('📋 Service response structure:', {
        hasCaregiver: !!serviceResponse.data.caregiver,
        caregiverFields: Object.keys(serviceResponse.data.caregiver || {}),
        success: serviceResponse.data.success
      });
    } catch (error) {
      console.log('❌ Frontend service simulation failed:', error.response?.data?.error || error.message);
    }

    console.log('\n🎉 Test completed!');

  } catch (error) {
    console.error('💥 Test failed:', error.message);
    if (error.response?.data) {
      console.error('📋 Error response:', error.response.data);
    }
  }
}

// Run the test
testCaregiverProfile();
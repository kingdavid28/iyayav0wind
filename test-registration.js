// Simple test script to verify registration endpoints
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testRegistration() {
  console.log('🧪 Testing Registration Endpoints...\n');

  // Test Parent Registration
  console.log('1. Testing Parent Registration:');
  try {
    const parentData = {
      email: `parent_test_${Date.now()}@example.com`,
      password: 'TestPassword123!',
      name: 'Test Parent',
      firstName: 'Test',
      lastName: 'Parent',
      middleInitial: 'T',
      birthDate: '1990-01-01',
      phone: '+1234567890',
      role: 'parent'
    };

    const parentResponse = await axios.post(`${API_BASE_URL}/auth/register`, parentData);
    console.log('✅ Parent registration successful:', {
      success: parentResponse.data.success,
      userId: parentResponse.data.user?.id,
      role: parentResponse.data.user?.role
    });
  } catch (error) {
    console.log('❌ Parent registration failed:', {
      status: error.response?.status,
      message: error.response?.data?.error || error.message
    });
  }

  console.log('');

  // Test Caregiver Registration
  console.log('2. Testing Caregiver Registration:');
  try {
    const caregiverData = {
      email: `caregiver_test_${Date.now()}@example.com`,
      password: 'TestPassword123!',
      name: 'Test Caregiver',
      firstName: 'Test',
      lastName: 'Caregiver',
      middleInitial: 'C',
      birthDate: '1985-01-01',
      phone: '+1234567891',
      role: 'caregiver'
    };

    const caregiverResponse = await axios.post(`${API_BASE_URL}/auth/register`, caregiverData);
    console.log('✅ Caregiver registration successful:', {
      success: caregiverResponse.data.success,
      userId: caregiverResponse.data.user?.id,
      role: caregiverResponse.data.user?.role
    });
  } catch (error) {
    console.log('❌ Caregiver registration failed:', {
      status: error.response?.status,
      message: error.response?.data?.error || error.message
    });
  }

  console.log('');

  // Test Health Check
  console.log('3. Testing Health Check:');
  try {
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health check successful:', healthResponse.data.status);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }
}

// Run the test
testRegistration().catch(console.error);
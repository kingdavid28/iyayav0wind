const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:5000/api';

async function testJobCreation() {
  try {
    console.log('🧪 Testing job creation API...');
    
    // Test health check first
    console.log('1. Testing health check...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    if (healthResponse.ok) {
      console.log('✅ Backend is running');
    } else {
      console.log('❌ Backend health check failed');
      return;
    }
    
    // Test job creation with mock token
    console.log('2. Testing job creation...');
    const jobData = {
      title: 'Test Nanny Job',
      description: 'Looking for a caring nanny for our 2 children',
      location: 'Manila, Philippines',
      rate: 300,
      startDate: '2024-01-15',
      workingHours: '9:00 AM to 5:00 PM',
      requirements: ['CPR Certified', 'Experience with toddlers'],
      children: [
        { name: 'Alice', age: 3 },
        { name: 'Bob', age: 5 }
      ]
    };
    
    const response = await fetch(`${API_BASE_URL}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token-with-mock-signature',
        'X-Dev-Bypass': '1',
        'X-Dev-Role': 'parent'
      },
      body: JSON.stringify(jobData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Job creation successful!');
      console.log('📋 Created job:', result.data.job);
    } else {
      console.log('❌ Job creation failed:', result);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

testJobCreation();
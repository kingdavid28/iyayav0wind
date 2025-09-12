const fetch = require('node-fetch');

// Test profile update endpoint
async function testProfileUpdate() {
  const API_URL = 'http://192.168.1.10:5000/api';
  
  // Mock Firebase token (you'll need to replace this with a real token)
  const mockToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjY4YTZkZjNiYzM3YTFjZmNkNDFmNGVhOCIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJpeWF5YWdpdCIsImF1dGhfdGltZSI6MTczNjY4MzI4MCwiZW1haWwiOiJraW5nZGF2aWQyOGFAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImV4cCI6MTczNjY4Njg4MCwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJraW5nZGF2aWQyOGFAZ21haWwuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifSwiaWF0IjoxNzM2NjgzMjgwLCJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vaXlheWFnaXQiLCJzdWIiOiJZY20yTGxzN0pNYzNvWEFqd2E2eHRZU0Y5WjcyIiwidXNlcl9pZCI6IlljbTJMbHM3Sk1jM29YQWp3YTZ4dFlTRjlaNzIifQ';
  
  try {
    console.log('🧪 Testing profile update endpoint...');
    
    const profileData = {
      name: 'Test User Update',
      contact: '09123456789',
      location: 'Test Location'
    };
    
    const response = await fetch(`${API_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profileData)
    });
    
    const data = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Profile update test passed!');
    } else {
      console.log('❌ Profile update test failed:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Test authentication endpoint
async function testAuth() {
  const API_URL = 'http://192.168.1.10:5000/api';
  
  try {
    console.log('🧪 Testing authentication endpoint...');
    
    const response = await fetch(`${API_URL}/auth/firebase-profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer mock-token`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    console.log('📊 Auth Response Status:', response.status);
    console.log('📊 Auth Response Data:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Auth test error:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting profile update tests...\n');
  
  await testAuth();
  console.log('\n' + '='.repeat(50) + '\n');
  await testProfileUpdate();
  
  console.log('\n✨ Tests completed!');
}

runTests();
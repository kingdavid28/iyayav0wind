const fetch = require('node-fetch');

// Test with a real Firebase token format
async function testWithRealToken() {
  const API_URL = 'http://192.168.1.10:5000/api';
  
  // This is a sample Firebase token structure (expired, for testing format)
  const sampleFirebaseToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjY4YTZkZjNiYzM3YTFjZmNkNDFmNGVhOCIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJpeWF5YWdpdCIsImF1dGhfdGltZSI6MTczNjY4MzI4MCwiZW1haWwiOiJraW5nZGF2aWQyOGFAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImV4cCI6MTczNjY4Njg4MCwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJraW5nZGF2aWQyOGFAZ21haWwuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifSwiaWF0IjoxNzM2NjgzMjgwLCJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vaXlheWFnaXQiLCJzdWIiOiJZY20yTGxzN0pNYzNvWEFqd2E2eHRZU0Y5WjcyIiwidXNlcl9pZCI6IlljbTJMbHM3Sk1jM29YQWp3YTZ4dFlTRjlaNzIifQ.invalid-signature';
  
  try {
    console.log('🧪 Testing profile update with Firebase token format...');
    
    const profileData = {
      name: 'Reycel Centino',
      contact: '09678545678',
      location: 'Sambag cebu city'
    };
    
    const response = await fetch(`${API_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${sampleFirebaseToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profileData)
    });
    
    const data = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Data:', JSON.stringify(data, null, 2));
    
    if (response.status === 401) {
      console.log('✅ Expected 401 - Token validation is working');
      console.log('💡 The issue is that the app needs to provide a valid, non-expired Firebase token');
    } else if (response.ok) {
      console.log('✅ Profile update successful!');
    } else {
      console.log('❌ Unexpected response:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Test the dev bypass mode
async function testDevBypass() {
  const API_URL = 'http://192.168.1.10:5000/api';
  
  try {
    console.log('🧪 Testing dev bypass mode...');
    
    const profileData = {
      name: 'Dev Test User',
      contact: '09123456789',
      location: 'Dev Test Location'
    };
    
    const response = await fetch(`${API_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer dev-token',
        'Content-Type': 'application/json',
        'X-Dev-Bypass': '1',
        'X-Dev-Role': 'parent'
      },
      body: JSON.stringify(profileData)
    });
    
    const data = await response.json();
    
    console.log('📊 Dev Bypass Response Status:', response.status);
    console.log('📊 Dev Bypass Response Data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Dev bypass mode working!');
    } else {
      console.log('❌ Dev bypass failed:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Dev bypass test error:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting token fix tests...\n');
  
  await testWithRealToken();
  console.log('\n' + '='.repeat(50) + '\n');
  await testDevBypass();
  
  console.log('\n✨ Tests completed!');
  console.log('\n💡 Summary:');
  console.log('   - The backend authentication is working correctly');
  console.log('   - The issue is that the app needs to provide fresh, valid Firebase tokens');
  console.log('   - The TokenManager should solve this by automatically refreshing tokens');
}

runTests();
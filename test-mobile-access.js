const fetch = require('node-fetch');

async function testMobileAccess() {
  const MOBILE_API_URL = 'http://192.168.1.10:5000/api';
  
  console.log('📱 Testing mobile device access to backend...\n');
  
  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${MOBILE_API_URL}/health`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health check successful');
      console.log(`   Status: ${healthResponse.status}`);
      console.log(`   Response: ${JSON.stringify(healthData, null, 2)}\n`);
    } else {
      console.log(`❌ Health check failed: ${healthResponse.status}\n`);
      return;
    }
    
    // Test image upload endpoint (without auth for now)
    console.log('2. Testing image upload endpoint...');
    const uploadResponse = await fetch(`${MOBILE_API_URL}/auth/upload-profile-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A'
      })
    });
    
    console.log(`   Status: ${uploadResponse.status}`);
    
    if (uploadResponse.status === 401) {
      console.log('✅ Upload endpoint accessible (401 expected without valid token)');
    } else if (uploadResponse.ok) {
      console.log('✅ Upload endpoint accessible and working');
    } else {
      const errorData = await uploadResponse.text();
      console.log(`⚠️  Upload endpoint returned: ${uploadResponse.status}`);
      console.log(`   Response: ${errorData}`);
    }
    
    console.log('\n🎉 Backend is accessible from mobile device IP!');
    console.log('📱 Your mobile app should be able to connect to the backend.');
    
  } catch (error) {
    console.error('💥 Mobile access test failed:', error.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Make sure Windows Firewall allows connections on port 5000');
    console.log('2. Check if your router blocks internal network communication');
    console.log('3. Try running: netsh advfirewall firewall add rule name="Node.js Server" dir=in action=allow protocol=TCP localport=5000');
  }
}

testMobileAccess();
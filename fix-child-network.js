// Quick network connectivity test and fix for child save functionality

const testBackendConnection = async () => {
  const API_BASE_URL = 'http://10.162.42.117:5000/api';
  
  try {
    console.log('🔍 Testing backend connection...');
    
    // Test health endpoint
    const healthResponse = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Backend is running:', healthData);
      return true;
    } else {
      console.log('❌ Backend health check failed:', healthResponse.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Network connection failed:', error.message);
    return false;
  }
};

// Test the connection
testBackendConnection().then(isConnected => {
  if (isConnected) {
    console.log('✅ Backend connection successful - child save should work');
  } else {
    console.log('❌ Backend connection failed - need to start backend server');
    console.log('💡 Run: cd iyaya-backend && node app.js');
  }
});
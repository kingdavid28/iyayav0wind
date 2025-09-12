// Test the exact child creation API call that's failing

const testChildCreate = async () => {
  const API_BASE_URL = 'http://10.162.42.117:5000/api';
  
  // Test data
  const childData = {
    name: 'Test Child',
    age: 5,
    allergies: 'None',
    preferences: 'Likes to play'
  };
  
  try {
    console.log('Testing child creation API...');
    console.log('Payload:', JSON.stringify(childData, null, 2));
    
    // This will fail without a valid token, but we can see the response
    const response = await fetch(`${API_BASE_URL}/children`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token-for-testing'
      },
      body: JSON.stringify(childData)
    });
    
    console.log('Response status:', response.status);
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (response.status === 401) {
      console.log('Child creation endpoint exists (401 = needs valid auth)');
      return true;
    } else if (response.status === 404) {
      console.log('Child creation endpoint not found (404)');
      return false;
    } else {
      console.log('Unexpected response:', response.status);
      return false;
    }
  } catch (error) {
    console.log('Child creation API test failed:', error.message);
    
    if (error.message.includes('Network request failed')) {
      console.log('This is the same error you are seeing in the app!');
      console.log('Possible causes:');
      console.log('   - Backend not running on port 5000');
      console.log('   - Network connectivity issue');
      console.log('   - CORS configuration problem');
    }
    
    return false;
  }
};

testChildCreate();
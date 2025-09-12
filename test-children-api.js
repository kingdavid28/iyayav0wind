// Test children API endpoints specifically

const testChildrenAPI = async () => {
  const API_BASE_URL = 'http://10.162.42.117:5000/api';
  
  try {
    console.log('🔍 Testing children API endpoint...');
    
    // Test GET /api/children (should require auth)
    const childrenResponse = await fetch(`${API_BASE_URL}/children`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // This will fail but show us the endpoint exists
      }
    });
    
    console.log('📡 Children GET response status:', childrenResponse.status);
    
    if (childrenResponse.status === 401) {
      console.log('✅ Children endpoint exists (401 = needs auth)');
      return true;
    } else if (childrenResponse.status === 404) {
      console.log('❌ Children endpoint not found (404)');
      return false;
    } else {
      console.log('⚠️ Unexpected response:', childrenResponse.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Children API test failed:', error.message);
    return false;
  }
};

testChildrenAPI();
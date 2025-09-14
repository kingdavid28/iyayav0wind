const axios = require('axios');

async function testHealth() {
  try {
    console.log('🧪 Testing health endpoint...');
    
    const response = await axios.get('http://192.168.1.10:5000/api/health');
    
    console.log('✅ Health check success:', response.data);
  } catch (error) {
    console.log('❌ Health check error:', error.response?.data || error.message);
  }
}

testHealth();
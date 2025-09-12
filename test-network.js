const fetch = require('node-fetch');

const BACKEND_URLS = [
  'http://localhost:5000/api/health',
  'http://127.0.0.1:5000/api/health',
  'http://192.168.1.10:5000/api/health'
];

async function testNetworkConnectivity() {
  console.log('🌐 Testing network connectivity to backend...\n');
  
  for (const url of BACKEND_URLS) {
    try {
      console.log(`Testing: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ SUCCESS: ${url}`);
        console.log(`   Status: ${response.status}`);
        console.log(`   Response: ${JSON.stringify(data, null, 2)}\n`);
        return url;
      } else {
        console.log(`❌ FAILED: ${url} - Status: ${response.status}\n`);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`⏰ TIMEOUT: ${url} - Request timed out\n`);
      } else {
        console.log(`💥 ERROR: ${url} - ${error.message}\n`);
      }
    }
  }
  
  console.log('❌ All backend URLs failed. Please check:');
  console.log('1. Backend server is running (node app.js in iyaya-backend folder)');
  console.log('2. Port 5000 is not blocked by firewall');
  console.log('3. Network configuration is correct');
  
  return null;
}

testNetworkConnectivity();
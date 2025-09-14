// Simple backend connectivity test
const fetch = require('node-fetch');

const testBackend = async () => {
  const urls = [
    'http://192.168.1.10:3000/api/health',
    'http://192.168.1.10:3000/health',
    'http://192.168.1.10:3000',
    'http://localhost:3000/api/health',
    'http://localhost:3000/health',
    'http://localhost:3000'
  ];

  for (const url of urls) {
    try {
      console.log(`Testing: ${url}`);
      const response = await fetch(url, { timeout: 5000 });
      console.log(`✅ ${url} - Status: ${response.status}`);
      const text = await response.text();
      console.log(`Response: ${text.substring(0, 100)}...`);
      break;
    } catch (error) {
      console.log(`❌ ${url} - Error: ${error.message}`);
    }
  }
};

testBackend();
const http = require('http');

const checkBackend = () => {
  const options = {
    hostname: 'localhost',
    port: 5001,
    path: '/api/health',
    method: 'GET',
    timeout: 3000
  };

  const req = http.request(options, (res) => {
    console.log('✅ Backend is running!');
    console.log(`Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('Response:', response);
      } catch (e) {
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (err) => {
    console.log('❌ Backend is not running!');
    console.log('Error:', err.message);
    console.log('\n📋 To start the backend:');
    console.log('1. Open a new terminal');
    console.log('2. Run: start-backend.bat');
    console.log('3. Or manually: cd iyaya-backend && npm run server');
  });

  req.on('timeout', () => {
    console.log('⏰ Backend connection timeout');
    req.destroy();
  });

  req.end();
};

checkBackend();
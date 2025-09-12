const os = require('os');

function getNetworkIP() {
  const interfaces = os.networkInterfaces();
  
  console.log('🌐 Available Network Interfaces:');
  console.log('================================\n');
  
  for (const [name, addresses] of Object.entries(interfaces)) {
    console.log(`Interface: ${name}`);
    
    addresses.forEach((addr, index) => {
      if (addr.family === 'IPv4' && !addr.internal) {
        console.log(`  ✅ IPv4: ${addr.address} (External)`);
      } else if (addr.family === 'IPv4' && addr.internal) {
        console.log(`  🏠 IPv4: ${addr.address} (Internal)`);
      }
    });
    console.log('');
  }
  
  // Find the main network IP
  const networkIPs = [];
  for (const addresses of Object.values(interfaces)) {
    for (const addr of addresses) {
      if (addr.family === 'IPv4' && !addr.internal) {
        networkIPs.push(addr.address);
      }
    }
  }
  
  if (networkIPs.length > 0) {
    console.log(`🎯 Recommended IP for mobile device: ${networkIPs[0]}`);
    console.log(`📱 Update your frontend API URL to: http://${networkIPs[0]}:5000/api`);
  } else {
    console.log('❌ No external IPv4 address found');
  }
}

getNetworkIP();
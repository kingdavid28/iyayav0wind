#!/usr/bin/env node

/**
 * Network Setup Script for Expo Go
 * Helps configure the correct IP address for development
 */

const os = require('os');
const fs = require('fs');
const path = require('path');

// Get network interfaces
function getNetworkIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  
  Object.keys(interfaces).forEach(name => {
    interfaces[name].forEach(iface => {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push({
          name,
          address: iface.address,
          netmask: iface.netmask
        });
      }
    });
  });
  
  return ips;
}

// Update API configuration file
function updateAPIConfig(newIP) {
  const apiConfigPath = path.join(__dirname, '..', 'src', 'config', 'api.js');
  
  if (!fs.existsSync(apiConfigPath)) {
    console.error('❌ API config file not found:', apiConfigPath);
    return false;
  }
  
  try {
    let content = fs.readFileSync(apiConfigPath, 'utf8');
    
    // Replace the primary IP in baseURLs array
    content = content.replace(
      /baseURLs: \[\s*'http:\/\/[^']+:5001\/api'/,
      `baseURLs: [\n      'http://${newIP}:5001/api'`
    );
    
    // Replace the primary IP in socketURLs array  
    content = content.replace(
      /socketURLs: \[\s*'http:\/\/[^']+:5001'/,
      `socketURLs: [\n      'http://${newIP}:5001'`
    );
    
    // Replace the primary baseURL
    content = content.replace(
      /baseURL: 'http:\/\/[^']+:5001\/api'/,
      `baseURL: 'http://${newIP}:5001/api'`
    );
    
    // Replace the primary socketURL
    content = content.replace(
      /socketURL: 'http:\/\/[^']+:5001'/,
      `socketURL: 'http://${newIP}:5001'`
    );
    
    fs.writeFileSync(apiConfigPath, content);
    console.log('✅ Updated API configuration');
    return true;
  } catch (error) {
    console.error('❌ Failed to update API config:', error.message);
    return false;
  }
}

// Main setup function
function setupNetwork() {
  console.log('\n🚀 Expo Go Network Setup\n');
  
  const ips = getNetworkIPs();
  
  if (ips.length === 0) {
    console.log('❌ No network interfaces found');
    console.log('Make sure you are connected to WiFi or Ethernet');
    return;
  }
  
  console.log('📡 Available network interfaces:');
  ips.forEach((ip, index) => {
    console.log(`${index + 1}. ${ip.name}: ${ip.address}`);
  });
  
  // Auto-select the most likely interface
  const preferredIP = ips.find(ip => 
    ip.address.startsWith('192.168.') || 
    ip.address.startsWith('10.0.') ||
    ip.address.startsWith('172.16.')
  ) || ips[0];
  
  console.log(`\n✅ Recommended IP: ${preferredIP.address} (${preferredIP.name})`);
  
  // Update configuration
  if (updateAPIConfig(preferredIP.address)) {
    console.log('\n📋 Next steps:');
    console.log('1. Restart the backend server:');
    console.log('   cd iyaya-backend && npm run dev');
    console.log('2. Restart Expo with cache clear:');
    console.log('   npx expo start --clear');
    console.log('3. Make sure your phone is on the same WiFi network');
    console.log('4. Scan the QR code with Expo Go app');
    
    console.log('\n🔧 If connection fails:');
    console.log('• Check Windows Firewall settings');
    console.log('• Try: npx expo start --tunnel');
    console.log('• Ensure backend runs on 0.0.0.0:5001');
  }
  
  console.log(`\n📱 Your backend will be available at: http://${preferredIP.address}:5001`);
}

// Run if called directly
if (require.main === module) {
  setupNetwork();
}

module.exports = { setupNetwork, getNetworkIPs, updateAPIConfig };
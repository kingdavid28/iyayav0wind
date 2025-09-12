import { Platform } from 'react-native';
/**
 * Network Configuration Helper for Expo Go
 * Helps detect and configure the correct IP address for different network setups
 */

const getCurrentAPIURL = () => 'http://192.168.1.26:3000/api';

export const NetworkConfig = {
  // Common network IP ranges
  COMMON_IPS: [
    '192.168.1.26',   // Current working IP
    '192.168.1.10',   // Alternative
    '192.168.0.10',   // Common home router
    '10.0.0.10',      // Apple/corporate networks
    '172.16.0.10',    // Corporate VPN
  ],

  // Test if an IP is reachable
  testConnection: async (ip, port = 5000) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch(`http://${ip}:${port}/api/health`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  },

  // Find working backend IP
  findWorkingIP: async (port = 5000) => {
    console.log('🔍 Scanning for backend server...');
    
    for (const ip of NetworkConfig.COMMON_IPS) {
      console.log(`Testing ${ip}:${port}...`);
      const isWorking = await NetworkConfig.testConnection(ip, port);
      
      if (isWorking) {
        console.log(`✅ Found working backend at ${ip}:${port}`);
        return ip;
      }
    }
    
    console.warn('⚠️ No working backend found');
    return null;
  },

  // Get network setup instructions
  getSetupInstructions: () => {
    const currentAPI = getCurrentAPIURL();
    const currentIP = currentAPI.match(/http:\/\/([^:]+):/)?.[1] || 'unknown';
    
    return {
      currentIP,
      currentAPI,
      instructions: [
        '📱 Expo Go Network Setup:',
        '',
        '1. Make sure your phone and computer are on the same WiFi network',
        '2. Find your computer\'s IP address:',
        '   • Windows: Run "ipconfig" in Command Prompt',
        '   • Mac: Run "ifconfig" in Terminal', 
        '   • Look for "IPv4 Address" or "inet" (usually 192.168.x.x)',
        '',
        '3. Update the IP in src/config/api.js if needed',
        '4. Restart the backend server: node app.js',
        '5. Restart Expo: npx expo start --clear',
        '',
        `Current backend IP: ${currentIP}`,
        `Current API URL: ${currentAPI}`,
        '',
        '🔧 Troubleshooting:',
        '• Try disabling Windows Firewall temporarily',
        '• Check if port 5000 is blocked',
        '• Use "npx expo start --tunnel" for network issues',
        '• Ensure backend server is running on 0.0.0.0:5000'
      ]
    };
  },

  // Auto-configure for current network
  autoDetectAndConfigure: async () => {
    console.log('🚀 Auto-detecting network configuration...');
    
    const workingIP = await NetworkConfig.findWorkingIP();
    
    if (workingIP) {
      console.log(`✅ Auto-configured for IP: ${workingIP}`);
      return {
        success: true,
        ip: workingIP,
        baseURL: `http://${workingIP}:5000/api`,
        socketURL: `http://${workingIP}:5000`
      };
    } else {
      console.warn('⚠️ Auto-configuration failed');
      return {
        success: false,
        instructions: NetworkConfig.getSetupInstructions()
      };
    }
  },

  // Log current network status
  logNetworkStatus: () => {
    const setup = NetworkConfig.getSetupInstructions();
    console.log('\n' + '='.repeat(50));
    console.log('📡 NETWORK CONFIGURATION STATUS');
    console.log('='.repeat(50));
    setup.instructions.forEach(line => console.log(line));
    console.log('='.repeat(50) + '\n');
  }
};

// Initialize network monitoring
export const initializeNetworkConfig = () => {
  if (__DEV__) {
    setTimeout(() => {
      NetworkConfig.autoDetectAndConfigure().then(result => {
        if (!result.success) {
          NetworkConfig.logNetworkStatus();
        }
      });
    }, 3000);
  }
};

// Export for manual initialization
export const configureNetwork = NetworkConfig.autoDetectAndConfigure;
export const getNetworkStatus = NetworkConfig.getSetupInstructions;
export const testConnection = NetworkConfig.testConnection;

export default NetworkConfig;

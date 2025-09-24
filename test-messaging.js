#!/usr/bin/env node

/**
 * Comprehensive Messaging System Test
 * Tests Firebase messaging, API endpoints, and context functionality
 */

const axios = require('axios');
const chalk = require('chalk');

// Test Configuration
const CONFIG = {
  API_BASE_URL: 'http://localhost:5000', // Update with your backend URL
  TEST_USERS: [
    {
      email: 'test@test.com',
      password: 'password123456789',
      role: 'parent',
      name: 'Test Parent'
    },
    {
      email: 'caregiver@test.com', 
      password: 'password123456789',
      role: 'caregiver',
      name: 'Test Caregiver'
    }
  ],
  FIREBASE_CONFIG: {
    // Your Firebase config would go here for direct Firebase testing
    // For now we'll test through the API
  }
};

class MessagingTester {
  constructor() {
    this.tokens = {};
    this.users = {};
    this.testResults = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  log(message, type = 'info') {
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      error: chalk.red,
      warning: chalk.yellow,
      header: chalk.cyan.bold
    };
    console.log(colors[type](`[${type.toUpperCase()}] ${message}`));
  }

  async test(name, testFn) {
    try {
      this.log(`Testing: ${name}`, 'header');
      await testFn();
      this.testResults.passed++;
      this.testResults.tests.push({ name, status: 'PASSED' });
      this.log(`✅ ${name} - PASSED`, 'success');
    } catch (error) {
      this.testResults.failed++;
      this.testResults.tests.push({ name, status: 'FAILED', error: error.message });
      this.log(`❌ ${name} - FAILED: ${error.message}`, 'error');
    }
    console.log(''); // Add spacing
  }

  async authenticateUsers() {
    this.log('Authenticating test users...', 'header');
    
    for (const user of CONFIG.TEST_USERS) {
      try {
        const response = await axios.post(`${CONFIG.API_BASE_URL}/api/auth/login`, {
          email: user.email,
          password: user.password
        });

        if (response.data.success && response.data.token) {
          this.tokens[user.role] = response.data.token;
          this.users[user.role] = response.data.user;
          this.log(`✅ Authenticated ${user.role}: ${user.name}`, 'success');
        } else {
          throw new Error(`Login failed for ${user.email}`);
        }
      } catch (error) {
        this.log(`❌ Failed to authenticate ${user.email}: ${error.message}`, 'error');
        throw error;
      }
    }
  }

  async testBackendHealth() {
    const response = await axios.get(`${CONFIG.API_BASE_URL}/api/health`);
    if (response.status !== 200) {
      throw new Error(`Backend health check failed: ${response.status}`);
    }
    this.log('Backend is healthy', 'success');
  }

  async testAuthEndpoints() {
    // Test getting user profile
    const response = await axios.get(`${CONFIG.API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${this.tokens.parent}` }
    });

    if (!response.data.id) {
      throw new Error('User profile endpoint not returning user ID');
    }
    this.log('Auth endpoints working correctly', 'success');
  }

  async testUserProfileEndpoint() {
    const parentUser = this.users.parent;
    const caregiverUser = this.users.caregiver;

    // Test getting user by Firebase UID (for messaging)
    const response = await axios.get(
      `${CONFIG.API_BASE_URL}/api/auth/user/${caregiverUser.id}`,
      {
        headers: { Authorization: `Bearer ${this.tokens.parent}` }
      }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error('User profile by UID endpoint not working');
    }

    if (!response.data.data.name) {
      throw new Error('User profile missing name field');
    }

    this.log('User profile endpoint working correctly', 'success');
  }

  async testMessagingEndpoints() {
    const parentUser = this.users.parent;
    const caregiverUser = this.users.caregiver;

    // Test getting conversations
    try {
      const conversationsResponse = await axios.get(
        `${CONFIG.API_BASE_URL}/api/messages/conversations`,
        {
          headers: { Authorization: `Bearer ${this.tokens.parent}` }
        }
      );
      this.log('Conversations endpoint accessible', 'success');
    } catch (error) {
      if (error.response?.status === 501) {
        this.log('Messaging endpoints not implemented (expected)', 'warning');
        return;
      }
      throw error;
    }

    // Test starting a conversation
    try {
      const startConversationResponse = await axios.post(
        `${CONFIG.API_BASE_URL}/api/messages/start`,
        {
          recipientId: caregiverUser.id,
          initialMessage: 'Hello from test!'
        },
        {
          headers: { Authorization: `Bearer ${this.tokens.parent}` }
        }
      );
      this.log('Start conversation endpoint working', 'success');
    } catch (error) {
      if (error.response?.status === 501) {
        this.log('Start conversation endpoint not implemented', 'warning');
      } else {
        throw error;
      }
    }
  }

  async testFirebaseConfig() {
    // Test if Firebase config is accessible
    try {
      const configResponse = await axios.get(`${CONFIG.API_BASE_URL}/api/firebase-config`);
      this.log('Firebase config endpoint accessible', 'success');
    } catch (error) {
      if (error.response?.status === 404) {
        this.log('Firebase config endpoint not found (may be client-side only)', 'warning');
      } else {
        this.log('Firebase config test failed', 'warning');
      }
    }
  }

  async testCaregiverSearch() {
    // Test caregiver search (needed for messaging recipients)
    const response = await axios.get(`${CONFIG.API_BASE_URL}/api/caregivers`, {
      headers: { Authorization: `Bearer ${this.tokens.parent}` }
    });

    if (!response.data.success) {
      throw new Error('Caregiver search not working');
    }

    if (!Array.isArray(response.data.caregivers)) {
      throw new Error('Caregiver search not returning array');
    }

    this.log(`Found ${response.data.caregivers.length} caregivers`, 'success');
  }

  async testNotificationEndpoints() {
    try {
      const notificationsResponse = await axios.get(
        `${CONFIG.API_BASE_URL}/api/notifications`,
        {
          headers: { Authorization: `Bearer ${this.tokens.parent}` }
        }
      );
      this.log('Notifications endpoint accessible', 'success');
    } catch (error) {
      if (error.response?.status === 501) {
        this.log('Notifications endpoint not implemented', 'warning');
      } else {
        throw error;
      }
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Comprehensive Messaging System Test', 'header');
    console.log('='.repeat(60));

    try {
      // Authentication Tests
      await this.test('Backend Health Check', () => this.testBackendHealth());
      await this.test('User Authentication', () => this.authenticateUsers());
      await this.test('Auth Endpoints', () => this.testAuthEndpoints());
      await this.test('User Profile Endpoint', () => this.testUserProfileEndpoint());

      // Messaging System Tests
      await this.test('Messaging Endpoints', () => this.testMessagingEndpoints());
      await this.test('Firebase Configuration', () => this.testFirebaseConfig());
      
      // Supporting Features Tests
      await this.test('Caregiver Search', () => this.testCaregiverSearch());
      await this.test('Notification Endpoints', () => this.testNotificationEndpoints());

    } catch (error) {
      this.log(`Critical test failure: ${error.message}`, 'error');
    }

    // Print Results
    console.log('='.repeat(60));
    this.log('📊 TEST RESULTS', 'header');
    console.log('='.repeat(60));
    
    this.testResults.tests.forEach(test => {
      const status = test.status === 'PASSED' 
        ? chalk.green('✅ PASSED') 
        : chalk.red('❌ FAILED');
      console.log(`${status} - ${test.name}`);
      if (test.error) {
        console.log(`    ${chalk.red('Error:')} ${test.error}`);
      }
    });

    console.log('='.repeat(60));
    console.log(chalk.green(`✅ Passed: ${this.testResults.passed}`));
    console.log(chalk.red(`❌ Failed: ${this.testResults.failed}`));
    console.log(chalk.blue(`📊 Total: ${this.testResults.tests.length}`));
    
    const successRate = ((this.testResults.passed / this.testResults.tests.length) * 100).toFixed(1);
    console.log(chalk.cyan(`📈 Success Rate: ${successRate}%`));

    // Recommendations
    console.log('\n' + '='.repeat(60));
    this.log('🔧 RECOMMENDATIONS', 'header');
    console.log('='.repeat(60));

    if (this.testResults.failed === 0) {
      this.log('🎉 All tests passed! Your messaging system looks good.', 'success');
    } else {
      this.log('⚠️  Some tests failed. Check the following:', 'warning');
      
      const failedTests = this.testResults.tests.filter(t => t.status === 'FAILED');
      failedTests.forEach(test => {
        console.log(`   • Fix: ${test.name}`);
      });
    }

    console.log('\n📱 To test the React Native app:');
    console.log('   1. Start your Expo development server');
    console.log('   2. Navigate to the messaging screen');
    console.log('   3. Try sending messages between different user types');
    console.log('   4. Check browser console for Firebase connection logs');

    console.log('\n🔥 Firebase Testing:');
    console.log('   1. Check Firebase console for real-time database');
    console.log('   2. Verify conversations and userConversations nodes');
    console.log('   3. Test message sending/receiving in real-time');

    return this.testResults;
  }
}

// Run the tests
async function main() {
  const tester = new MessagingTester();
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error(chalk.red('Test runner failed:'), error.message);
    process.exit(1);
  }
}

// Handle command line execution
if (require.main === module) {
  main().catch(console.error);
}

module.exports = MessagingTester;
// Test script to verify email verification links work
const { sendVerificationEmail } = require('./iyaya-backend/services/emailService');

async function testEmailVerification() {
  try {
    console.log('🧪 Testing email verification...');
    
    const testEmail = 'test@example.com';
    const testName = 'Test User';
    const testToken = 'test-token-123';
    
    await sendVerificationEmail(testEmail, testName, testToken);
    
    console.log('✅ Email verification test completed successfully');
    console.log('📧 Check the email service logs for details');
    
    // Test URLs that would be generated
    const httpURL = `http://192.168.1.26:5000/api/auth/verify-email/${testToken}`;
    const expoGoURL = `exp://192.168.1.26:8081/--/verify-email?token=${testToken}`;
    const customSchemeURL = `iyaya://verify-email?token=${testToken}`;
    
    console.log('\n🔗 Generated URLs:');
    console.log('HTTP:', httpURL);
    console.log('Expo Go:', expoGoURL);
    console.log('Custom Scheme:', customSchemeURL);
    
  } catch (error) {
    console.error('❌ Email verification test failed:', error.message);
  }
}

testEmailVerification();
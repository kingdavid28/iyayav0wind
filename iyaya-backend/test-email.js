require('dotenv').config();
const { sendVerificationEmail } = require('./services/emailService');

async function testEmail() {
  try {
    console.log('Testing email with credentials:');
    console.log('EMAIL_USERNAME:', process.env.EMAIL_USERNAME);
    console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '[SET]' : '[NOT SET]');
    
    await sendVerificationEmail('test@example.com', 'Test User', 'test-token-123');
    console.log('✅ Email sent successfully');
  } catch (error) {
    console.error('❌ Email failed:', error.message);
  }
}

testEmail();
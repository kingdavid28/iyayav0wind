const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models and auth controller
const User = require('./models/User');
const authController = require('./controllers/auth');

async function testLogin() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/iyaya');
    console.log('✅ Connected to MongoDB');

    // Test user credentials
    const testCredentials = [
      { email: 'kensite24@gmail.com', password: 'password123' },
      { email: 'giver@gmail.com', password: 'password123' },
      { email: 'rere.centno.swu@phinmaed.com', password: 'password123' }
    ];

    console.log('\n🧪 Testing login functionality...\n');

    for (const creds of testCredentials) {
      console.log(`Testing login for: ${creds.email}`);
      
      // Find user in database
      const user = await User.findOne({ email: creds.email }).select('+password');
      
      if (!user) {
        console.log(`❌ User not found: ${creds.email}`);
        continue;
      }
      
      console.log(`✅ User found: ${user.name} (${user.role}/${user.userType})`);
      console.log(`   Password hash exists: ${!!user.password}`);
      
      // Test password comparison
      const isMatch = await user.comparePassword(creds.password);
      console.log(`   Password match: ${isMatch ? '✅' : '❌'}`);
      
      // Test bcrypt directly
      const directMatch = await bcrypt.compare(creds.password, user.password);
      console.log(`   Direct bcrypt match: ${directMatch ? '✅' : '❌'}`);
      
      console.log('');
    }

    // Test with wrong password
    console.log('Testing with wrong password...');
    const user = await User.findOne({ email: 'kensite24@gmail.com' }).select('+password');
    if (user) {
      const wrongMatch = await user.comparePassword('wrongpassword');
      console.log(`Wrong password test: ${wrongMatch ? '❌ Should be false!' : '✅ Correctly rejected'}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testLogin();
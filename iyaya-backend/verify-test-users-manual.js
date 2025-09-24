require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function verifyTestUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📊 Connected to MongoDB');

    // Verify test users
    const result = await User.updateMany(
      { 
        email: { 
          $in: ['test@test.com', 'caregiver@test.com']
        }
      },
      { 
        $set: { 
          'verification.emailVerified': true,
          emailVerified: true
        }
      }
    );

    console.log('✅ Verified test users:', result.modifiedCount);

    // List all users and their verification status
    const users = await User.find({}).select('name email verification.emailVerified emailVerified');
    console.log('\n📋 All users:');
    users.forEach(user => {
      const verified = user.verification?.emailVerified || user.emailVerified || false;
      console.log(`- ${user.name} (${user.email}): ${verified ? '✅ Verified' : '❌ Not verified'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📊 Disconnected from MongoDB');
  }
}

verifyTestUsers();
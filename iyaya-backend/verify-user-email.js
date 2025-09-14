require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function verifyUserEmail() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the test user
    const user = await User.findOne({ email: 'kensite24@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 User found:', {
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.verification?.emailVerified || false
    });

    // Verify the user's email
    if (!user.verification?.emailVerified) {
      console.log('🔧 Verifying user email...');
      
      user.verification = user.verification || {};
      user.verification.emailVerified = true;
      user.verification.token = undefined;
      user.verification.expires = undefined;
      
      await user.save();
      console.log('✅ Email verified successfully');
    } else {
      console.log('✅ Email already verified');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

verifyUserEmail();
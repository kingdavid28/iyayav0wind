require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function checkUserPassword() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the test user
    const user = await User.findOne({ email: 'kensite24@gmail.com' }).select('+password');
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 User found:', {
      name: user.name,
      email: user.email,
      role: user.role,
      hasPassword: !!user.password,
      emailVerified: user.verification?.emailVerified || false
    });

    // Test password
    const testPassword = 'password123';
    console.log('🔐 Testing password:', testPassword);
    
    if (user.password) {
      const isMatch = await bcrypt.compare(testPassword, user.password);
      console.log('🔐 Password match:', isMatch);
      
      if (!isMatch) {
        console.log('🔧 Setting new password...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(testPassword, salt);
        
        user.password = hashedPassword;
        await user.save();
        console.log('✅ Password updated successfully');
      }
    } else {
      console.log('🔧 No password set, creating one...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(testPassword, salt);
      
      user.password = hashedPassword;
      await user.save();
      console.log('✅ Password created successfully');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkUserPassword();
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const createTestUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/iyaya');
    console.log('✅ Connected to MongoDB');

    const existingUser = await User.findOne({ email: 'test@test.com' });
    if (existingUser) {
      console.log('✅ Test user already exists');
      process.exit(0);
    }

    await User.create({
      name: 'Test Parent',
      email: 'test@test.com',
      password: 'password123456789',
      role: 'parent',
      userType: 'parent'
    });

    await User.create({
      name: 'Test Caregiver', 
      email: 'caregiver@test.com',
      password: 'password123456789',
      role: 'caregiver',
      userType: 'caregiver'
    });

    console.log('✅ Test users created: test@test.com / caregiver@test.com (password123)');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createTestUser();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');

async function checkUsers() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/iyaya');
    console.log('✅ Connected to MongoDB');

    // Check existing users
    const userCount = await User.countDocuments();
    console.log(`\n📊 Total users in database: ${userCount}`);

    if (userCount === 0) {
      console.log('\n🚀 No users found. Creating test users...');
      await createTestUsers();
    } else {
      console.log('\n👥 Existing users:');
      const users = await User.find({}).select('email name role userType createdAt');
      users.forEach(user => {
        console.log(`- ${user.email} (${user.name}) - Role: ${user.role}/${user.userType} - Created: ${user.createdAt}`);
      });
    }

    // Test the specific emails from the error logs
    const testEmails = ['kensite24@gmail.com', 'giver@gmail.com', 'rere.centno.swu@phinmaed.com'];
    
    console.log('\n🔍 Checking specific emails from error logs:');
    for (const email of testEmails) {
      const user = await User.findOne({ email });
      console.log(`- ${email}: ${user ? '✅ Found' : '❌ Not found'}`);
      if (user) {
        console.log(`  Name: ${user.name}, Role: ${user.role}/${user.userType}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function createTestUsers() {
  const testUsers = [
    {
      name: 'Ken Site',
      email: 'kensite24@gmail.com',
      password: 'password123',
      role: 'parent',
      userType: 'parent'
    },
    {
      name: 'Care Giver',
      email: 'giver@gmail.com',
      password: 'password123',
      role: 'caregiver',
      userType: 'caregiver'
    },
    {
      name: 'Rere Centno',
      email: 'rere.centno.swu@phinmaed.com',
      password: 'password123',
      role: 'parent',
      userType: 'parent'
    }
  ];

  for (const userData of testUsers) {
    try {
      const user = await User.create(userData);
      console.log(`✅ Created user: ${user.email}`);
    } catch (error) {
      console.log(`❌ Failed to create ${userData.email}: ${error.message}`);
    }
  }
}

checkUsers();
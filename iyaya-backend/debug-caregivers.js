const mongoose = require('mongoose');
const Caregiver = require('./models/Caregiver');
const User = require('./models/User');
require('dotenv').config();

async function debugCaregivers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📊 Connected to MongoDB');

    // Check total caregiver count
    const totalCaregivers = await Caregiver.countDocuments();
    console.log('👥 Total caregivers in database:', totalCaregivers);

    // Check total users with caregiver role
    const caregiverUsers = await User.countDocuments({ userType: 'caregiver' });
    console.log('👤 Users with caregiver role:', caregiverUsers);

    // Get sample caregivers
    const sampleCaregivers = await Caregiver.find()
      .populate('userId', 'name email userType')
      .limit(5)
      .lean();
    
    console.log('📋 Sample caregivers:');
    sampleCaregivers.forEach((caregiver, index) => {
      console.log(`${index + 1}. ${caregiver.name} (ID: ${caregiver._id})`);
      console.log(`   User: ${caregiver.userId?.name} (${caregiver.userId?.email})`);
      console.log(`   UserType: ${caregiver.userId?.userType}`);
      console.log(`   Skills: ${caregiver.skills?.join(', ') || 'None'}`);
      console.log(`   Rate: $${caregiver.hourlyRate || 'Not set'}/hr`);
      console.log('');
    });

    // Test the search query directly
    console.log('🔍 Testing search query...');
    const searchResults = await Caregiver.find({})
      .populate('userId', 'name profileImage')
      .select('name skills experience hourlyRate availability rating ageCareRanges')
      .limit(10)
      .sort({ rating: -1, 'verification.trustScore': -1 })
      .lean();

    console.log('📊 Search results:', searchResults.length);
    
    if (searchResults.length === 0) {
      console.log('❌ No caregivers found - database might be empty');
      
      // Create a test caregiver
      console.log('🔧 Creating test caregiver...');
      
      // First create a test user
      const testUser = new User({
        name: 'Test Caregiver',
        email: 'testcaregiver@example.com',
        password: 'password123',
        userType: 'caregiver',
        phone: '+1234567890'
      });
      await testUser.save();
      console.log('✅ Created test user:', testUser._id);

      // Then create caregiver profile
      const testCaregiver = new Caregiver({
        userId: testUser._id,
        name: 'Test Caregiver',
        bio: 'Experienced childcare provider with 5+ years of experience',
        skills: ['Childcare', 'Cooking', 'Cleaning'],
        experience: {
          years: 5,
          months: 6,
          description: 'Worked with children of all ages'
        },
        hourlyRate: 25,
        ageCareRanges: ['INFANT', 'TODDLER', 'PRESCHOOL'],
        availability: {
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          hours: {
            start: '08:00',
            end: '18:00'
          }
        },
        rating: 4.5
      });
      
      await testCaregiver.save();
      console.log('✅ Created test caregiver:', testCaregiver._id);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📊 Disconnected from MongoDB');
  }
}

debugCaregivers();

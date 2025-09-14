const mongoose = require('mongoose');
require('dotenv').config();

async function testCaregiverEndpoint() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://rerecentnoswu:knoockk28a@cluster0.emfxnqn.mongodb.net/iyaya?retryWrites=true&w=majority&appName=Cluster0');
    console.log('Connected to MongoDB');

    const User = require('./models/User');
    const Caregiver = require('./models/Caregiver');

    // Find caregiver users
    const caregiverUsers = await User.find({ role: 'caregiver' });
    console.log(`\nFound ${caregiverUsers.length} caregiver users:`);
    
    for (const user of caregiverUsers) {
      console.log(`\n--- User: ${user.name} (${user.email}) ---`);
      console.log(`User ID: ${user._id}`);
      
      // Check if caregiver profile exists
      const caregiverProfile = await Caregiver.findOne({ userId: user._id });
      console.log(`Caregiver Profile: ${caregiverProfile ? 'EXISTS' : 'MISSING'}`);
      
      if (caregiverProfile) {
        console.log(`Caregiver ID: ${caregiverProfile._id}`);
        console.log(`Name: ${caregiverProfile.name}`);
        console.log(`Bio: ${caregiverProfile.bio || 'Empty'}`);
        console.log(`Skills: ${caregiverProfile.skills?.length || 0} skills`);
        console.log(`Hourly Rate: $${caregiverProfile.hourlyRate || 'Not set'}`);
      }
    }

    // Test the endpoint logic
    console.log('\n=== TESTING ENDPOINT LOGIC ===');
    
    if (caregiverUsers.length > 0) {
      const testUser = caregiverUsers[0];
      console.log(`\nTesting with user: ${testUser.name} (${testUser._id})`);
      
      // Simulate the updateCaregiverProfile logic
      const updateData = {
        name: 'Updated Test Name',
        bio: 'This is a test bio update',
        skills: ['Childcare', 'Cooking', 'Cleaning'],
        hourlyRate: 25,
        experience: {
          years: 2,
          months: 6,
          description: 'Experience with children ages 2-10'
        }
      };
      
      console.log('Update data:', updateData);
      
      const updatedCaregiver = await Caregiver.findOneAndUpdate(
        { userId: testUser._id },
        updateData,
        { new: true, runValidators: true }
      );
      
      if (updatedCaregiver) {
        console.log('✅ Update successful!');
        console.log('Updated caregiver:', {
          id: updatedCaregiver._id,
          name: updatedCaregiver.name,
          bio: updatedCaregiver.bio,
          skills: updatedCaregiver.skills,
          hourlyRate: updatedCaregiver.hourlyRate
        });
      } else {
        console.log('❌ Update failed - caregiver not found');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

testCaregiverEndpoint();
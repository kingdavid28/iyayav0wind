const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function checkUsersCollection() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://rerecentnoswu:knoockk28a@cluster0.emfxnqn.mongodb.net/iyaya?retryWrites=true&w=majority&appName=Cluster0');
    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find({});
    console.log(`\nTotal users found: ${users.length}`);

    if (users.length > 0) {
      console.log('\n=== USERS COLLECTION ===');
      users.forEach((user, index) => {
        console.log(`\n--- User ${index + 1} ---`);
        console.log(`ID: ${user._id}`);
        console.log(`Firebase UID: ${user.firebaseUid || 'Not set'}`);
        console.log(`Email: ${user.email || 'Not set'}`);
        console.log(`Name: ${user.name || 'Not set'}`);
        console.log(`Role: ${user.role || 'Not set'}`);
        console.log(`Phone: ${user.phone || 'Not set'}`);
        console.log(`Created: ${user.createdAt || 'Not set'}`);
        console.log(`Updated: ${user.updatedAt || 'Not set'}`);
        console.log(`Profile Complete: ${user.profileComplete || false}`);
        console.log(`Email Verified: ${user.emailVerified || false}`);
        
        if (user.profile) {
          console.log(`Profile Data: ${JSON.stringify(user.profile, null, 2)}`);
        }
      });
    } else {
      console.log('\nNo users found in the collection.');
    }

    // Get count by role
    const parentCount = await User.countDocuments({ role: 'parent' });
    const caregiverCount = await User.countDocuments({ role: 'caregiver' });
    
    console.log(`\n=== USER STATISTICS ===`);
    console.log(`Parents: ${parentCount}`);
    console.log(`Caregivers: ${caregiverCount}`);
    console.log(`Total: ${users.length}`);

  } catch (error) {
    console.error('Error checking users collection:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

checkUsersCollection();
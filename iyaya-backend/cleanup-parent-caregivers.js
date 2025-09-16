const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/iyaya', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const User = require('./src/core/database/models/User');
const Caregiver = require('./src/core/database/models/Caregiver');

async function cleanupParentCaregivers() {
  try {
    console.log('🔍 Finding parent users with caregiver profiles...');
    
    // Find all users with parent role
    const parentUsers = await User.find({
      $or: [
        { role: 'parent' },
        { userType: 'parent' },
        { role: 'client' },
        { userType: 'client' }
      ]
    }).select('_id email name role userType');
    
    console.log(`📊 Found ${parentUsers.length} parent users`);
    
    // Find caregiver profiles for these parent users
    const parentUserIds = parentUsers.map(u => u._id);
    const caregiverProfiles = await Caregiver.find({
      userId: { $in: parentUserIds }
    }).populate('userId', 'email name role userType');
    
    console.log(`🎯 Found ${caregiverProfiles.length} caregiver profiles for parent users:`);
    
    caregiverProfiles.forEach(profile => {
      console.log(`  - ${profile.name} (${profile.userId.email}) - User Role: ${profile.userId.role}/${profile.userId.userType}`);
    });
    
    if (caregiverProfiles.length > 0) {
      console.log('\n🗑️ Removing caregiver profiles for parent users...');
      
      const result = await Caregiver.deleteMany({
        userId: { $in: parentUserIds }
      });
      
      console.log(`✅ Removed ${result.deletedCount} caregiver profiles`);
    } else {
      console.log('✅ No caregiver profiles found for parent users');
    }
    
    // Verify the cleanup
    console.log('\n🔍 Verifying cleanup...');
    const remainingCaregivers = await Caregiver.find({})
      .populate('userId', 'email name role userType');
    
    console.log(`📊 Remaining caregivers: ${remainingCaregivers.length}`);
    remainingCaregivers.forEach(profile => {
      console.log(`  - ${profile.name} (${profile.userId?.email || 'No email'}) - User Role: ${profile.userId?.role || 'No role'}/${profile.userId?.userType || 'No userType'}`);
    });
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

cleanupParentCaregivers();
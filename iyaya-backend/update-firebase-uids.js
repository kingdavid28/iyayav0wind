const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/iyaya', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function updateFirebaseUIDs() {
  try {
    console.log('🔄 Starting Firebase UID update...');
    
    // Get all users without Firebase UID
    const users = await User.find({ firebaseUid: { $exists: false } });
    console.log(`📊 Found ${users.length} users without Firebase UID`);
    
    for (const user of users) {
      // For now, we'll use the MongoDB _id as a temporary Firebase UID
      // In a real scenario, you'd get this from Firebase Auth
      const tempFirebaseUid = user._id.toString();
      
      await User.findByIdAndUpdate(user._id, {
        firebaseUid: tempFirebaseUid
      });
      
      console.log(`✅ Updated user ${user.email} with Firebase UID: ${tempFirebaseUid}`);
    }
    
    console.log('🎉 Firebase UID update completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating Firebase UIDs:', error);
    process.exit(1);
  }
}

updateFirebaseUIDs();
// Check if user exists with Firebase UID from logs
require('dotenv').config({ path: './iyaya-backend/.env' });
const mongoose = require('mongoose');

async function checkUser() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/iyaya';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Define User schema (simplified)
    const userSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.model('User', userSchema);
    
    // Check for user with Firebase UID from logs
    const firebaseUid = 's7Tb5ptaXCWNYC0MoTrDGhmk0393';
    const email = 'kensite24@gmail.com';
    
    console.log('🔍 Looking for user with Firebase UID:', firebaseUid);
    const userByUid = await User.findOne({ firebaseUid });
    console.log('👤 User by Firebase UID:', userByUid ? 'Found' : 'Not found');
    if (userByUid) {
      console.log('   - ID:', userByUid._id);
      console.log('   - Email:', userByUid.email);
      console.log('   - Role:', userByUid.role);
      console.log('   - Firebase UID:', userByUid.firebaseUid);
    }
    
    console.log('\\n🔍 Looking for user with email:', email);
    const userByEmail = await User.findOne({ email: email.toLowerCase() });
    console.log('👤 User by email:', userByEmail ? 'Found' : 'Not found');
    if (userByEmail) {
      console.log('   - ID:', userByEmail._id);
      console.log('   - Email:', userByEmail.email);
      console.log('   - Role:', userByEmail.role);
      console.log('   - Firebase UID:', userByEmail.firebaseUid || 'Missing');
      
      // Update Firebase UID if missing
      if (!userByEmail.firebaseUid) {
        console.log('🔧 Updating user with Firebase UID...');
        await User.findByIdAndUpdate(userByEmail._id, { firebaseUid });
        console.log('✅ Firebase UID updated');
      }
    }
    
    // List all users for debugging
    console.log('\\n📋 All users in database:');
    const allUsers = await User.find({}).select('email role firebaseUid').limit(10);
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.role}) - Firebase UID: ${user.firebaseUid || 'Missing'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\\n🔌 Disconnected from MongoDB');
  }
}

checkUser();
const mongoose = require('mongoose');
const Caregiver = require('./models/Caregiver');
const User = require('./models/User');

async function testDirect() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://rerecentnoswu:knoockk28a@cluster0.emfxnqn.mongodb.net/iyaya?retryWrites=true&w=majority');
    console.log('✅ Connected to MongoDB');

    // Find the user
    const user = await User.findOne({ email: 'kensite24@gmail.com' });
    console.log('👤 Found user:', user ? { id: user._id, email: user.email, role: user.role } : 'Not found');

    if (user) {
      // Try to find caregiver profile
      const caregiver = await Caregiver.findOne({ userId: user._id });
      console.log('👨‍⚕️ Found caregiver:', caregiver ? { id: caregiver._id, name: caregiver.name } : 'Not found');

      if (!caregiver) {
        console.log('🔧 Creating new caregiver profile...');
        const newCaregiver = await Caregiver.create({
          userId: user._id,
          name: user.name || 'Test Caregiver',
          bio: 'Test bio',
          skills: [],
          certifications: [],
          ageCareRanges: [],
          emergencyContacts: [],
          documents: [],
          portfolio: { images: [], videos: [] },
          availability: { 
            days: [], 
            hours: { start: '08:00', end: '18:00' }, 
            flexible: false 
          }
        });
        console.log('✅ Created caregiver:', newCaregiver._id);
      }
    }

    await mongoose.disconnect();
    console.log('✅ Test completed');
  } catch (error) {
    console.error('❌ Test error:', error);
    await mongoose.disconnect();
  }
}

testDirect();
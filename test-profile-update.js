// Test script to debug profile update issue
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb+srv://rerecentnoswu:knoockk28a@cluster0.emfxnqn.mongodb.net/iyaya?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Simple test schema
const TestCaregiverSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: String,
  bio: String,
  experience: mongoose.Schema.Types.Mixed,
  hourlyRate: Number,
  skills: [String],
  address: mongoose.Schema.Types.Mixed,
  portfolio: mongoose.Schema.Types.Mixed,
  availability: mongoose.Schema.Types.Mixed,
  emergencyContacts: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const TestCaregiver = mongoose.model('TestCaregiver', TestCaregiverSchema);

async function testUpdate() {
  try {
    console.log('🧪 Testing profile update...');
    
    const testUserId = new mongoose.Types.ObjectId('68c28c70de12b199d01909a4');
    
    const testData = {
      name: "Test Enhanced Profile",
      bio: "This is a test bio from the wizard",
      experience: 303,
      hourlyRate: 250,
      skills: ["Childcare", "Cooking"],
      address: {
        street: "Manuel oyaon sr",
        city: "Cebu City"
      }
    };
    
    console.log('📝 Test data:', testData);
    
    const result = await TestCaregiver.findOneAndUpdate(
      { userId: testUserId },
      testData,
      { new: true, upsert: true }
    );
    
    console.log('✅ Test update successful:', result);
    
  } catch (error) {
    console.error('❌ Test update failed:', {
      name: error.name,
      message: error.message,
      path: error.path,
      value: error.value
    });
  } finally {
    mongoose.disconnect();
  }
}

testUpdate();
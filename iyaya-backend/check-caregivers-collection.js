require('dotenv').config();
const mongoose = require('mongoose');
const Caregiver = require('./models/Caregiver');
const User = require('./models/User');

async function checkCaregiversCollection() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check total caregivers count
    const totalCaregivers = await Caregiver.countDocuments();
    console.log(`\n📊 Total caregivers in collection: ${totalCaregivers}`);

    if (totalCaregivers === 0) {
      console.log('❌ No caregivers found in the collection');
      
      // Check if there are any users with caregiver role
      const caregiverUsers = await User.find({ 
        $or: [
          { role: 'caregiver' },
          { userType: 'caregiver' }
        ]
      }).select('name email role userType');
      
      console.log(`\n👤 Users with caregiver role: ${caregiverUsers.length}`);
      caregiverUsers.forEach(user => {
        console.log(`   - ${user.name} (${user.email}) - Role: ${user.role}/${user.userType}`);
      });
      
      return;
    }

    // Show sample caregivers
    console.log('\n📋 Sample caregivers in collection:');
    const sampleCaregivers = await Caregiver.find()
      .populate('userId', 'name email role userType')
      .limit(5)
      .lean();

    sampleCaregivers.forEach((caregiver, index) => {
      console.log(`\n${index + 1}. Caregiver ID: ${caregiver._id}`);
      console.log(`   Name: ${caregiver.name}`);
      console.log(`   User: ${caregiver.userId?.name} (${caregiver.userId?.email})`);
      console.log(`   Bio: ${caregiver.bio ? caregiver.bio.substring(0, 50) + '...' : 'No bio'}`);
      console.log(`   Skills: ${caregiver.skills?.length || 0} skills`);
      console.log(`   Hourly Rate: $${caregiver.hourlyRate || 'Not set'}`);
      console.log(`   Emergency Contacts: ${caregiver.emergencyContacts?.length || 0}`);
      console.log(`   Documents: ${caregiver.documents?.length || 0}`);
      console.log(`   Age Care Ranges: ${caregiver.ageCareRanges?.length || 0}`);
      console.log(`   Created: ${caregiver.createdAt}`);
      console.log(`   Updated: ${caregiver.updatedAt}`);
    });

    // Check for enhanced profile data
    console.log('\n🔍 Checking for enhanced profile data...');
    const caregriversWithEnhancedData = await Caregiver.find({
      $or: [
        { 'emergencyContacts.0': { $exists: true } },
        { 'documents.0': { $exists: true } },
        { 'ageCareRanges.0': { $exists: true } },
        { 'portfolio.images.0': { $exists: true } },
        { 'certifications.0': { $exists: true } }
      ]
    }).countDocuments();

    console.log(`📈 Caregivers with enhanced data: ${caregriversWithEnhancedData}/${totalCaregivers}`);

    // Show data structure of first caregiver
    if (totalCaregivers > 0) {
      console.log('\n🏗️ Data structure of first caregiver:');
      const firstCaregiver = await Caregiver.findOne().lean();
      console.log('Available fields:', Object.keys(firstCaregiver));
      
      // Check specific enhanced fields
      const enhancedFields = {
        'emergencyContacts': firstCaregiver.emergencyContacts?.length || 0,
        'documents': firstCaregiver.documents?.length || 0,
        'ageCareRanges': firstCaregiver.ageCareRanges?.length || 0,
        'portfolio.images': firstCaregiver.portfolio?.images?.length || 0,
        'certifications': firstCaregiver.certifications?.length || 0,
        'skills': firstCaregiver.skills?.length || 0,
        'availability.days': firstCaregiver.availability?.days?.length || 0
      };
      
      console.log('Enhanced fields data:');
      Object.entries(enhancedFields).forEach(([field, count]) => {
        console.log(`   ${field}: ${count} items`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkCaregiversCollection();
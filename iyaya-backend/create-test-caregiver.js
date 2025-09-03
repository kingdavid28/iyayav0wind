require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function createTestCaregiver() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    console.log('Connected to MongoDB successfully');

    // Check if caregiver users exist
    const existingCaregivers = await User.find({ role: 'caregiver' }).limit(5);
    console.log(`Found ${existingCaregivers.length} existing caregiver users:`);
    
    existingCaregivers.forEach(caregiver => {
      console.log(`- ID: ${caregiver._id}, Name: ${caregiver.name || 'No name'}, Email: ${caregiver.email || 'No email'}`);
    });

    if (existingCaregivers.length === 0) {
      console.log('\nNo caregiver users found. Creating test caregiver...');
      
      const testCaregiver = await User.create({
        name: 'Ana Dela Cruz',
        email: 'ana.delacruz@example.com',
        role: 'caregiver',
        password: '$2a$10$hashedpasswordexample123456789', // Pre-hashed password
        phone: '+639123456789',
        isVerified: true,
        location: {
          type: 'Point',
          coordinates: [121.0244, 14.5547] // Manila coordinates
        },
        address: 'Manila, Philippines',
        bio: 'Experienced childcare provider with 5+ years of experience.',
        hourlyRate: 25,
        availability: {
          monday: { available: true, startTime: '08:00', endTime: '18:00' },
          tuesday: { available: true, startTime: '08:00', endTime: '18:00' },
          wednesday: { available: true, startTime: '08:00', endTime: '18:00' },
          thursday: { available: true, startTime: '08:00', endTime: '18:00' },
          friday: { available: true, startTime: '08:00', endTime: '18:00' },
          saturday: { available: false },
          sunday: { available: false }
        }
      });
      
      console.log(`✅ Test caregiver created successfully!`);
      console.log(`   ID: ${testCaregiver._id}`);
      console.log(`   Name: ${testCaregiver.name}`);
      console.log(`   Email: ${testCaregiver.email}`);
      console.log(`   Role: ${testCaregiver.role}`);
      
      // Create second test caregiver
      const testCaregiver2 = await User.create({
        name: 'Maria Reyes',
        email: 'maria.reyes@example.com',
        role: 'caregiver',
        password: '$2a$10$hashedpasswordexample123456789',
        phone: '+639987654321',
        isVerified: true,
        location: {
          type: 'Point',
          coordinates: [121.0244, 14.5547]
        },
        address: 'Quezon City, Philippines',
        bio: 'Loving and patient caregiver specializing in infant care.',
        hourlyRate: 30,
        availability: {
          monday: { available: true, startTime: '09:00', endTime: '17:00' },
          tuesday: { available: true, startTime: '09:00', endTime: '17:00' },
          wednesday: { available: true, startTime: '09:00', endTime: '17:00' },
          thursday: { available: true, startTime: '09:00', endTime: '17:00' },
          friday: { available: true, startTime: '09:00', endTime: '17:00' },
          saturday: { available: true, startTime: '10:00', endTime: '16:00' },
          sunday: { available: false }
        }
      });
      
      console.log(`✅ Second test caregiver created successfully!`);
      console.log(`   ID: ${testCaregiver2._id}`);
      console.log(`   Name: ${testCaregiver2.name}`);
      console.log(`   Email: ${testCaregiver2.email}`);
      
    } else {
      console.log('\n✅ Caregiver users already exist in database');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('   MongoDB is not running. Please start MongoDB service first.');
    }
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestCaregiver();

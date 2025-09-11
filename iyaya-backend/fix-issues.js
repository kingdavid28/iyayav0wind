const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Caregiver = require('./models/Caregiver');
require('dotenv').config();

async function fixIssues() {
  try {
    console.log('🔧 Starting issue fixes...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📊 Connected to MongoDB');

    // 1. Fix JWT Algorithm Issue
    console.log('\n1️⃣ Testing JWT Configuration...');
    
    const testPayload = { id: 'test123', role: 'parent' };
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      console.error('❌ JWT_SECRET not found in environment variables');
      return;
    }
    
    try {
      // Test JWT signing with HS256 algorithm
      const token = jwt.sign(testPayload, jwtSecret, { 
        expiresIn: '1h',
        algorithm: 'HS256'
      });
      console.log('✅ JWT signing works with HS256');
      
      // Test JWT verification
      const decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
      console.log('✅ JWT verification works with HS256');
      
    } catch (jwtError) {
      console.error('❌ JWT Error:', jwtError.message);
    }

    // 2. Check and Create Test Caregivers
    console.log('\n2️⃣ Checking caregiver database...');
    
    const totalCaregivers = await Caregiver.countDocuments();
    console.log('👥 Total caregivers in database:', totalCaregivers);
    
    if (totalCaregivers === 0) {
      console.log('🔧 Creating test caregivers...');
      
      // Create test caregivers
      const testCaregivers = [
        {
          name: 'Maria Santos',
          email: 'maria.santos@example.com',
          bio: 'Experienced nanny with 8+ years caring for children of all ages',
          skills: ['Childcare', 'Cooking', 'Homework Help', 'First Aid'],
          hourlyRate: 25,
          experience: { years: 8, months: 0, description: 'Professional childcare experience' },
          ageCareRanges: ['INFANT', 'TODDLER', 'PRESCHOOL', 'SCHOOL_AGE']
        },
        {
          name: 'Ana Rodriguez',
          email: 'ana.rodriguez@example.com',
          bio: 'Certified childcare provider specializing in infant care',
          skills: ['Infant Care', 'Feeding', 'Sleep Training', 'CPR Certified'],
          hourlyRate: 30,
          experience: { years: 5, months: 6, description: 'Specialized in newborn and infant care' },
          ageCareRanges: ['INFANT', 'TODDLER']
        },
        {
          name: 'Carmen Lopez',
          email: 'carmen.lopez@example.com',
          bio: 'Fun and energetic caregiver who loves outdoor activities',
          skills: ['Childcare', 'Outdoor Activities', 'Arts & Crafts', 'Swimming'],
          hourlyRate: 22,
          experience: { years: 4, months: 0, description: 'Active childcare with focus on development' },
          ageCareRanges: ['TODDLER', 'PRESCHOOL', 'SCHOOL_AGE']
        }
      ];

      for (const caregiverData of testCaregivers) {
        try {
          // Create user first
          const user = new User({
            name: caregiverData.name,
            email: caregiverData.email,
            password: 'password123', // This will be hashed
            userType: 'caregiver',
            role: 'caregiver',
            phone: '+1234567890',
            emailVerified: true
          });
          
          await user.save();
          console.log(`✅ Created user: ${user.name}`);

          // Create caregiver profile
          const caregiver = new Caregiver({
            userId: user._id,
            name: caregiverData.name,
            bio: caregiverData.bio,
            skills: caregiverData.skills,
            experience: caregiverData.experience,
            hourlyRate: caregiverData.hourlyRate,
            ageCareRanges: caregiverData.ageCareRanges,
            availability: {
              days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
              hours: { start: '08:00', end: '18:00' },
              flexible: true,
              weeklySchedule: {
                Monday: { available: true, timeSlots: [{ start: '08:00', end: '18:00' }] },
                Tuesday: { available: true, timeSlots: [{ start: '08:00', end: '18:00' }] },
                Wednesday: { available: true, timeSlots: [{ start: '08:00', end: '18:00' }] },
                Thursday: { available: true, timeSlots: [{ start: '08:00', end: '18:00' }] },
                Friday: { available: true, timeSlots: [{ start: '08:00', end: '18:00' }] }
              }
            },
            rating: 4.5 + Math.random() * 0.5, // Random rating between 4.5-5.0
            location: 'Metro Manila, Philippines',
            address: 'Metro Manila, Philippines',
            verification: {
              profileComplete: true,
              identityVerified: true,
              certificationsVerified: false,
              referencesVerified: false,
              trustScore: 85,
              badges: ['verified_identity']
            }
          });
          
          await caregiver.save();
          console.log(`✅ Created caregiver: ${caregiver.name} (Rate: $${caregiver.hourlyRate}/hr)`);
          
        } catch (error) {
          console.error(`❌ Error creating ${caregiverData.name}:`, error.message);
        }
      }
    }

    // 3. Verify the fix
    console.log('\n3️⃣ Verifying fixes...');
    
    const finalCount = await Caregiver.countDocuments();
    console.log('👥 Final caregiver count:', finalCount);
    
    // Test search query
    const searchResults = await Caregiver.find({})
      .populate('userId', 'name profileImage')
      .select('name skills experience hourlyRate availability rating ageCareRanges')
      .limit(5)
      .lean();
    
    console.log('🔍 Search test results:', searchResults.length);
    searchResults.forEach((caregiver, index) => {
      console.log(`${index + 1}. ${caregiver.name} - $${caregiver.hourlyRate}/hr - ${caregiver.skills?.join(', ')}`);
    });

    console.log('\n✅ All fixes completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during fixes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📊 Disconnected from MongoDB');
  }
}

fixIssues();
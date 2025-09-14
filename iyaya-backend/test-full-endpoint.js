const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testFullEndpoint() {
  try {
    const baseURL = 'http://localhost:3000/api';
    
    // Create a test JWT token for a caregiver user
    const testUser = {
      id: '68c28c70de12b199d01909a4', // Existing caregiver user ID
      role: 'caregiver',
      email: 'kensite24@gmail.com'
    };
    
    const token = jwt.sign(testUser, process.env.JWT_SECRET || 'ecb938a178861cc6f6b209ef96d76118765f123c406852efe8b27ddfc492ae32', {
      expiresIn: '1h'
    });
    
    console.log('🔑 Generated test token for user:', testUser.email);
    
    // Test GET /api/caregivers/profile
    console.log('\n📋 Testing GET /api/caregivers/profile...');
    try {
      const getResponse = await axios.get(`${baseURL}/caregivers/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ GET Profile successful:', {
        status: getResponse.status,
        caregiverName: getResponse.data.caregiver?.name,
        caregiverId: getResponse.data.caregiver?._id
      });
    } catch (error) {
      console.log('❌ GET Profile failed:', {
        status: error.response?.status,
        message: error.response?.data?.error || error.message
      });
    }
    
    // Test PUT /api/caregivers/profile
    console.log('\n📝 Testing PUT /api/caregivers/profile...');
    const updateData = {
      name: 'Enhanced Profile Test',
      bio: 'This is an enhanced profile created by the wizard',
      skills: ['Childcare', 'Cooking', 'Homework Help'],
      hourlyRate: 30,
      experience: {
        years: 3,
        months: 0,
        description: 'Experienced with children of all ages'
      },
      ageCareRanges: ['TODDLER', 'PRESCHOOL', 'SCHOOL_AGE'],
      availability: {
        days: ['Monday', 'Tuesday', 'Wednesday'],
        hours: { start: '09:00', end: '17:00' },
        flexible: true
      }
    };
    
    try {
      const putResponse = await axios.put(`${baseURL}/caregivers/profile`, updateData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ PUT Profile successful:', {
        status: putResponse.status,
        message: putResponse.data.message,
        caregiverName: putResponse.data.caregiver?.name,
        skills: putResponse.data.caregiver?.skills,
        hourlyRate: putResponse.data.caregiver?.hourlyRate
      });
    } catch (error) {
      console.log('❌ PUT Profile failed:', {
        status: error.response?.status,
        message: error.response?.data?.error || error.message,
        details: error.response?.data?.details
      });
    }
    
    // Test POST /api/caregivers/profile (alternative method)
    console.log('\n📤 Testing POST /api/caregivers/profile...');
    try {
      const postResponse = await axios.post(`${baseURL}/caregivers/profile`, {
        ...updateData,
        name: 'POST Method Test'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ POST Profile successful:', {
        status: postResponse.status,
        message: postResponse.data.message,
        caregiverName: postResponse.data.caregiver?.name
      });
    } catch (error) {
      console.log('❌ POST Profile failed:', {
        status: error.response?.status,
        message: error.response?.data?.error || error.message
      });
    }
    
  } catch (error) {
    console.error('Test setup error:', error.message);
  }
}

testFullEndpoint();
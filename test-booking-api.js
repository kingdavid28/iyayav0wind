const axios = require('axios');

// Test booking API without MongoDB dependency
async function testBookingAPI() {
  const API_BASE_URL = 'http://localhost:5001/api';
  
  // Test data with hardcoded caregiver ID (will be created if MongoDB is running)
  const testBookingData = {
    caregiverId: '507f1f77bcf86cd799439011', // Valid ObjectId format
    date: '2025-08-25',
    startTime: '09:00',
    endTime: '17:00',
    children: [{ name: 'Test Child', age: 5 }],
    address: '123 Test Street, Manila, Philippines',
    contact: '+639123456789',
    emergencyContact: {
      name: 'Emergency Contact',
      phone: '+639987654321',
      relation: 'Parent'
    },
    specialInstructions: 'Test booking from API test',
    hourlyRate: 25,
    totalCost: 200,
    paymentMethod: 'cash'
  };

  try {
    console.log('🧪 Testing Booking API...');
    console.log('📋 Test booking data:', JSON.stringify(testBookingData, null, 2));
    
    // Test booking creation
    const response = await axios.post(`${API_BASE_URL}/bookings`, testBookingData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-jwt-token',
        'X-Dev-Bypass': '1',
        'X-Dev-Role': 'parent'
      },
      timeout: 10000
    });

    console.log('✅ Booking API Response:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.log('❌ Booking API Error:');
    console.log('Status:', error.response?.status || 'No status');
    console.log('URL:', error.config?.url || 'No URL');
    console.log('Error Data:', JSON.stringify(error.response?.data || { message: error.message }, null, 2));
    
    // Log detailed error information
    if (error.response?.data?.error) {
      console.log('\n🔍 Detailed Error Analysis:');
      console.log('- Error Message:', error.response.data.error);
      
      if (error.response.data.error.includes('Invalid caregiver ID format')) {
        console.log('- Issue: CaregiverId format is invalid');
        console.log('- Solution: Ensure caregiverId is a valid MongoDB ObjectId');
      } else if (error.response.data.error.includes('Caregiver not found in database')) {
        console.log('- Issue: Caregiver does not exist in database');
        console.log('- Solution: Create caregiver users or use existing caregiver ID');
      } else if (error.response.data.error.includes('User is not a caregiver')) {
        console.log('- Issue: User exists but has wrong role');
        console.log('- Solution: Ensure user has role "caregiver"');
      }
    }
  }
}

// Test with different caregiver IDs
async function testMultipleCaregiverIds() {
  const testIds = [
    '507f1f77bcf86cd799439011', // Valid ObjectId format
    'invalid-id', // Invalid format
    '507f1f77bcf86cd799439999', // Valid format but likely doesn't exist
  ];

  for (const caregiverId of testIds) {
    console.log(`\n🧪 Testing with caregiverId: ${caregiverId}`);
    console.log(`📋 ID Type: ${typeof caregiverId}, Valid ObjectId format: ${/^[0-9a-fA-F]{24}$/.test(caregiverId)}`);
    
    try {
      const response = await axios.post('http://localhost:5001/api/bookings', {
        caregiverId,
        date: '2025-08-25',
        startTime: '09:00',
        endTime: '17:00',
        children: [{ name: 'Test Child' }],
        address: 'Test Address',
        contact: '+639123456789',
        hourlyRate: 25,
        totalCost: 200
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-jwt-token',
          'X-Dev-Bypass': '1',
          'X-Dev-Role': 'parent'
        },
        timeout: 5000
      });
      
      console.log('✅ Success:', response.status);
    } catch (error) {
      console.log('❌ Error:', error.response?.data?.error || error.message);
    }
  }
}

// Run tests
console.log('🚀 Starting Booking API Tests...\n');
testBookingAPI().then(() => {
  console.log('\n' + '='.repeat(50));
  return testMultipleCaregiverIds();
}).then(() => {
  console.log('\n✅ All tests completed!');
}).catch(err => {
  console.error('💥 Test suite failed:', err.message);
});

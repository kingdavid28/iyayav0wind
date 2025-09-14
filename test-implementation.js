console.log('🧪 Testing CaregiverProfileComplete Implementation...\n');

// Test 1: Check if the screen file exists and has correct imports
console.log('1️⃣ Checking CaregiverProfileComplete screen...');
try {
  const fs = require('fs');
  const path = require('path');
  
  const screenPath = path.join(__dirname, 'src', 'screens', 'CaregiverProfileComplete.js');
  if (fs.existsSync(screenPath)) {
    console.log('✅ CaregiverProfileComplete.js exists');
    
    const content = fs.readFileSync(screenPath, 'utf8');
    
    // Check imports
    if (content.includes("import { useAuth } from '../core/contexts/AuthContext';")) {
      console.log('✅ Correct AuthContext import');
    } else {
      console.log('❌ Incorrect AuthContext import');
    }
    
    if (content.includes("import { profileService } from '../services/profileService';")) {
      console.log('✅ ProfileService import found');
    } else {
      console.log('❌ ProfileService import missing');
    }
    
    if (content.includes('getCaregiverProfile')) {
      console.log('✅ getCaregiverProfile method call found');
    } else {
      console.log('❌ getCaregiverProfile method call missing');
    }
    
  } else {
    console.log('❌ CaregiverProfileComplete.js not found');
  }
} catch (error) {
  console.log('❌ Error checking screen:', error.message);
}

// Test 2: Check profileService implementation
console.log('\n2️⃣ Checking profileService implementation...');
try {
  const fs = require('fs');
  const path = require('path');
  
  const servicePath = path.join(__dirname, 'src', 'services', 'profileService.js');
  if (fs.existsSync(servicePath)) {
    console.log('✅ profileService.js exists');
    
    const content = fs.readFileSync(servicePath, 'utf8');
    
    if (content.includes('getCaregiverProfile')) {
      console.log('✅ getCaregiverProfile method found');
    } else {
      console.log('❌ getCaregiverProfile method missing');
    }
    
    if (content.includes('updateCaregiverProfile')) {
      console.log('✅ updateCaregiverProfile method found');
    } else {
      console.log('❌ updateCaregiverProfile method missing');
    }
    
    if (content.includes('/api/caregivers/profile')) {
      console.log('✅ Correct endpoint URL found');
    } else {
      console.log('❌ Correct endpoint URL missing');
    }
    
  } else {
    console.log('❌ profileService.js not found');
  }
} catch (error) {
  console.log('❌ Error checking service:', error.message);
}

// Test 3: Check backend caregiver routes
console.log('\n3️⃣ Checking backend caregiver routes...');
try {
  const fs = require('fs');
  const path = require('path');
  
  const routesPath = path.join(__dirname, 'iyaya-backend', 'routes', 'caregiverRoutes.js');
  if (fs.existsSync(routesPath)) {
    console.log('✅ caregiverRoutes.js exists');
    
    const content = fs.readFileSync(routesPath, 'utf8');
    
    if (content.includes("router.get(") && content.includes("'/profile'")) {
      console.log('✅ GET /profile route found');
    } else {
      console.log('❌ GET /profile route missing');
    }
    
    if (content.includes("router.put(") && content.includes("'/profile'")) {
      console.log('✅ PUT /profile route found');
    } else {
      console.log('❌ PUT /profile route missing');
    }
    
    if (content.includes('getCaregiverProfile')) {
      console.log('✅ getCaregiverProfile controller method found');
    } else {
      console.log('❌ getCaregiverProfile controller method missing');
    }
    
  } else {
    console.log('❌ caregiverRoutes.js not found');
  }
} catch (error) {
  console.log('❌ Error checking routes:', error.message);
}

// Test 4: Check backend caregiver controller
console.log('\n4️⃣ Checking backend caregiver controller...');
try {
  const fs = require('fs');
  const path = require('path');
  
  const controllerPath = path.join(__dirname, 'iyaya-backend', 'controllers', 'caregiverController.js');
  if (fs.existsSync(controllerPath)) {
    console.log('✅ caregiverController.js exists');
    
    const content = fs.readFileSync(controllerPath, 'utf8');
    
    if (content.includes('exports.getCaregiverProfile')) {
      console.log('✅ getCaregiverProfile export found');
    } else {
      console.log('❌ getCaregiverProfile export missing');
    }
    
    if (content.includes('exports.updateCaregiverProfile')) {
      console.log('✅ updateCaregiverProfile export found');
    } else {
      console.log('❌ updateCaregiverProfile export missing');
    }
    
  } else {
    console.log('❌ caregiverController.js not found');
  }
} catch (error) {
  console.log('❌ Error checking controller:', error.message);
}

console.log('\n🎯 Implementation Test Summary:');
console.log('- Frontend screen: CaregiverProfileComplete.js');
console.log('- Frontend service: profileService.getCaregiverProfile()');
console.log('- Backend route: GET/PUT /api/caregivers/profile');
console.log('- Backend controller: caregiverController methods');
console.log('\n✅ Test completed! Check the results above for any issues.');
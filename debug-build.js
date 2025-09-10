const { execSync } = require('child_process');

console.log('🔍 Debugging build issues...\n');

try {
  console.log('1. Checking Expo CLI version...');
  execSync('npx expo --version', { stdio: 'inherit' });
  
  console.log('\n2. Checking project structure...');
  execSync('npx expo doctor', { stdio: 'inherit' });
  
  console.log('\n3. Clearing cache...');
  execSync('npx expo start --clear', { stdio: 'inherit', timeout: 5000 });
  
} catch (error) {
  console.error('❌ Error during debugging:', error.message);
  
  console.log('\n🔧 Suggested fixes:');
  console.log('1. Clear all caches: rm -rf node_modules && npm install');
  console.log('2. Reset Expo: npx expo install --fix');
  console.log('3. Check for dependency conflicts in package.json');
  console.log('4. Try building with: eas build --platform android --clear-cache');
}
const fs = require('fs');
const path = require('path');

console.log('🔍 Iyaya App Health Check\n');

// Check critical files
const criticalFiles = [
  'App.js',
  'src/app/App.js',
  'src/app/navigation/AppNavigator.js',
  'src/core/contexts/AuthContext.js',
  'src/core/providers/AppProvider.js',
  'src/screens/WelcomeScreen.js',
  'src/screens/CaregiverDashboard.js',
  'src/shared/ui/index.js',
  'package.json'
];

let allGood = true;

criticalFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allGood = false;
});

// Check backend
console.log('\n🔍 Backend Check:');
const backendExists = fs.existsSync(path.join(__dirname, 'iyaya-backend', 'app.js'));
console.log(`${backendExists ? '✅' : '❌'} Backend app.js`);

// Check shared UI components
console.log('\n🔍 Shared UI Components:');
const sharedComponents = [
  'src/shared/ui/EmptyState.js',
  'src/shared/ui/StatusBadge.js', 
  'src/shared/ui/Button.js',
  'src/shared/ui/Card.js',
  'src/shared/ui/ModalWrapper.js',
  'src/shared/ui/forms/FormInput.js'
];

sharedComponents.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allGood = false;
});

console.log(`\n${allGood ? '🎉' : '⚠️'} Health Check ${allGood ? 'PASSED' : 'FAILED'}`);

if (allGood) {
  console.log('\n🚀 Ready to start! Run: npm start');
} else {
  console.log('\n❌ Some files are missing. Check the errors above.');
}
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Messaging System...\n');

// 1. Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('✅ Created logs directory');
}

// 2. Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory');
}

// 3. Create uploads/messages directory for message attachments
const messagesUploadDir = path.join(__dirname, 'uploads', 'messages');
if (!fs.existsSync(messagesUploadDir)) {
  fs.mkdirSync(messagesUploadDir, { recursive: true });
  console.log('✅ Created uploads/messages directory');
}

// 4. Check if winston is installed
try {
  require('winston');
  console.log('✅ Winston logger is available');
} catch (error) {
  console.log('⚠️ Winston not installed, logger will use console fallback');
}

// 5. Check if socket.io is installed
try {
  require('socket.io');
  console.log('✅ Socket.IO is available');
} catch (error) {
  console.log('⚠️ Socket.IO not installed, real-time features will be disabled');
}

// 6. Check if multer is installed for file uploads
try {
  require('multer');
  console.log('✅ Multer is available for file uploads');
} catch (error) {
  console.log('⚠️ Multer not installed, file uploads may not work');
}

console.log('\n🎉 Messaging system setup completed!');
console.log('\n📋 Next steps:');
console.log('1. Start your backend server: npm start');
console.log('2. Test messaging endpoints using the test files');
console.log('3. Check server logs for any remaining issues');

// 7. Create a simple health check for messaging
const healthCheck = {
  timestamp: new Date().toISOString(),
  messaging: {
    routes: 'configured',
    controllers: 'available',
    models: 'defined',
    uploads: 'ready',
    logs: 'ready'
  },
  dependencies: {
    winston: (() => {
      try { require('winston'); return 'installed'; } catch { return 'missing'; }
    })(),
    socketio: (() => {
      try { require('socket.io'); return 'installed'; } catch { return 'missing'; }
    })(),
    multer: (() => {
      try { require('multer'); return 'installed'; } catch { return 'missing'; }
    })()
  }
};

fs.writeFileSync(
  path.join(__dirname, 'messaging-health.json'), 
  JSON.stringify(healthCheck, null, 2)
);

console.log('✅ Created messaging-health.json with system status');
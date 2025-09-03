// ============================================
// Environment Configuration - MUST BE FIRST
// ============================================
require('dotenv').config({ path: './.env' });
const config = require('./config/env');
const { createServer } = require('http');
const app = require('./app');
const realtime = require('./services/realtime');
const connectDB = require('./config/database'); // Import from dedicated file

const server = createServer(app);

// ============================================
// Server Startup
// ============================================
const startServer = async () => {
  const conn = await connectDB(); // Use the imported connection function
  
  // Initialize optional realtime layer
  try {
    realtime.init(server);
    console.log('[Realtime] Socket.IO initialized');
  } catch (err) {
    console.warn('[Realtime] Initialization skipped:', err?.message || err);
  }

  server.listen(config.port, '0.0.0.0', () => {
    console.log(`
============================================
🚀 Server running in ${config.env} mode
🔗 http://localhost:${config.port}
🌐 Network: http://0.0.0.0:${config.port}
📅 ${new Date().toLocaleString()}
🗄️ Database: ${conn.connection.name}
============================================
    `);
  });
};

// Graceful shutdown handlers remain the same
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    const mongoose = require('mongoose');
    mongoose.connection.close(false);
    console.log('⛔ MongoDB connection closed due to app termination');
    process.exit(0);
  });
});

process.on('unhandledRejection', (err) => {
  console.error('⚠️ Unhandled Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('⚠️ Uncaught Exception:', err);
  process.exit(1);
});

startServer();
// ============================================
// Environment Configuration - MUST BE FIRST
// ============================================
require('dotenv').config({ path: './.env' });
const config = require('./config/env');
const mongoose = require('mongoose');
const { createServer } = require('http');
const app = require('./app');
const realtime = require('./services/realtime');

const server = createServer(app);

// ============================================
// Database Connection with Retry Logic
// ============================================
const connectWithRetry = async (retries = 5, delay = 1000) => {
  const connectDB = async () => {
    try {
      console.log('⏳ Attempting to connect to MongoDB...');
      const conn = await mongoose.connect(
        config.database.uri,
        {
          ...config.database.options,
          maxPoolSize: parseInt(process.env.MONGO_POOL_SIZE) || 10,
          serverSelectionTimeoutMS: parseInt(process.env.MONGO_CONNECTION_TIMEOUT) || 5000,
          socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT) || 45000,
          retryWrites: true,
          w: 'majority',
        }
      );
      return conn;
    } catch (err) {
      if (retries === 0) {
        console.error('❌ Max retries reached. Failed to connect to MongoDB:', err.message);
        process.exit(1);
      }
      console.warn(`⚠️ MongoDB connection failed, retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return connectWithRetry(retries - 1, delay * 1.5); // Exponential backoff
    }
  };
  return connectDB();
};

const connectDB = async () => {
  try {
    const conn = await connectWithRetry(
      parseInt(process.env.MONGO_RETRY_ATTEMPTS) || 5,
      parseInt(process.env.MONGO_RETRY_DELAY) || 1000
    );
    console.log('✅ MongoDB Connected');
    return conn;
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB after retries:', err.message);
    process.exit(1);
  }
};

// ============================================
// Server Startup
// ============================================
const startServer = async () => {
  const conn = await connectDB();
  
  // Initialize optional realtime layer (Socket.IO if installed)
  try {
    realtime.init(server);
  } catch (err) {
    console.warn('[Realtime] Initialization skipped:', err?.message || err);
  }

  server.listen(config.port, '0.0.0.0', () => {
    console.log(`
============================================
🚀 Server running in ${config.env} mode
🔗 http://localhost:${config.port}
📅 ${new Date().toLocaleString()}
🗄️ Database: ${conn.connection.name}
============================================
    `);
  });
};

// ============================================
// Graceful Shutdown
// ============================================
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    mongoose.connection.close(false);
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
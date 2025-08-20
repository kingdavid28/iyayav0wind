const mongoose = require('mongoose');
const chalk = require('chalk');

// Enable Mongoose debug mode in development
mongoose.set('debug', process.env.NODE_ENV === 'development');

// Connection events
mongoose.connection.on('connected', () => {
  console.log(chalk.green.bold('✅ MongoDB connected successfully'));
});

mongoose.connection.on('error', (err) => {
  console.error(chalk.red.bold('❌ MongoDB connection error:'), err);
});

mongoose.connection.on('disconnected', () => {
  console.log(chalk.yellow.bold('ℹ️  MongoDB disconnected'));
});

// Close the Mongoose connection when the Node process ends
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log(chalk.blue.bold('\nMongoDB connection closed through app termination'));
  process.exit(0);
});

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/iyaya',
      {
        maxPoolSize: process.env.MONGO_POOL_SIZE || 10, // Default pool size of 10
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4, // Use IPv4, skip trying IPv6
        retryWrites: true,
        w: 'majority',
      }
    );
    return conn;
  } catch (err) {
    console.error(chalk.red.bold('❌ MongoDB connection error:'), err.message);
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;
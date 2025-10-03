const mongoose = require('mongoose');
const chalk = require('chalk');

// Mongoose configuration
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

// Retry connection logic
const connectWithRetry = async (retries = 5, delay = 1000) => {
  try {
    console.log(chalk.blue.bold('⏳ Attempting to connect to MongoDB...'));

    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/iyaya',
      {
        maxPoolSize: parseInt(process.env.MONGO_POOL_SIZE) || 10,
        serverSelectionTimeoutMS: parseInt(process.env.MONGO_CONNECTION_TIMEOUT) || 30000,
        socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT) || 45000,
        family: 4,
        retryWrites: true,
        w: 'majority',
        // Additional connection options for better reliability
        maxIdleTimeMS: 30000,
      }
    );

    console.log(chalk.green.bold('✅ MongoDB connected successfully'));
    console.log(chalk.gray(`   Database: ${conn.connection.name}`));
    console.log(chalk.gray(`   Host: ${conn.connection.host}`));
    console.log(chalk.gray(`   Port: ${conn.connection.port}`));

    return conn;
  } catch (err) {
    console.error(chalk.red.bold('❌ MongoDB connection error:'), err.message);

    if (retries === 0) {
      console.error(chalk.red.bold('❌ Max retries reached. Failed to connect to MongoDB'));
      console.error(chalk.yellow.bold('\nTroubleshooting steps:'));
      console.error(chalk.yellow('1. Make sure MongoDB is running locally'));
      console.error(chalk.yellow('2. Run: ./setup-mongodb.bat or ./setup-mongodb.ps1'));
      console.error(chalk.yellow('3. Or check if MongoDB Atlas cluster is accessible'));
      console.error(chalk.yellow('4. Verify MONGODB_URI in .env file'));
      process.exit(1);
    }

    console.warn(chalk.yellow.bold(`⚠️ MongoDB connection failed, retrying in ${delay}ms... (${retries} retries left)`));
    await new Promise(resolve => setTimeout(resolve, delay));
    return connectWithRetry(retries - 1, delay * 1.5);
  }
};

const connectDB = async () => {
  try {
    const conn = await connectWithRetry(
      parseInt(process.env.MONGO_RETRY_ATTEMPTS) || 5,
      parseInt(process.env.MONGO_RETRY_DELAY) || 1000
    );
    return conn;
  } catch (err) {
    console.error(chalk.red.bold('❌ Failed to connect to MongoDB after retries:'), err.message);
    process.exit(1);
  }
};

// Close connection on app termination
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log(chalk.blue.bold('\n⛔ MongoDB connection closed through app termination'));
  process.exit(0);
});

module.exports = connectDB;
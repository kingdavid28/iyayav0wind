const mongoose = require('mongoose');
const chalk = require('chalk');
require('dotenv').config();

async function checkMongoDBConnection() {
  try {
    console.log(chalk.blue('🔍 Attempting to connect to MongoDB...'));
    
    // Connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/iyaya', {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(chalk.green.bold('✅ Successfully connected to MongoDB!'));
    
    // List all databases
    const adminDb = conn.connection.db.admin();
    const dbList = await adminDb.listDatabases();
    
    console.log('\n📊 Available databases:');
    dbList.databases.forEach(db => {
      console.log(`- ${db.name} (size: ${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    // List collections in the iyaya database
    const collections = await conn.connection.db.listCollections().toArray();
    
    console.log('\n📂 Collections in iyaya database:');
    if (collections.length === 0) {
      console.log('No collections found. The database might be empty.');
    } else {
      collections.forEach(collection => {
        console.log(`- ${collection.name}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error(chalk.red.bold('❌ Error connecting to MongoDB:'), error.message);
    console.error('\nTroubleshooting tips:');
    console.log('1. Make sure MongoDB service is running');
    console.log('2. Check if the connection string is correct:', process.env.MONGODB_URI || 'mongodb://localhost:27017/iyaya');
    console.log('3. Verify that MongoDB is accessible from your network');
    process.exit(1);
  }
}

checkMongoDBConnection();

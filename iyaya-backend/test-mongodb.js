require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');

console.log('Testing MongoDB connection...');
console.log('MONGODB_URI length:', process.env.MONGODB_URI?.length);
console.log('MONGODB_URI preview:', process.env.MONGODB_URI?.substring(0, 50) + '...');

const testConnection = async () => {
  try {
    console.log('Attempting connection...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Quick timeout for testing
    });
    console.log('✅ Connection successful!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error name:', error.name);
    process.exit(1);
  }
};

testConnection();

const mongoose = require('mongoose');
const chalk = require('chalk');
require('dotenv').config();

async function fixChildIdIndex() {
  try {
    console.log(chalk.blue('🔧 Attempting to fix childId index issue...'));

    // Connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/iyaya', {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(chalk.green.bold('✅ Successfully connected to MongoDB!'));

    const db = conn.connection.db;
    const collection = db.collection('children');

    // Check current indexes
    console.log(chalk.yellow('📋 Checking current indexes...'));
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(idx => ({
      name: idx.name,
      key: idx.key,
      unique: idx.unique
    })));

    // Find the problematic childId index
    const childIdIndex = indexes.find(idx => idx.name === 'childId_1');

    if (childIdIndex) {
      console.log(chalk.red('❌ Found problematic childId index. Dropping it...'));

      // Drop the problematic index
      await collection.dropIndex('childId_1');
      console.log(chalk.green('✅ Successfully dropped childId index!'));

      // Verify the index is gone
      const updatedIndexes = await collection.indexes();
      console.log('Updated indexes:', updatedIndexes.map(idx => ({
        name: idx.name,
        key: idx.key,
        unique: idx.unique
      })));
    } else {
      console.log(chalk.green('✅ No problematic childId index found.'));
    }

    // Test creating a child to make sure it works
    console.log(chalk.yellow('🧪 Testing child creation...'));

    const testChild = {
      parentId: new mongoose.Types.ObjectId(),
      name: 'Test Child ' + Date.now(),
      age: 5,
      allergies: '',
      preferences: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await collection.insertOne(testChild);
    console.log(chalk.green('✅ Successfully created test child:', result.insertedId));

    // Clean up test child
    await collection.deleteOne({ _id: result.insertedId });
    console.log(chalk.green('✅ Cleaned up test child'));

    console.log(chalk.green.bold('🎉 Database fix completed successfully!'));
    process.exit(0);

  } catch (error) {
    console.error(chalk.red.bold('❌ Error fixing database:'), error.message);

    if (error.message.includes('childId_1')) {
      console.log(chalk.yellow('💡 The childId index still exists. You may need to:'));
      console.log('1. Drop the database and recreate it');
      console.log('2. Or manually drop the index using MongoDB shell:');
      console.log('   db.children.dropIndex("childId_1")');
    }

    process.exit(1);
  }
}

fixChildIdIndex();

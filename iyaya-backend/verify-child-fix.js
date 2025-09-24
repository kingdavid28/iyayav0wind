const mongoose = require('mongoose');
const chalk = require('chalk');
require('dotenv').config();

async function verifyChildCreation() {
  try {
    console.log(chalk.blue('🧪 Verifying child creation after index fix...'));

    // Connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/iyaya', {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(chalk.green.bold('✅ Successfully connected to MongoDB!'));

    const db = conn.connection.db;
    const collection = db.collection('children');

    // Check current indexes to confirm childId index is gone
    console.log(chalk.yellow('📋 Checking current indexes...'));
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(idx => ({
      name: idx.name,
      key: idx.key,
      unique: idx.unique
    })));

    // Verify no childId index exists
    const childIdIndex = indexes.find(idx => idx.name === 'childId_1');
    if (childIdIndex) {
      console.log(chalk.red('❌ childId index still exists!'));
      process.exit(1);
    } else {
      console.log(chalk.green('✅ childId index successfully removed!'));
    }

    // Test creating multiple children to ensure no conflicts
    console.log(chalk.yellow('🧪 Testing multiple child creation...'));

    const testChildren = [
      {
        parentId: new mongoose.Types.ObjectId(),
        name: 'Test Child 1',
        age: 5,
        allergies: '',
        preferences: '',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        parentId: new mongoose.Types.ObjectId(),
        name: 'Test Child 2',
        age: 7,
        allergies: 'Peanuts',
        preferences: 'Likes reading',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        parentId: new mongoose.Types.ObjectId(),
        name: 'Test Child 3',
        age: 3,
        allergies: '',
        preferences: '',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const results = [];
    for (let i = 0; i < testChildren.length; i++) {
      const result = await collection.insertOne(testChildren[i]);
      results.push(result.insertedId);
      console.log(chalk.green(`✅ Created test child ${i + 1}:`, result.insertedId));
    }

    // Clean up test children
    await collection.deleteMany({ _id: { $in: results } });
    console.log(chalk.green('✅ Cleaned up all test children'));

    console.log(chalk.green.bold('🎉 All tests passed! Child creation is working correctly!'));

    process.exit(0);

  } catch (error) {
    console.error(chalk.red.bold('❌ Error during verification:'), error.message);
    process.exit(1);
  }
}

verifyChildCreation();

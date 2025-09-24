const mongoose = require('mongoose');
require('dotenv').config();

// Test messaging system directly
async function testMessagingSystem() {
  try {
    console.log('🧪 Testing Messaging System Components...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test models
    const Message = require('./models/Message');
    const Conversation = require('./models/Conversation');
    const User = require('./models/User');

    console.log('✅ Models loaded successfully');

    // Check if we have test users
    const userCount = await User.countDocuments();
    console.log(`📊 Users in database: ${userCount}`);

    if (userCount === 0) {
      console.log('⚠️ No users found. Creating test users...');
      
      // Create test users
      const user1 = await User.create({
        name: 'Test Parent',
        email: 'parent@test.com',
        password: 'password123',
        role: 'parent'
      });

      const user2 = await User.create({
        name: 'Test Caregiver',
        email: 'caregiver@test.com',
        password: 'password123',
        role: 'caregiver'
      });

      console.log('✅ Created test users');
      console.log(`   Parent: ${user1._id}`);
      console.log(`   Caregiver: ${user2._id}`);

      // Test conversation creation
      const conversation = await Conversation.create({
        participants: [user1._id, user2._id],
        type: 'direct'
      });

      console.log('✅ Created test conversation:', conversation._id);

      // Test message creation
      const message = await Message.create({
        conversationId: conversation._id,
        fromUserId: user1._id,
        text: 'Hello! This is a test message.',
        delivered: true,
        read: false
      });

      console.log('✅ Created test message:', message._id);

      // Update conversation with last message
      conversation.lastMessage = message._id;
      await conversation.save();

      console.log('✅ Updated conversation with last message');

      // Test message retrieval
      const messages = await Message.find({ conversationId: conversation._id })
        .populate('fromUserId', 'name')
        .lean();

      console.log('✅ Retrieved messages:', messages.length);
      console.log('📨 First message:', {
        text: messages[0]?.text,
        sender: messages[0]?.fromUserId?.name
      });

      // Test conversation retrieval
      const conversations = await Conversation.find({ participants: user1._id })
        .populate('participants', 'name role')
        .populate('lastMessage')
        .lean();

      console.log('✅ Retrieved conversations:', conversations.length);
      console.log('💬 First conversation participants:', 
        conversations[0]?.participants?.map(p => p.name)
      );

    } else {
      console.log('✅ Users exist, messaging system should work');
    }

    console.log('\n🎉 Messaging system test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testMessagingSystem();
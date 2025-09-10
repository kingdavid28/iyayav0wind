const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/iyaya')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const Job = require('./models/Job');

async function testJobCreation() {
  try {
    console.log('Testing job creation...');
    
    const jobData = {
      clientId: new mongoose.Types.ObjectId(),
      clientName: 'Test Parent',
      title: 'Test Job',
      description: 'Test Description',
      location: 'Test Location',
      date: '2025-01-15',
      startTime: '09:00',
      endTime: '17:00',
      hourlyRate: 400,
      numberOfChildren: 1,
      childrenAges: 'Not specified',
      requirements: ['Test Requirement'],
      urgent: false,
      status: 'active'
    };
    
    console.log('Job data:', jobData);
    
    const newJob = new Job(jobData);
    const savedJob = await newJob.save();
    
    console.log('✅ Job created successfully:', savedJob._id);
    
    // Clean up
    await Job.findByIdAndDelete(savedJob._id);
    console.log('✅ Test job deleted');
    
  } catch (error) {
    console.error('❌ Job creation failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

testJobCreation();
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// Mock jobs data for demonstration
const mockJobs = [
  {
    _id: 'job-1',
    title: 'Afternoon Childcare Needed',
    description: 'Looking for a reliable caregiver for my 5-year-old daughter.',
    date: '2024-01-15',
    startTime: '2:00 PM',
    endTime: '6:00 PM',
    location: 'Cebu City, Philippines',
    hourlyRate: 350,
    status: 'active',
    clientId: 'user-1',
    createdAt: new Date().toISOString()
  },
  {
    _id: 'job-2',
    title: 'Weekend Babysitting',
    description: 'Need someone to watch my twin boys on Saturday.',
    date: '2024-01-20',
    startTime: '10:00 AM',
    endTime: '4:00 PM',
    location: 'Lahug, Cebu City',
    hourlyRate: 400,
    status: 'pending',
    clientId: 'user-1',
    createdAt: new Date().toISOString()
  }
];

// Get user's posted jobs
router.get('/my', authenticate, async (req, res) => {
  try {
    // Filter jobs by authenticated user's ID
    const userJobs = mockJobs.filter(job => job.clientId === req.user.id);
    
    console.log(`Fetching jobs for user: ${req.user.id}`);
    console.log(`Found ${userJobs.length} jobs for this user`);
    
    res.json({
      success: true,
      data: {
        jobs: userJobs
      }
    });
  } catch (error) {
    console.error('Error fetching user jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch jobs'
    });
  }
});

// Get all available jobs
router.get('/', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        jobs: mockJobs
      }
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch jobs'
    });
  }
});

// Create new job
router.post('/', authenticate, async (req, res) => {
  try {
    const newJob = {
      _id: `job-${Date.now()}`,
      ...req.body,
      clientId: req.user.id, // Set owner to authenticated user
      status: 'active',
      createdAt: new Date().toISOString()
    };
    
    mockJobs.push(newJob);
    
    console.log(`Job created by user: ${req.user.id}`);
    console.log('New job:', newJob);
    
    res.status(201).json({
      success: true,
      data: {
        job: newJob
      }
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create job'
    });
  }
});

// Update job
router.put('/:id', authenticate, async (req, res) => {
  try {
    const jobIndex = mockJobs.findIndex(job => 
      job._id === req.params.id && job.clientId === req.user.id
    );
    
    if (jobIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Job not found or not authorized'
      });
    }
    
    mockJobs[jobIndex] = {
      ...mockJobs[jobIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: {
        job: mockJobs[jobIndex]
      }
    });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update job'
    });
  }
});

// Delete job
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const jobIndex = mockJobs.findIndex(job => 
      job._id === req.params.id && job.clientId === req.user.id
    );
    
    if (jobIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Job not found or not authorized'
      });
    }
    
    mockJobs.splice(jobIndex, 1);
    
    console.log(`Job ${req.params.id} deleted by user: ${req.user.id}`);
    
    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete job'
    });
  }
});

module.exports = router;
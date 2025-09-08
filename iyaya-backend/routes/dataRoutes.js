const express = require('express');
const { rateLimit } = require('express-rate-limit');
const router = express.Router();
const { authenticate } = require('../utils/auth');

// Rate limiter
const rateLimiter = (options) => rateLimit(options);

// Apply authentication to all routes
router.use(authenticate);

// Get data usage statistics
router.get('/usage', 
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }),
  async (req, res) => {
    try {
      // Mock response - replace with actual database logic
      const usage = {
        profile: [
          { name: 'User Profile', email: 'user@example.com', status: 'Active' }
        ],
        jobs: [],
        bookings: [],
        applications: []
      };
      
      res.json(usage);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get data usage' });
    }
  }
);

// Export user data
router.post('/export',
  rateLimiter({ windowMs: 60 * 60 * 1000, max: 5 }), // 5 exports per hour
  async (req, res) => {
    try {
      // Mock response - replace with actual export logic
      res.json({ 
        success: true, 
        message: 'Data export initiated. You will receive an email with your data within 24 hours.',
        exportId: 'export_' + Date.now()
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to initiate data export' });
    }
  }
);

// Delete all user data
router.delete('/all',
  rateLimiter({ windowMs: 24 * 60 * 60 * 1000, max: 1 }), // 1 delete per day
  async (req, res) => {
    try {
      // Mock response - replace with actual deletion logic
      res.json({ 
        success: true, 
        message: 'All user data has been scheduled for deletion. This process may take up to 30 days to complete.'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete user data' });
    }
  }
);

module.exports = router;
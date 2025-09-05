const express = require('express');
const { body } = require('express-validator');
const { rateLimit } = require('express-rate-limit');
const router = express.Router();
const { authenticate } = require('../utils/auth');

// Rate limiter
const rateLimiter = (options) => rateLimit(options);

// Apply authentication to all routes
router.use(authenticate);

// Get notification settings
router.get('/settings', 
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }),
  async (req, res) => {
    try {
      // Mock response - replace with actual database logic
      const settings = {
        pushNotifications: true,
        emailNotifications: true,
        smsNotifications: false,
        bookingReminders: true,
        messageNotifications: true,
        marketingEmails: false,
        quietHours: {
          enabled: false,
          startTime: '22:00',
          endTime: '08:00'
        }
      };
      
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get notification settings' });
    }
  }
);

// Update notification settings
router.put('/settings',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 20 }),
  [
    body('pushNotifications').optional().isBoolean(),
    body('emailNotifications').optional().isBoolean(),
    body('smsNotifications').optional().isBoolean(),
    body('bookingReminders').optional().isBoolean(),
    body('messageNotifications').optional().isBoolean(),
    body('marketingEmails').optional().isBoolean(),
    body('quietHours.enabled').optional().isBoolean(),
    body('quietHours.startTime').optional().isString(),
    body('quietHours.endTime').optional().isString(),
  ],
  async (req, res) => {
    try {
      // Mock response - replace with actual database logic
      const updatedSettings = req.body;
      
      res.json({ 
        success: true, 
        message: 'Notification settings updated successfully',
        settings: updatedSettings 
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update notification settings' });
    }
  }
);

module.exports = router;
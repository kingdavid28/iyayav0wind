const express = require('express');
const { body } = require('express-validator');
const { rateLimit } = require('express-rate-limit');
const router = express.Router();
const { authenticate } = require('../utils/auth');

// Rate limiter
const rateLimiter = (options) => rateLimit(options);

// Apply authentication to all routes
router.use(authenticate);

// Get payment settings
router.get('/settings', 
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }),
  async (req, res) => {
    try {
      // Mock response - replace with actual database logic
      const settings = {
        defaultPaymentMethod: 'card',
        autoPayments: false,
        savePaymentInfo: true,
        receiveReceipts: true
      };
      
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get payment settings' });
    }
  }
);

// Update payment settings
router.put('/settings',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 20 }),
  [
    body('defaultPaymentMethod').optional().isString(),
    body('autoPayments').optional().isBoolean(),
    body('savePaymentInfo').optional().isBoolean(),
    body('receiveReceipts').optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      // Mock response - replace with actual database logic
      const updatedSettings = req.body;
      
      res.json({ 
        success: true, 
        message: 'Payment settings updated successfully',
        settings: updatedSettings 
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update payment settings' });
    }
  }
);

module.exports = router;
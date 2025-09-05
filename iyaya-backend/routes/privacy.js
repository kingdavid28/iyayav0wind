const express = require('express');
const { body, param, query } = require('express-validator');
const { rateLimit } = require('express-rate-limit');
const router = express.Router();
const privacyController = require('../controllers/privacyController');
const { authenticate, authorize } = require('../utils/auth');

// Rate limiter helper function
const rateLimiter = (options) => rateLimit(options);

// Apply authentication to all privacy routes
router.use(authenticate);

// Get privacy settings
router.get('/settings', 
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }), // 100 requests per 15 minutes
  privacyController.getPrivacySettings
);

// Update privacy settings
router.put('/settings',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 20 }), // 20 updates per 15 minutes
  [
    body('sharePhone').optional().isBoolean(),
    body('shareAddress').optional().isBoolean(),
    body('shareEmergencyContact').optional().isBoolean(),
    body('shareChildMedicalInfo').optional().isBoolean(),
    body('shareChildAllergies').optional().isBoolean(),
    body('shareChildBehaviorNotes').optional().isBoolean(),
    body('shareFinancialInfo').optional().isBoolean(),
    body('autoApproveBasicInfo').optional().isBoolean(),
  ],
  privacyController.updatePrivacySettings
);

// Request information from another user
router.post('/request',
  rateLimiter({ windowMs: 60 * 60 * 1000, max: 10 }), // 10 requests per hour
  [
    body('targetUserId').notEmpty().withMessage('Target user ID is required'),
    body('requestedFields').isArray({ min: 1 }).withMessage('At least one field must be requested'),
    body('requestedFields.*').isString().withMessage('Requested fields must be strings'),
    body('reason').notEmpty().isLength({ min: 10, max: 500 }).withMessage('Reason must be between 10-500 characters'),
  ],
  privacyController.requestInformation
);

// Respond to an information request
router.post('/respond',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 50 }), // 50 responses per 15 minutes
  [
    body('requestId').notEmpty().withMessage('Request ID is required'),
    body('approved').isBoolean().withMessage('Approved must be a boolean'),
    body('sharedFields').optional().isArray().withMessage('Shared fields must be an array'),
    body('sharedFields.*').optional().isString().withMessage('Shared fields must be strings'),
  ],
  privacyController.respondToRequest
);

// Get pending information requests
router.get('/requests/pending',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }), // 100 requests per 15 minutes
  privacyController.getPendingRequests
);

// Get privacy notifications
router.get('/notifications',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }), // 100 requests per 15 minutes
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
  ],
  privacyController.getPrivacyNotifications
);

// Mark notification as read
router.patch('/notifications/:notificationId/read',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 200 }), // 200 requests per 15 minutes
  [
    param('notificationId').isMongoId().withMessage('Invalid notification ID'),
  ],
  privacyController.markNotificationAsRead
);

// Get filtered profile data for a user
router.get('/profile/:targetUserId',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }), // 100 requests per 15 minutes
  [
    param('targetUserId').notEmpty().withMessage('Target user ID is required'),
  ],
  privacyController.getFilteredProfileData
);

module.exports = router;

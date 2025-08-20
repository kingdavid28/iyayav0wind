const express = require('express');
const router = express.Router();
const { rateLimit } = require('express-rate-limit');
const { authenticate, authorize } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// 1. Enhanced rate limiting for admin routes
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each user to 100 requests per window
  message: { 
    success: false, 
    error: 'Too many requests, please try again later' 
  },
  skip: (req) => req.user?.role === 'superadmin', // Skip for superadmins
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to all admin routes
router.use(adminLimiter);

// 2. Route definitions with comprehensive middleware
router.get('/dashboard', 
  authenticate,
  authorize(['admin', 'superadmin']),
  adminController.dashboard
);

router.get('/users',
  authenticate,
  authorize(['admin', 'superadmin']),
  adminController.listUsers
);

router.get('/users/:id',
  authenticate,
  authorize(['admin', 'superadmin']),
  adminController.getUserById
);

router.patch('/users/:userId/status',
  authenticate,
  authorize(['admin', 'superadmin']),
  adminController.updateUserStatus
);

router.patch('/providers/:userId/verify',
  authenticate,
  authorize(['superadmin']), // Only superadmin can verify
  adminController.verifyProviderDocuments
);

// 3. Debug output
console.log('\n🚀 Admin Routes Successfully Registered:');
console.log('GET    /dashboard');
console.log('GET    /users');
console.log('GET    /users/:id');
console.log('PATCH  /users/:userId/status');
console.log('PATCH  /providers/:userId/verify');

module.exports = router;